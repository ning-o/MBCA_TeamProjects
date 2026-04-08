import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  StyleSheet, 
  TouchableOpacity,
  Text, 
  View,   
  Image,
  ActivityIndicator,
  Alert 
} from 'react-native';

import LOGO_IMAGES from './../SubsImageURL';
import SubsChange from './SubsChange';
import apiClient from '../../../common/api/api_client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const SubsMainList = ( { subs , fetchUserSubs } )=>{
    
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

    const [isChanging, setIsChanging] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // 데이터 전달용 변수
    const [myInvenId, setMyInvenId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [matchedPackage, setMatchedPackage] = useState(null);
    // 변경하기 버튼 클릭시
    const handleEditPress = (item) => {
      setSelectedItem(item); // 클릭한 행의 데이터 저장
      setIsChanging(true);   // 화면 전환
    };

    // 2. 본인 로직: 화면 진입 시 ID 로드
    useEffect(() => {
        const getMyId = async () => {
            try {
                const userInfo = await AsyncStorage.getItem('userInfo');
                if (userInfo) {
                    const parsed = JSON.parse(userInfo);
                    // parsed.id 또는 parsed.inven_id 중 실제 키값 확인 필요
                    const id = parsed.id || parsed.inven_id;
                    if (id) setMyInvenId(id);
                }
            } catch (e) {
                console.error("ID 로드 실패:", e);
            }
        };
        getMyId();
    }, []);

    // 3. 본인 로직: 추천 패키지 API 호출
    useEffect(() => {
        const fetchMatchedPackage = async () => {
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

    return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={{borderBottomWidth:1}}>내 구독 리스트</Text>
            <View style={styles.headerbox}>
                {getLogo(subs).map((item, index) => (
                   <View key={item.id ?? index} style={styles.headerboxlist}>
                    <Image source={LOGO_IMAGES[item.logo]} style={styles.imageLogo} />
                  </View>
                ))}
            </View>
        </View>
        {!isChanging ? (
        <>
          <View style={styles.container}>
            <View style={styles.containertop}>
                <Text>구독 서비스 변경 추천</Text>
                <TouchableOpacity 
                    style={styles.containerSearchButton} 
                    onPress={() => {
                        if (matchedPackage) handleEditPress(matchedPackage);
                        else Alert.alert("알림", "추천 패키지가 없습니다.");
                    }}
                >
                    <Text style={styles.buttonText}>찾아보기</Text>
                </TouchableOpacity>
            </View>
            
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
                        <View key={item.id ?? index} style={styles.bottomboxlist}>                       
                          <Text style={[styles.bottombox, {flex:1,}]}>{item.category}</Text>
                          <View style={[styles.bottombox, {flex:4, flexDirection: 'row',}]}>
                            <Image source={LOGO_IMAGES[item.logo_img]} style={styles.imageLogo}></Image>
                            <Text style={{marginLeft:15}}>{item.name}</Text>
                          </View>
                          <Text style={[styles.bottombox, {flex:2}]}>{item.base_price}</Text>
                          <TouchableOpacity style={[styles.bottombutton, {marginLeft:10}]} onPress={() => handleEditPress(item)}>
                              <Text>변경{'\n'}하기</Text>
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
  },

  headerboxlist:{
    paddingHorizontal:5,
  },

  container: {    
    minHeight:100,
    borderBottomWidth:1,
  },

  containertop:{
    flexDirection: 'row',
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
  }


})

export default SubsMainList
