import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  StyleSheet, 
  View,   
  ScrollView,
  Dimensions 
} from 'react-native';

// 공용 헤더 & 푸터 불러오기
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

import SubsSearchList from './SubsComponents/SubsSearchList';
import Subsfooter from './SubsComponents/SubsFooter';
import BASE_URL, { API_ENDPOINTS } from './../../common/api/config';

const { width, height } = Dimensions.get('window');

// 사용자 구독 정보 데이터 불러오기
export const getUserSubs = async (userId) => {
  const res = await axios.get(
    `${BASE_URL}${API_ENDPOINTS.SUBS.GET_USER_SUBS(userId)}`
  );
  return res.data;
};

// 구독 카테고리 종류 데이터 불러오기
export const fetchUserSubscriptions = async () => {
  const res = await axios.get(
    `${BASE_URL}${API_ENDPOINTS.SUBS.GET_CATEGORIES}`
  );
  return res.data;
};

export default function SubScreenSearch() {
  const [subs, setSubs] = useState([]);
  const [category, setCategory] = useState([]);

  const userId = 1; // 임시

  // 시작시 사용자 구독 정보 가져오기
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const data = await getUserSubs(userId);
        const categoryData = await fetchUserSubscriptions();

        setSubs(data);
        setCategory(categoryData);
      } catch (error) {
        console.log('구독 데이터 불러오기 실패:', error);
      }
    };

    fetchSubs();
  }, [userId]);


  return (    
    <View style={styles.container}>
      {/* [고정] 공용 헤더 사용 */}
      <Header/>
      <View style={styles.mainbox}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>    
          <SubsSearchList subs={subs} category={category} />
        </ScrollView>

        <Subsfooter subs={subs} />
        
      </View>
      {/* [고정] 공용 푸터 사용 */}
      <Footer />
    </View>    
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#afd5fa', // 아이폰 스타일의 연한 회색 배경    
    justifyContent: 'center', // 자식(mainbox)을 세로 중앙으로
    alignItems: 'center',     // 자식(mainbox)을 가로 중앙으로

  },

  mainbox: {
    width: '100%',
    height:height - 15,    
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    borderWidth: 1,

  },

  scrollContent: {    
    paddingTop: 55,    
    paddingBottom:100,
    minHeight: '100%',
  },
  
});
