import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';

import CustomAddModal from './CustomAddSubs';
import LOGO_IMAGES from './../SubsImageURL';
import BASE_URL, { API_ENDPOINTS } from './../../../common/api/config';

const SubsSearchList = ({ subs, category, userId, triggerMainRefresh  }) => {
  const [subsList, setSubsList] = useState(subs || []);
  const [categorySubs, setCategorySubs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubscribe, setSelectedsubscribe] = useState(null);
  const [selectedprice, setSelectedprice] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    setSubsList(subs || []);
  }, [subs]);

  const getLogo = (list) => {
    if (!list || list.length === 0) return [];

    return list.map((item) => ({
      id: item.id,
      logo: item.logo_img,
    }));
  };

  const logoList = [
    ...new Map(categorySubs.map((item) => [item.logo_img, item])).values(),
  ];

  const subscribeData = categorySubs
    .filter((item) => item.logo_img === selectedsubscribe)
    .sort((a, b) => a.base_price - b.base_price);

  const handleCategorySelect = async (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setSelectedsubscribe(null);
      setSelectedprice(null);
      setSelectedDetail(null);
      setCategorySubs([]);
      return;
    }

    try {
      setSelectedCategory(categoryName);
      setSelectedsubscribe(null);
      setSelectedprice(null);
      setSelectedDetail(null);

      const response = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_BY_CATEGORY(categoryName)}`
      );

      setCategorySubs(response.data);
    } catch (error) {
      console.error('카테고리별 구독 서비스 조회 실패:', error);
      setCategorySubs([]);
      Alert.alert('실패', '카테고리 조회 중 오류가 발생했습니다.');
    }
  };

  const handlelogoSelect = (logoName) => {
    if (selectedsubscribe === logoName) {
      setSelectedsubscribe(null);
      setSelectedprice(null);
      setSelectedDetail(null);
      return;
    }

    setSelectedsubscribe(logoName);
    setSelectedprice(null);
    setSelectedDetail(null);
  };

  const handlepriceSelect = async (subsId) => {
    if (selectedprice === subsId) {
      setSelectedprice(null);
      setSelectedDetail(null);
      return;
    }

    try {
      setSelectedprice(subsId);

      const response = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_DETAIL(subsId)}`
      );

      const parsed = {
        ...response.data,
        detail:
          typeof response.data.detail === 'string'
            ? JSON.parse(response.data.detail)
            : response.data.detail,
      };

      setSelectedDetail(parsed);
    } catch (error) {
      console.error('요금제 상세 조회 실패:', error);
      setSelectedDetail(null);
      Alert.alert('실패', '요금제 상세 조회 중 오류가 발생했습니다.');
    }
  };

  const handleInsertSubs = async () => {
    try {
      if (!userId) {
        Alert.alert('실패', '사용자 정보가 없습니다.');
        return;
      }

      await axios.post(
        `${BASE_URL}${API_ENDPOINTS.SUBS.CREATE_MASTER_SUB(
          userId,
          selectedDetail.id
        )}`
      );      

      const refreshResponse = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_USER_SUBS(userId)}`
      );

      setSubsList(refreshResponse.data);
      triggerMainRefresh();

      Alert.alert('성공', '구독이 추가되었습니다.');
    } catch (error) {
      console.error('구독 추가 실패:', error);
      Alert.alert('실패', '구독 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 구독 서비스</Text>
        <View style={styles.headerList}>
          <View style={styles.headerbox}>
            {getLogo(subsList).map((item, index) => (
              <View key={`${item.logo}-${index}`} style={styles.headerboxlist}>
                <Image
                  source={LOGO_IMAGES[item.logo]}
                  style={styles.imageLogo}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.categoryList}>
          {category.map((item, index) => (
            <TouchableOpacity
              key={`${item}-${index}`}
              style={[styles.categorybox,selectedCategory === item && styles.selectedBox,]}
              onPress={() => handleCategorySelect(item)}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.categorycreatebutton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text>직접입력</Text>
        </TouchableOpacity>

        <CustomAddModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      </View>

      {/* 카테고리 선택시 구독 로고들 출력 */}
      {selectedCategory && (
        <View style={styles.bottom}>
          <View style={styles.bottomcategoryList}>
            {logoList.map((item, index) => (
              <TouchableOpacity
                key={`${item.logo_img}-${index}`}
                style={[styles.bottomcategorybox, selectedsubscribe === item.logo_img && styles.selectedBox,]}
                onPress={() => handlelogoSelect(item.logo_img)}
              >
                <Image
                  source={LOGO_IMAGES[item.logo_img]}
                  style={styles.imageLogo}
                />
              </TouchableOpacity>
            ))}
          </View>

          {selectedsubscribe && (
            <View style={styles.bottomprice}>
              <View style={styles.bottompriceList}>
                <View
                  style={[
                    styles.bottompricebox,
                    { borderBottomWidth: 1, height: 50 },
                  ]}
                >
                  <Image
                    source={LOGO_IMAGES[selectedsubscribe]}
                    style={styles.imageLogo}
                  />
                </View>

                {subscribeData.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.id}-${index}`}
                    style={[
                      styles.bottompricebox,
                      selectedprice === item.id && styles.selectedBox,
                    ]}
                    onPress={() => handlepriceSelect(item.id)}
                  >
                    <Text>{Number(item.base_price).toLocaleString()}원</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.bottompricedetail}>
                {selectedDetail && (
                  <View>
                    <Text>{selectedDetail.name}</Text>
                    <Text>
                      선택 가격 -{' '}
                      {Number(selectedDetail.base_price).toLocaleString()}원
                    </Text>
                    <Text></Text>

                    {selectedDetail.detail?.title && (
                      <Text style={styles.detailText}>
                        {selectedDetail.detail.title}
                      </Text>
                    )}

                    {selectedDetail.detail?.features?.map((item, i) => (
                      <Text key={i} style={styles.detailText}>
                        {item.device} :{' '}
                        {item.unlimited_listening ?? item.MP3_download ? 'O' : 'X'}
                      </Text>
                    ))}

                    {selectedDetail.detail?.content?.map((text, i) => (
                      <Text key={`c-${i}`} style={styles.detailText}>
                        {text}
                      </Text>
                    ))}

                    <TouchableOpacity
                      style={[styles.bottompricebox, {borderTopWidth:1, paddingTop:5}]}
                      onPress={handleInsertSubs}
                    >
                      <Text>추가하기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 5,
  },

  header: {
    margin: 5,
    borderBottomWidth: 1,
  },

  headerTitle: {
    height: 24,
    borderBottomWidth: 1,
  },

  headerList: {
    minHeight: 60,
    margin: 5,
  },

  headerbox: {
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  headerboxlist: {
    paddingHorizontal: 5,
    paddingTop:5,
  },

  container: {
    minHeight: 70,
    margin: 5,
    borderBottomWidth: 1,
  },

  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  categorybox: {
    margin: 3,
    marginHorizontal: 6,
    backgroundColor: '#ddd',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  selectedBox: {
    backgroundColor: '#aaa',
  },

  categorycreatebutton: {
    marginLeft: 'auto',
    marginTop: 'auto',
    padding: 5,
    margin: 5,
    backgroundColor: '#DDD',
  },

  bottom: {
    flex: 1,
    backgroundColor: '#fff',
  },

  bottomcategoryList: {
    flexDirection: 'row',
    height: 70,
    overflow: 'hidden',
  },

  bottomcategorybox: {
    margin: 3,
    marginHorizontal: 6,
    width: 30,
    height: 30,
    backgroundColor: '#ddd',
    borderRadius: 50,
  },

  bottomprice: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: 1,
    marginLeft: -5,
  },

  bottompriceList: {
    borderRightWidth: 1,
    flex: 1,
  },

  bottompricebox: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  bottompricedetail: {
    flex: 6,
    padding: 8,
  },

  detailText: {
    marginBottom: 4,
  },

  imageLogo: {
    width: 30,
    height: 30,
    borderRadius: 50,
    borderWidth: 1,
  },
});

export default SubsSearchList;