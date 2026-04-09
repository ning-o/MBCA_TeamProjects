import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions
} from 'react-native';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import SubsSearchList from './SubsComponents/SubsSearchList';
import Subsfooter from './SubsComponents/SubsFooter';
import BASE_URL, { API_ENDPOINTS } from './../../common/api/config';

const { height } = Dimensions.get('window');

export const getUserSubs = async (userId) => {
  const res = await axios.get(
    `${BASE_URL}${API_ENDPOINTS.SUBS.GET_USER_SUBS(userId)}`
  );
  return res.data;
};

export const fetchUserSubscriptions = async () => {
  const res = await axios.get(
    `${BASE_URL}${API_ENDPOINTS.SUBS.GET_CATEGORIES}`
  );
  return res.data;
};

const fetchMyProfile = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('userInfo');
    const userInfo = jsonValue != null ? JSON.parse(jsonValue) : null;
    return userInfo?.id || null;
  } catch (error) {
    console.error('프로필 로드 실패:', error);
    return null;
  }
};

export default function SubScreenSearch( {searchRefreshKey, triggerMainRefresh } ) {
  const [subs, setSubs] = useState([]);
  const [category, setCategory] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const id = await fetchMyProfile();
      if (id) setUserId(id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;

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
  }, [userId, searchRefreshKey]);

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.mainbox}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SubsSearchList subs={subs} category={category} userId={userId} setSubs={setSubs} triggerMainRefresh={triggerMainRefresh} />
        </ScrollView>

        <Subsfooter subs={subs} />
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#afd5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainbox: {
    width: '100%',
    height: height - 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
  },
  scrollContent: {
    paddingTop: 55,
    paddingBottom: 100,
    minHeight: '100%',
  },
});