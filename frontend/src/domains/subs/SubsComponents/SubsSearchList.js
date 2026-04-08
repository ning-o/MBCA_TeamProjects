 import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  StyleSheet,
} from 'react-native';
import axios from 'axios';

import CustomAddModal from './CustomAddSubs';
import LOGO_IMAGES from './../SubsImageURL';
import BASE_URL, { API_ENDPOINTS } from './../../../common/api/config';

const SubsSearchList = ({ subs, category }) => {
  const [categorySubs, setCategorySubs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubscribe, setSelectedsubscribe] = useState(null);
  const [selectedprice, setSelectedprice] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getLogo = (subs) => {
    if (!subs || subs.length === 0) return [];

    return subs.map((item) => ({
      id: item.id,
      logo: item.logo_img,
    }));
  };

  const logoList = [...new Map(
    categorySubs.map((item) => [item.logo_img, item])
  ).values()];

  const subscribeData = categorySubs.filter(
    (item) => item.logo_img === selectedsubscribe
  )
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

  const handlepriceSelect = async (subsId, price) => {
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

      // detail json 타입으로 변경
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
    }
  };

  const handleCustomSubmit = (value) => {
    console.log('새로 추가된 서비스:', value);
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={{ height: 24, borderBottomWidth: 1 }}>내 구독 서비스</Text>
        <View style={styles.headerList}>
          <View style={styles.headerbox}>
            {getLogo(subs).map((item, index) => (
              <View key={`${item.logo_img}-${index}`} style={styles.headerboxlist}>
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
              style={[styles.categorybox, selectedCategory === item && { backgroundColor: '#aaa' },]}
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
          onSubmit={handleCustomSubmit}
        />
      </View>

      {selectedCategory && (
        <View style={styles.bottom}>
          <View style={styles.bottomcategoryList}>
            {logoList.map((item, index) => (
              <TouchableOpacity
                key={`${item.logo_img}-${index}`}
                style={[styles.bottomcategorybox,selectedsubscribe === item.logo_img && { backgroundColor: '#aaa' },]}
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
                    style={[styles.bottompricebox, selectedprice === item.id && { backgroundColor: '#aaa' },]}
                    onPress={() => handlepriceSelect(item.id, item.base_price)}
                  >
                    <Text>{item.base_price}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.bottompricedetail}>
                {selectedDetail && (
                  <View>
                    <Text>{selectedDetail.name}</Text>
                    <Text>선택 가격 - {Number(selectedDetail.base_price).toLocaleString()}원</Text>
                    <Text></Text>
                    {selectedDetail ? (
                        <View>
                          {/* title */}
                          {selectedDetail.detail?.title && (
                            <Text style={styles.detailText}>
                              {selectedDetail.detail.title}
                            </Text>
                          )}

                          {/* features */}
                          {selectedDetail.detail.features?.map((item, i) => (
                            <Text key={i} style={styles.detailText}>
                              {item.device} : {item.unlimited_listening ?? item.MP3_download ? 'O' : 'X'}
                            </Text>
                          ))}

                          {/* content */}
                          {selectedDetail.detail?.content?.map((text, i) => (
                            <Text key={`c-${i}`} style={styles.detailText}>
                              {text}
                            </Text>
                          ))}
                        </View>
                        ) : (
                        <Text>상세 정보 없음</Text>
                    )}
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
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    // position: 'relative',
    padding: 5,
    
  },

  header:{        
    margin:5,    
    borderBottomWidth:1,
  },

  headerList:{
    minHeight:60,
    margin:5,    
  },

  headerbox:{
    padding: 2,    
    flexDirection: 'row',
  },

  headerboxlist:{
    paddingHorizontal:5,
  },

  container:{
    minHeight:70,
    margin: 5,
    borderBottomWidth:1,
  },

  categoryList:{    
    flexDirection:'row',    

  },

  categorybox:{
    margin:3,
    marginHorizontal:6,
    backgroundColor:'#ddd',
    borderRadius: 100 / 2,
    
  },

  categorycreatebutton:{
    marginLeft: 'auto',
    marginTop: 'auto',
    padding: 5,
    margin:5,
    backgroundColor: '#DDD',
  },

//   하단
  bottom: {
    flex: 1,
    backgroundColor: '#fff',
  },

  bottomcategoryList:{
    flexDirection:'row',
    height:70,
    overflow: 'hidden',     
  },

  bottomcategorybox:{
    margin:3,
    marginHorizontal:6,
    width:30,
    height:30,
    backgroundColor:'#ddd',
    borderRadius: 100 / 2,
  },

  bottomprice:{
    flex:1,
    flexDirection: 'row',
    borderTopWidth:1,
    marginLeft: -5,
  },

  bottompriceList:{    
    borderRightWidth:1,
    flex:1,
    
  },

  bottompricebox:{    
    padding:3,    
    justifyContent: 'center', 
    alignItems: 'center',     
    borderBottomWidth:1,     
  },

  bottompricedetail:{
    flex: 6,
  },

  imageLogo:{
    width: 30, 
    height: 30,
    borderRadius: 100 / 2,
    borderWidth:1,
  }

})

export default SubsSearchList
