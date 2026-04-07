import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import { ChevronRight } from 'lucide-react-native';
import apiClient from '../../common/api/api_client';

const RecipeList = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendedRecipes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // TODO: 백엔드 실제 추천 엔드포인트로 최종 확정되면 이 주소만 바꾸면 됨
      const response = await apiClient.get('/api/fridge/recommend/top5/1');

      console.log('[RecipeList] 추천 결과 원본:', response);

      const result = response?.data ?? response;

      // result가 배열로 바로 올 수도 있고
      // { top5: [...] } 형태로 올 수도 있어서 둘 다 대응
      const recipeList = Array.isArray(result)
        ? result
        : Array.isArray(result?.top5)
        ? result.top5
        : [];

      setRecommendedRecipes(recipeList);
    } catch (error) {
      console.error(
        '[RecipeList] 추천 조회 실패:',
        error?.response?.data || error
      );

      Alert.alert('오류', '추천 요리 목록을 불러오지 못했습니다.');
      setRecommendedRecipes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendedRecipes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecommendedRecipes();
    }, [])
  );

  const handlePressRecipe = (item) => {
    navigation.navigate('Recipe', {
      recipeId: item.recipe_id ?? item.id,
      recipeName: item.recipe_name ?? item.name,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="추천 요리 목록" showBack={true} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>추천 요리 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchRecommendedRecipes(true)}
                tintColor="#3B82F6"
              />
            }
          >
            <Text style={styles.subTitle}>
              내 냉장고 재료로 만들 수 있는 요리들
            </Text>

            {recommendedRecipes.length > 0 ? (
              recommendedRecipes.map((item, index) => (
                <TouchableOpacity
                  key={String(item.recipe_id ?? item.id ?? index)}
                  style={styles.recipeCard}
                  onPress={() => handlePressRecipe(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.matchBadge}>
                      일치율 {item.match_score ?? item.match ?? 0}%
                    </Text>

                    <Text style={styles.recipeName}>
                      {item.recipe_name ?? item.name ?? '이름 없는 레시피'}
                    </Text>

                    <Text style={styles.ingredientsText}>
                      사용 재료:{' '}
                      {Array.isArray(item.used_ingredients)
                        ? item.used_ingredients.join(', ')
                        : item.ingredients ?? '정보 없음'}
                    </Text>

                    {!!item.reason && (
                      <Text style={styles.reasonText}>{item.reason}</Text>
                    )}
                  </View>

                  <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>추천 가능한 요리가 없어요.</Text>
                <Text style={styles.emptySubText}>
                  냉장고 재료를 더 추가하거나 새로고침해보세요.
                </Text>
              </View>
            )}
          </ScrollView>

          <Footer />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  scrollContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 120,
  },

  subTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    fontWeight: '600',
  },

  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },

  cardInfo: {
    flex: 1,
  },

  matchBadge: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '700',
    marginBottom: 4,
  },

  recipeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },

  ingredientsText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
    lineHeight: 18,
  },

  reasonText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  emptyBox: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },

  emptySubText: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 13,
  },
});

export default RecipeList;