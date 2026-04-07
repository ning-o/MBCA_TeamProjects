import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // [조치] useSafeAreaInsets 추가

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import apiClient from '../../common/api/api_client';

const SeasonalRecommendFood = () => {
  const insets = useSafeAreaInsets(); // [조치] 기기별 상단 노치 높이 확보
  const [loading, setLoading] = useState(true);
  const [seasonalRecommend, setSeasonalRecommend] = useState(null);

  // 헤더 고정 높이(56) + 노치 높이(insets.top)를 합산하여 여백 설정
  const headerHeight = 56 + insets.top;

  const fetchSeasonalRecommend = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/api/fridge/recommend/seasonal', {
        ingredients: [],
        top_k: 3,
      });
      console.log('[SeasonalRecommendFood] 제철 음식 원본:', response);
      setSeasonalRecommend(response.data ?? response);
    } catch (error) {
      console.error('[SeasonalRecommendFood] 제철 음식 조회 실패:', error?.response?.data || error);
      Alert.alert('오류', error?.response?.data?.detail || '제철 음식을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonalRecommend();
  }, []);

  return (
    // edges={['bottom']} 설정을 통해 SafeAreaView가 상단 여백을 중복으로 잡지 않도록 조절
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Header />

      <ScrollView
        // [핵심] 헤더의 absolute 높이만큼 paddingTop을 부여하여 콘텐츠가 밀려 내려오게 조치
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + 20 }, // 헤더 높이 + 기본 여백(20)
          loading && styles.loadingContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>AI가 계절과 잘 어울리는 제철 음식을 가져오는중입니다...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>오늘의 제철 음식</Text>

            {seasonalRecommend && (
              <>
                <Text style={styles.context}>
                  {seasonalRecommend.season_context}
                </Text>

                {seasonalRecommend.top3?.map((item) => (
                  <View key={item.rank} style={styles.card}>
                    <Text style={styles.rank}>
                      {item.rank}. {item.menu_name}
                    </Text>
                    <Text style={styles.text}>이유: {item.reason}</Text>
                    <Text style={styles.text}>제철 포인트: {item.seasonal_point}</Text>
                    <Text style={styles.text}>
                      재료: {Array.isArray(item.main_ingredients) ? item.main_ingredients.join(', ') : ''}
                    </Text>
                    <Text style={styles.text}>대체재: {item.substitute_note}</Text>
                    <Text style={styles.text}>레시피: {item.quick_recipe}</Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.retryBtn} onPress={fetchSeasonalRecommend}>
                  <Text style={styles.retryBtnText}>다시 추천받기</Text>
                </TouchableOpacity>
              </>
            )}

            {!seasonalRecommend && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>추천 결과가 없습니다.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
};

export default SeasonalRecommendFood;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingBox: {
    flex: 1,
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  context: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3277',
    marginBottom: 10,
  },
  text: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  retryBtn: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});