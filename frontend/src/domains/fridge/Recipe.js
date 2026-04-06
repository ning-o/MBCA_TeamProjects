import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

// [수정]: 하드코딩된 SERVER_URL 대신 공통 apiClient를 임포트합니다.
import apiClient from '../../common/api/api_client';

const { height } = Dimensions.get('window');

const RecipeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // [수정]: fetch 대신 apiClient.post를 사용하여 네트워크 요청을 수행합니다.
  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // 테스트용 페이로드 데이터
      const payload = {
        input_stock: {
          계란: 2,
          양파: 5,
          대파: 3,
          간장: 30,
          참기름: 60,
        },
        top_k: 5,
      };

      /**
       * [변경 포인트]
       * 1. 하드코딩된 IP 주소를 완전히 제거했습니다.
       * 2. apiClient가 config.js의 설정을 따라 자동으로 현재 접속된 IP의 8000번 포트를 바라봅니다.
       * 3. apiClient 내부의 타임아웃(10초) 설정을 따르므로 별도의 AbortController 로직이 필요 없습니다.
       */
      const data = await apiClient.post('/api/fridge/recommend/test', payload);

      console.log("[3] 응답 데이터 수신 완료:", data);

      setRecipes(data.recommendations || []);
      setSelectedIndex(0);
    } catch (error) {
      console.log("[ERROR] fetchRecommendations:", error);
      // apiClient 인터셉터에서 이미 Alert을 띄워주지만, 상세 에러 확인을 위해 로그를 남깁니다.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const selectedRecipe = recipes[selectedIndex] || null;

  const matchRateText = useMemo(() => {
    if (!selectedRecipe) return '0%';
    return `${Math.round((selectedRecipe.score || 0) * 100)}%`;
  }, [selectedRecipe]);

  const ingredientItems = useMemo(() => {
    if (!selectedRecipe) return [];

    const matched = (selectedRecipe.matched_ingredients || []).map((name, idx) => ({
      id: `matched-${idx}`,
      name,
      checked: true,
    }));

    const missing = (selectedRecipe.missing_ingredients || []).map((name, idx) => ({
      id: `missing-${idx}`,
      name,
      checked: false,
    }));

    return [...matched, ...missing];
  }, [selectedRecipe]);

  const aiReason = useMemo(() => {
    if (!selectedRecipe) return '추천 결과가 없습니다.';

    const daysLeftText =
      selectedRecipe.days_left != null
        ? `${selectedRecipe.days_left}일 안에 활용 추천`
        : '빠르게 활용 추천';

    const matchedText =
      selectedRecipe.matched_ingredients?.length > 0
        ? selectedRecipe.matched_ingredients.join(', ')
        : '현재 보유 재료';

    return `현재 재료와의 매칭률이 높습니다. 특히 ${matchedText}를 바로 활용할 수 있고, ${daysLeftText} 기준 테스트 추천 레시피입니다.`;
  }, [selectedRecipe]);

  const recipeSteps = useMemo(() => {
    if (!selectedRecipe) return '레시피 설명이 없습니다.';

    const missing =
      selectedRecipe.missing_ingredients?.length > 0
        ? selectedRecipe.missing_ingredients.join(', ')
        : '없음';

    return [
      `1. 추천 레시피: ${selectedRecipe.recipe_name || '-'}`,
      `2. 현재 보유 재료를 먼저 준비합니다: ${(selectedRecipe.matched_ingredients || []).join(', ') || '-'}`,
      `3. 부족한 재료가 있다면 추가 준비합니다: ${missing}`,
      `4. 조리시간은 ${selectedRecipe.cooking_time ?? '-'}분, 난이도는 ${selectedRecipe.difficulty ?? '-'}입니다.`,
      `5. 현재 단계는 테스트 화면이므로 상세 조리법 대신 추천 결과를 우선 검증합니다.`,
    ].join('\n');
  }, [selectedRecipe]);

  const tags = useMemo(() => {
    if (!selectedRecipe) return [];
    return [
      selectedRecipe.category ? `#${selectedRecipe.category}` : '#추천',
      selectedRecipe.cooking_time ? `#${selectedRecipe.cooking_time}분` : '#시간미정',
      selectedRecipe.days_left != null ? `#${selectedRecipe.days_left}일내활용` : '#테스트',
    ];
  }, [selectedRecipe]);

  const handleComplete = () => {
    Alert.alert('테스트', '지금은 추천 화면 연결 테스트 단계입니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 60 }} />

        <TouchableOpacity style={styles.reloadButton} onPress={fetchRecommendations}>
          <Text style={styles.reloadButtonText}>추천 다시 불러오기</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : !selectedRecipe ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>추천 결과가 없습니다.</Text>
          </View>
        ) : (
          <>
            <View style={styles.recommendCard}>
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{selectedIndex + 1}위</Text>
                </View>
                <Text style={styles.matchText}>
                  매칭률 <Text style={styles.matchPercent}>{matchRateText}</Text>
                </Text>
              </View>

              <View style={styles.cardMain}>
                <Text style={styles.foodTitle}>{selectedRecipe.recipe_name || '-'}</Text>

                <View style={styles.tagRow}>
                  {tags.map((tag, i) => (
                    <Text key={i} style={styles.tagText}>
                      {tag}{' '}
                    </Text>
                  ))}
                </View>

                <Text style={styles.infoText}>
                  ⏱ {selectedRecipe.cooking_time ?? '-'} mins  |  난이도 :{' '}
                  {selectedRecipe.difficulty ?? '-'}
                </Text>
                <Text style={styles.infoSubText}>
                  남은 유통기한(테스트): {selectedRecipe.days_left ?? '-'}일
                </Text>
              </View>
            </View>

            {recipes.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>다른 추천</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recipes.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.recipe_id ?? index}`}
                      style={[
                        styles.miniCard,
                        index === selectedIndex && styles.miniCardSelected,
                      ]}
                      onPress={() => setSelectedIndex(index)}
                    >
                      <Text
                        style={[
                          styles.miniCardTitle,
                          index === selectedIndex && styles.miniCardTitleSelected,
                        ]}
                      >
                        {index + 1}. {item.recipe_name}
                      </Text>
                      <Text
                        style={[
                          styles.miniCardText,
                          index === selectedIndex && styles.miniCardTitleSelected,
                        ]}
                      >
                        매칭률 {Math.round((item.score || 0) * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.bottomSheet}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI's Pick Reason</Text>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiText}>{aiReason}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recipe Step</Text>
                <View style={styles.recipeDetailBox}>
                  <Text style={styles.recipeDetailText}>{recipeSteps}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {ingredientItems.map((item) => (
                  <View key={item.id} style={styles.ingredientRow}>
                    <View style={[styles.checkBox, item.checked && styles.checkedBox]}>
                      {item.checked && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                <Text style={styles.completeButtonText}>요리 완료!</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 100 },

  reloadButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  emptyBox: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },

  recommendCard: {
    backgroundColor: '#1E293B',
    borderRadius: 30,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rankBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rankText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  matchText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  matchPercent: { color: '#818CF8', fontSize: 18 },
  foodTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  tagText: { color: '#818CF8', fontWeight: 'bold', fontSize: 14 },
  infoText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  infoSubText: { color: '#CBD5E1', fontSize: 13, marginTop: 6 },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 40,
    minHeight: height * 0.5,
  },
  section: { marginTop: 25, marginHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
  },

  miniCard: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 10,
    minWidth: 130,
  },
  miniCardSelected: {
    backgroundColor: '#1E293B',
  },
  miniCardTitle: {
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 4,
  },
  miniCardTitleSelected: {
    color: '#FFFFFF',
  },
  miniCardText: {
    color: '#475569',
    fontSize: 12,
  },

  aiBubble: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  aiText: { color: '#475569', fontSize: 15, lineHeight: 24 },

  recipeDetailBox: {
    backgroundColor: '#F1F5F9',
    padding: 20,
    borderRadius: 20,
  },
  recipeDetailText: { color: '#334155', fontSize: 15, lineHeight: 26 },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  ingredientName: { fontSize: 16, color: '#334155' },

  completeButton: {
    marginTop: 40,
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  completeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default RecipeScreen;