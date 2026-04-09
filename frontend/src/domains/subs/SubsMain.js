import React, { useEffect, useState } from 'react';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import SubsMainList from './SubsComponents/SubsMainList';
import Subsfooter from './SubsComponents/SubsFooter';
import BASE_URL, { API_ENDPOINTS } from './../../common/api/config';

const { width, height } = Dimensions.get('window');

export const getUserSubs = async (userId) => {
  const res = await axios.get(
    `${BASE_URL}${API_ENDPOINTS.SUBS.GET_USER_SUBS(userId)}`
  );
  return res.data;
};

const fetchMyProfile = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('userInfo');
    const userInfo = jsonValue != null ? JSON.parse(jsonValue) : null;

    if (userInfo?.id) {
      return userInfo.id;
    }

    return null;
  } catch (error) {
    console.error('데이터 로드 중 사고 발생:', error);
    return null;
  }
};

export default function SubsMain({ mainRefreshKey , triggerSearchRefresh }) {
  const insets = useSafeAreaInsets();
  const [subs, setSubs] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const id = await fetchMyProfile();
      if (id) {
        setUserId(id);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!userId) return;    

    fetchUserSubs();
  }, [userId, mainRefreshKey]);

  const fetchUserSubs = async () => {
      try {
        const data = await getUserSubs(userId);
        setSubs(data);
      } catch (error) {
        console.log('구독 데이터 불러오기 실패:', error);
      }
    };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 56 },
        ]}
      >
        <View style={styles.mainbox}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SubsMainList subs={subs} fetchUserSubs={fetchUserSubs} triggerSearchRefresh={triggerSearchRefresh} />            
          </ScrollView>

          <Subsfooter subs={subs} />
        </View>
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
    width: width,
    height: height,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    overflow: 'hidden',
  },

  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
    minHeight: '100%',
  },
});