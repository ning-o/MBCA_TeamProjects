import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

import LOGO_IMAGES from './../SubsImageURL';
import BASE_URL, { API_ENDPOINTS } from './../../../common/api/config';

const SubsChangeList = ({ category, onBack, onSelect }) => {
  const [categorySubs, setCategorySubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategorySubs = async (categoryName) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${BASE_URL}${API_ENDPOINTS.SUBS.GET_BY_CATEGORY(categoryName)}`
      );

      // 같은 로고 중복 제거
      const uniqueLogoList = [
        ...new Set(response.data.map((item) => item.logo_img)),
      ];

      setCategorySubs(uniqueLogoList);
    } catch (error) {
      console.log('카테고리 구독 목록 조회 실패:', error);
      setCategorySubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      fetchCategorySubs(category);
    }
  }, [category]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.logoListbox}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" />
              <Text style={{ marginTop: 6 }}>목록 불러오는 중...</Text>
            </View>
          ) : (
            categorySubs.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.logoList}>
                <TouchableOpacity onPress={() => onSelect(item)}>
                  <Image
                    source={LOGO_IMAGES[item]}
                    style={styles.imageLogo}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
          >
            <Text>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  logoListbox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth:1,
    padding: 10,
    gap: 10,
  },

  logoList: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageLogo: {
    width: 45,
    height: 45,
    borderRadius: 50,
    borderWidth: 1,
  },

  loadingBox: {
    width: '100%',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottom: {
    marginTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  backButton: {
    marginLeft: 'auto',
    backgroundColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

export default SubsChangeList;