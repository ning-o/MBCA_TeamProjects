import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  StyleSheet, 
  TouchableOpacity,
  Text, 
  View,   
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import LOGO_IMAGES from './../SubsImageURL';
import SubsChange from './SubsChange';
import apiClient from '../../../common/api/api_client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL, { API_ENDPOINTS } from './../../../common/api/config';


const SubsMainList = ( { subs , fetchUserSubs, triggerSearchRefresh  } )=>{
  const [isChanging, setIsChanging] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // 데이터 전달용 변수
  const [recommendData, setRecommendData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);    
  const [isLoading, setIsLoading] = useState(true);
  const [matchedPackage, setMatchedPackage] = useState(null);

  useEffect(() => {
    getRecommend();
  }, [subs]);

  useEffect(() => {
    const fetchMatchedPackage = async () => {
      const myInvenId = subs[0].user_id;
      if (!myInvenId) return;
      
      try {
        const response = await apiClient.get(`/api/subs/matched-packages/${myInvenId}`);
        if (response && response.status === "success" && response.data?.length > 0) {
            setMatchedPackage(response.data[0]);
        }
      } catch (error) {
        console.error("추천 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatchedPackage();
  }, [myInvenId]);

  // 사용자가 구독한 구독 로고 이미지 - list형식으로 변환
  const getLogo = (subs) => {
    if (!subs || subs.length === 0) return [];

    return subs.map(item => ({
      id: item.master_id,          // user_sub_id
      logo: item.logo_img   // 로고
    }));      
  };

  // 사용자가 구독한 구독 서비스 정보 dict형식으로 변환
  const userSubsInfo = (subs) => {
    if (!subs || subs.length === 0) return [];

    return subs.map(item => ({
      id: item.master_id,
      name: item.name,
      logo_img: item.logo_img,
      base_price: Number(item.base_price),
      category: item.category
    }));
  };

  const makeRecommendPayload = (subs) => {
    const payload = {
      나이: 25,
      OTT_count: 0,
      OTT_price: 0,
      통신사_price: 0,
      배달_count: 0,
      배달_price: 0,
      쇼핑_count: 0,
      쇼핑_price: 0,
      음악_count: 0,
      음악_price: 0,
      자기계발_count: 0,
      자기계발_price: 0
    };

    subs.forEach((item) => {
      const price = Number(item.base_price) || 0;
      const category = item.category;

      if (category === 'OTT') {
        payload.OTT_count += 1;
        payload.OTT_price += price;
      } else if (category === '통신') {
        payload.통신사_price += price;
      } else if (category === '배달') {
        payload.배달_count += 1;
        payload.배달_price += price;
      } else if (category === '쇼핑') {
        payload.쇼핑_count += 1;
        payload.쇼핑_price += price;
      } else if (category === '음악') {
        payload.음악_count += 1;
        payload.음악_price += price;
      } else if (category === '자기계발') {
        payload.자기계발_count += 1;
        payload.자기계발_price += price;
      }
    });

    return payload;
  };

  const getRecommend = async () => {
    if (!subs || subs.length === 0) return;

    try {
      const payload = makeRecommendPayload(subs);

      const res = await axios.post(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_RECOMMEND_SUBS}`,
        payload
      );

      setRecommendData(res.data);            
    } catch (e) {
      console.log('추천 실패:', e);
    }
  };

  const getOveruseInfo = () => {
    if (!recommendData || !subs) return {};

    const recommend = recommendData.recommendations;
    const current = makeRecommendPayload(subs);

    const result = {};

    Object.keys(recommend).forEach((key) => {
      const priceKey = `${key}_price`;

      const currentPrice = current[priceKey] || 0;
      let recommendPrice = recommend[key][1];
      const recommendCount = recommend[key][0];

      // 평균 개수 0이면 가격도 0으로 계산
      if (recommendCount === 0) {
        recommendPrice = 0;
      }

      const diff = currentPrice - recommendPrice;

      // [개수, 가격차이]
      result[key] = [recommend[key][0], diff];
      
      
    });

    return result;
  };

  // 변경하기 버튼 클릭시
  const handleEditPress = (item) => {
    setSelectedItem(item); // 클릭한 행의 데이터 저장
    setIsChanging(true);   // 화면 전환
  };

  // 해지하기 버튼 클릭시 db 삭제
  const handleDeletePress = async (item) => {
    const userId = subs[0].user_id; // 현재 유저

    try {
      await axios.delete(
        `${BASE_URL}${API_ENDPOINTS.SUBS.DELETE_USER_SUB(userId, item.id)}`
      );
      
      // 삭제 후 리스트 다시 불러오기
      fetchUserSubs();
      triggerSearchRefresh()
    } catch (e) {
      console.log('삭제 실패:', e);
    }
  };

  const overuseMap = getOveruseInfo();
  let category = '';
  let diff = 0;

  // 평균하고 가격 차이 가장 큰 카테고리
  Object.keys(overuseMap).forEach((key) => {
    const currentDiff = overuseMap[key][1];

    if (currentDiff > diff) {
      diff = currentDiff;
      category = key;
    }
  });

  // 팝업창 데이터
  const getPopupData = () => {
    if (!overuseMap || Object.keys(overuseMap).length === 0) return [];

    const categoryLabelMap = {
      OTT: 'OTT',
      통신사: '통신',
      배달: '배달',
      쇼핑: '쇼핑',
      음악: '음악',
      자기계발: '자기계발',
    };

    const current = makeRecommendPayload(subs);

    const myCountMap = {
      OTT: current.OTT_count || 0,
      통신사: current.통신사_price > 0 ? 1 : 0,
      배달: current.배달_count || 0,
      쇼핑: current.쇼핑_count || 0,
      음악: current.음악_count || 0,
      자기계발: current.자기계발_count || 0,
    };

    return Object.keys(overuseMap).map((key) => {
      const avgCount = recommendData?.recommendations?.[key]?.[0] || 0;
      let avgPrice = recommendData?.recommendations?.[key]?.[1] || 0;
      if (avgCount === 0) {
        avgPrice = 0;
      }
      const diffPrice = overuseMap[key]?.[1] || 0;
      const myPrice = current[`${key}_price`] || 0;

      return {
        key,
        label: categoryLabelMap[key] || key,
        myCount: myCountMap[key] || 0,
        myPrice,
        avgCount,
        avgPrice,
        diffPrice,
      };
    });
  };

  const popupData = getPopupData();

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };


  return (
  <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
          <Text style={{borderBottomWidth:1}}>내 구독 리스트</Text>
          <View style={styles.headerbox}>
              {getLogo(subs).map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.headerboxlist}>
                  <Image source={LOGO_IMAGES[item.logo]} style={styles.imageLogo} />
                </View>
              ))}
          </View>
      </View>
      {!isChanging ? (
      <>
        <View style={styles.container}>
          <View style={styles.containertop}>
            <Text>구독 서비스 상세 정보</Text>
            <TouchableOpacity style={styles.containerSearchButton} onPress={handleOpenModal}>
                <Text style={styles.buttonText}>상세정보</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.containerSearchButton} 
                onPress={() => {
                    if (matchedPackage) handleEditPress(matchedPackage);
                    else Alert.alert("알림", "추천 패키지가 없습니다.");
                }}
            >
                <Text style={styles.buttonText}>찾아보기</Text>
            </TouchableOpacity>
            {diff > 0 && (
              <Text>
                {category}에서 비슷한 유형의 사용자 보다 {diff.toLocaleString()} 원 정도 더 쓰고 있습니다
              </Text>
            )}
          </View>

          {/* 추천 시스템 */}
          <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : matchedPackage ? (
              <TouchableOpacity 
                  style={styles.recommendCard}
                  onPress={() => handleEditPress(matchedPackage)}
              >
                <Text style={styles.recommendTitle}>🎁 {matchedPackage.master_name}</Text>
                <Text style={styles.recommendMsg}>
                    {matchedPackage.combined_services.join(' + ')} 결합 시
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.oldPrice}>{matchedPackage.comb_amt?.toLocaleString()}원</Text>
                    <Text style={styles.newPrice}> → {matchedPackage.master_amt?.toLocaleString()}원</Text>
                    <Text style={styles.saveTag}> (절약 가능!)</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#999', fontSize: 12 }}>현재 추천 상품이 없습니다.</Text>
            )}
          </View>          
        </View>

        <View style={styles.bottom}>
            <Text style={{borderBottomWidth:1, padding:5}}>구독 서비스 요금제 목록</Text>
            {userSubsInfo(subs).map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.bottomboxlist}>                       
                <Text style={[styles.bottombox, {flex:1,}]}>{item.category}</Text>
                <View style={[styles.bottombox, {flex:3, flexDirection: 'row',}]}>
                  <Image source={LOGO_IMAGES[item.logo_img]} style={styles.imageLogo}></Image>
                  <Text style={{marginLeft:15}}>{item.name}</Text>
                </View>                
                <Text style={[styles.bottombox, {flex:1}]}>{item.base_price}</Text>
                <TouchableOpacity style={[styles.bottombutton, {marginLeft:10}]} onPress={() => handleEditPress(item)}>
                    <Text>변경{'\n'}하기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bottombutton, {marginLeft:1}]} onPress={() => handleDeletePress(item)}>
                    <Text>해지{'\n'}하기</Text>
                </TouchableOpacity>
                
            </View>
            ))}
        </View>
      </>
      ) : (
        // === 변경하기 클릭 시 새 공간 ===
      <View style={styles.ChangeContainer}>
        <SubsChange                         
          data={selectedItem} 
          userid={subs[0].user_id}
          onBack={() => setIsChanging(false)}
          onRefresh={fetchUserSubs}
        />
      </View>
    )}

    {/* 팝업창 */}
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>카테고리별 평균 / 가격 차이</Text>

          {popupData.length > 0 ? (
            popupData.map((item) => (
              <View key={item.key} style={styles.modalRow}>
                <Text style={styles.modalCategory}>
                  {item.label} ({item.myCount}개)
                </Text>                
                <Text style={styles.modalText}>평균 가입 개수 - {item.avgCount}개</Text>
                <Text style={styles.modalText}>평균 : {item.avgPrice}원</Text>
                <Text style={styles.modalText}>내 가입 : {item.myPrice}원</Text>
                <Text style={styles.modalText}>
                  차이 : {item.diffPrice > 0 ? ` +${item.diffPrice}` : item.diffPrice}원
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.modalText}>표시할 데이터가 없습니다.</Text>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.buttonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    position: 'relative',
    padding: 5,    
    
  },

  header:{
    minHeight: 130,
    borderBottomWidth: 1,
  },

  headerbox:{
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  headerboxlist:{
    paddingHorizontal:5,
    paddingTop: 5,
  },

  container: {    
    minHeight:100,
    borderBottomWidth:1,
  },

  containertop:{
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding:5,
    
  },

  containerSearchButton:{
    marginLeft: 'auto',
    paddingHorizontal: 5,
    backgroundColor: '#DDD',
  },

  bottom:{
    flex:1,    
  },

  bottomboxlist:{        
    flexDirection: 'row',     
    borderBottomWidth:1,    
    maxHeight:60,        
  },
  
  bottombox:{    
    alignItems: 'center',    
    paddingHorizontal:10,
    paddingVertical: 10, 
    borderRightWidth:1,    
  },

  bottombutton:{
    width:35, 
    height:45, 
    backgroundColor:'lightgray',
    marginRight:10,
    justifyContent: 'center',
    alignItems: 'center',
    
  },

  imageLogo:{
    width: 30, 
    height: 30,
    borderRadius: 100 / 2,
    borderWidth:1,
  },

  // 변경하기 클릭후 화면
  ChangeContainer: {
    flex: 1,     
    backgroundColor: '#fff',
},

  recommendCard: {
    margin: 10,
    padding: 15,
    backgroundColor: '#E3F2FD', // 연한 파란색 배경
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  recommendMsg: {
    fontSize: 13,
    color: '#555',
    marginVertical: 4,
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  newPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginLeft: 5,
  },
  saveTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },


  // 팝업창
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  modalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },

  modalCategory: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalText: {
    fontSize: 14,
    marginTop: 4,
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: '#DDD',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

})

export default SubsMainList
