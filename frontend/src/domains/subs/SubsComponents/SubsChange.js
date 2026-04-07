import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import axios from 'axios';
import LOGO_IMAGES from './../SubsImageURL';
import SubsChangeList from './SubsChangeList';
import BASE_URL, { API_ENDPOINTS } from './config';

const SubsChange = ({ data, onBack }) => {
  const [isChanging, setIsChanging] = useState(false);
  const [priceData, setPriceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedService, setSelectedService] = useState({
    name: data.name,
    logo: data.logo,
    price: data.price,
  });

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // 카테고리별 목록 조회
  const fetchCategoryData = async (category) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_BY_CATEGORY(category)}`        
      );

      const groupedData = {};

      res.data.forEach((item) => {
        const logoKey = item.logo_img;

        if (!groupedData[logoKey]) {
          groupedData[logoKey] = [];
        }

        groupedData[logoKey].push({
          id: item.id,
          price: item.base_price,
          category: item.category,
          logo_img: item.logo_img,
        });
      });

      setPriceData(groupedData);
    } catch (error) {
      console.log('카테고리 목록 조회 실패:', error);
      setPriceData({});
    } finally {
      setLoading(false);
    }
  };

  // 상세 조회
  const fetchDetailById = async (subsId) => {
    try {
      setDetailLoading(true);

      const res = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_DETAIL(subsId)}`
      );
      
      // SELECT * 결과 전체 저장
      setSelectedDetail(res.data);
    } catch (error) {
      console.log('상세 조회 실패:', error);
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (data?.category) {
      fetchCategoryData(data.category);
    }
  }, [data?.category]);

  const handlePriceSelect = async (plan) => {
    if (selectedPlanId === plan.id) {
      setSelectedPlanId(null);
      setSelectedPrice(null);
      setSelectedDetail(null);
      return;
    }

    setSelectedPlanId(plan.id);
    setSelectedPrice(plan.price);
    await fetchDetailById(plan.id);
  };

  const handlechangePrice = async () => {
    try {
        if (!selectedPlanId) return;

        await axios.post(
            config.SUBS.UPDATE_USER_SUB(data.user_id, selectedPlanId, data.id)
        );
        
    } catch (error) {
        console.log('요금제 변경 실패:', error);
        }
    };

  const handleServiceSelect = (logoName) => {
    const firstPlan = priceData[logoName]?.[0];

    setSelectedService({
      name: logoName,
      logo: logoName,
      price: firstPlan?.price || 0,
    });

    setIsChanging(false);
    setSelectedPlanId(null);
    setSelectedPrice(null);
    setSelectedDetail(null);
  };

  const currentPriceInfo = priceData[selectedService.logo] || [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={{ marginRight: 10 }}>{data.category}</Text>
          <Image source={LOGO_IMAGES[data.logo]} style={[styles.imageLogo, { marginRight: 20 }]}/>
          <Text style={{ marginRight: 10 }}>{data.name}</Text>
          <Text style={{ marginLeft: 'auto' }}>
            {Number(data.price).toLocaleString()}원
          </Text>
          <View style={styles.headerButtonbox}>
            <TouchableOpacity
              style={[styles.headerButton, isChanging && { opacity: 0.5 }]}
              onPress={() => {
                handlechangePrice();
                onBack();
              }}
              disabled={isChanging}
            >
              <Text style={[{ fontSize: 12 }, isChanging && { color: '#A0A0A0' }]}>
                변경{'\n'}하기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsChanging(true)}
            >
              <Text style={{ fontSize: 12 }}>
                다른{'\n'}구독
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isChanging ? (
          <View style={styles.bottomprice}>
            <View style={styles.bottompriceList}>
              <View style={{width: '100%', alignItems: 'center', borderBottomWidth: 1,}}>
                <Image
                  source={LOGO_IMAGES[selectedService.logo]}
                  style={[styles.imageLogo, { marginVertical: 5 }]}
                />
              </View>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" />
                  <Text style={{ marginTop: 6 }}>목록 불러오는 중...</Text>
                </View>
              ) : currentPriceInfo.length > 0 ? (
                currentPriceInfo.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.bottompricebox,
                      selectedPlanId === plan.id && styles.selectedPriceBox,
                    ]}
                    onPress={() => handlePriceSelect(plan)}
                  >
                    <Text>{Number(plan.price).toLocaleString()}원</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.loadingBox}>
                  <Text>요금제 데이터 없음</Text>
                </View>
              )}
            </View>

            <View style={styles.bottompricedetail}>
              {detailLoading ? (
                <View style={styles.detailCenter}>
                  <ActivityIndicator size="small" />
                  <Text style={{ marginTop: 8 }}>상세 불러오는 중...</Text>
                </View>
              ) : selectedPrice ? (
                <ScrollView contentContainerStyle={{ padding: 10 }}>
                  <Text style={styles.detailTitle}>
                    선택 가격 - {Number(selectedPrice).toLocaleString()}원
                  </Text>
                  {selectedDetail ? (
                    <Text style={styles.detailText}>
                      {JSON.stringify(selectedDetail, null, 2)}
                    </Text>
                  ) : (
                    <Text style={styles.detailText}>상세 정보 없음</Text>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.detailCenter}>
                  <Text></Text>
                </View>
              )}

              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text>뒤로 가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.ChangeContainer}>
            <SubsChangeList
              category={data.category}
              onBack={() => setIsChanging(false)}
              onSelect={handleServiceSelect}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 50,
    marginLeft: 5,
  },

  imageLogo: {
    width: 30,
    height: 30,
    borderRadius: 50,
    borderWidth: 1,
  },

  headerButtonbox: {
    marginLeft: 'auto',
    flexDirection: 'row',
    paddingLeft: 10,
    borderLeftWidth: 1,
  },

  headerButton: {
    width: 35,
    height: 45,
    backgroundColor: 'lightgray',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomprice: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: 1,
  },

  bottompriceList: {
    borderRightWidth: 1,
    flex: 1,
  },

  logoTopBox: {
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  bottompricebox: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
  },

  selectedPriceBox: {
    backgroundColor: '#aaa',
  },

  bottompricedetail: {
    flex: 6,
    minHeight: 300,
  },

  loadingBox: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },

  backButton: {
    marginLeft: 'auto',
    marginTop: 'auto',
    backgroundColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  ChangeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default SubsChange;