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
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import apiClient from '../../common/api/api_client';

const SeasonalRecommendFood = () => {
  const [loading, setLoading] = useState(true);
  const [seasonalRecommend, setSeasonalRecommend] = useState(null);

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
      console.error(
        '[SeasonalRecommendFood] 제철 음식 조회 실패:',
        error?.response?.data || error
      );

      Alert.alert(
        '오류',
        error?.response?.data?.detail || '제철 음식을 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonalRecommend();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {!loading && <Header />}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          loading && styles.loadingContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
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
                    <Text style={styles.text}>
                      제철 포인트: {item.seasonal_point}
                    </Text>
                    <Text style={styles.text}>
                      재료:{' '}
                      {Array.isArray(item.main_ingredients)
                        ? item.main_ingredients.join(', ')
                        : ''}
                    </Text>
                    <Text style={styles.text}>
                      대체재: {item.substitute_note}
                    </Text>
                    <Text style={styles.text}>
                      레시피: {item.quick_recipe}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={fetchSeasonalRecommend}
                >
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

      {!loading && <Footer />}
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
    padding: 20,
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