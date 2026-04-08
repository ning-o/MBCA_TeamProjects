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
import { useNavigation } from '@react-navigation/native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import apiClient from '../../common/api/api_client'; // 공통 API 클라이언트

const { height } = Dimensions.get('window');

const getDifficultyText = (value) =>{
  const num = Number(value);

  if(num ===1) return "쉬움";
  if(num ===2) return "보통";
  if(num ===3) return "어려움";

  return value ?? '-';
}

const RecipeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [invenId, setInvenId] = useState(1);

  /**
   * buildInputStock: 서버 응답 데이터를 AI 모델 입력 규격(Dict)으로 변환
   */
  const buildInputStock = (inventoryData) => {
    const stock = {};

    (inventoryData || []).forEach((item) => {
      const name = item.item_name || item.name || item.ingredient_name;
      const quantity = item.quantity ?? item.amount ?? 1;

      if (!name) return;
      stock[name] = quantity;
    });

    return stock;
  };

  /**
   * fetchRecommendations: apiClient 적용
   */
  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // 1) 실제 냉장고 재고 조회
      const inventoryResult = await apiClient.get(apiClient.urls.FRIDGE.GET_INVENTORY(1));
      console.log('[1] inventory raw =', inventoryResult);

      const inventoryList =
        inventoryResult?.items ||
        inventoryResult?.inventory ||
        inventoryResult?.data ||
        inventoryResult ||
        [];

      console.log('[2] inventory list =', inventoryList);

      // 2) 추천용 input_stock 변환
      const input_stock = buildInputStock(inventoryList);
      console.log('[3] input_stock =', input_stock);

      // 3) 추천 API 호출
      const result = await apiClient.post(apiClient.urls.FRIDGE.RECOMMEND_RECIPE, {
        input_stock,
        top_k: 5,
      });

      console.log('[4] recommend result =', result);

      setRecipes(result?.recipes || []);
      setSelectedIndex(0);
    } catch (error) {
      console.log('[ERROR] fetchRecommendations:', error);
      console.log('[ERROR] detail:', error?.response?.data?.detail);
      console.log('[ERROR] status:', error?.response?.status);
      console.log('[ERROR] data:', error?.response?.data);
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
    return `${Math.round((selectedRecipe.match_score || 0) * 100)}%`;
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

    const matched = selectedRecipe.available_ingredients || [];
    const missing = selectedRecipe.missing_ingredients || [];
    const difficultyText = getDifficultyText(selectedRecipe.difficulty);

    const matchedText =
      matched.length > 0 ? matched.join(', ') : '보유 재료';

    const missingText =
      missing.length > 0 ? missing.join(', ') : '추가 재료 없이 바로 조리 가능';

    return `현재 냉장고에 있는 ${matchedText}를 바로 활용할 수 있고, 부족한 재료는 ${missingText}입니다. 조리시간은 약 ${selectedRecipe.cooking_time ?? '-'}분 정도이며 난이도는 ${difficultyText}입니다.`;
  }, [selectedRecipe]);

  const recipeSteps = useMemo(() => {
    if (!selectedRecipe) return '레시피 설명이 없습니다.';

    const available = selectedRecipe.available_ingredients || [];
    const missing = selectedRecipe.missing_ingredients || [];
    const difficultyText = getDifficultyText(selectedRecipe.difficulty);

    return [
      `메뉴: ${selectedRecipe.recipe_name || '-'}`,
      `메인 재료: ${available.length > 0 ? available.join(', ') : '-'}`,
      `추가 재료: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
      `예상 조리시간: ${selectedRecipe.cooking_time ?? '-'}분`,
      `난이도: ${difficultyText}`,
    ].join('\n');
  }, [selectedRecipe]);

  const tags = useMemo(() => {
    if (!selectedRecipe) return [];
    return [
      selectedRecipe.category ? `#${selectedRecipe.category}` : '#추천메뉴',
      selectedRecipe.cooking_time ? `#${selectedRecipe.cooking_time}분` : '#시간미정',
      selectedRecipe.days_left != null ? `#${selectedRecipe.days_left}일내활용` : '#유통기한_임박',
    ];
  }, [selectedRecipe]);

  const handleComplete = async () => {
    const selectedRecipe = recipes[selectedIndex];
    if (!selectedRecipe) return;

    Alert.prompt(
      "요리 완료 보고",
      `'${selectedRecipe.menu_name}' 요리를 완료하셨습니까?\n몇 인분을 조리하셨는지 입력해주세요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "완료",
          onPress: async (servings) => {
            const servingsNum = parseInt(servings) || 1; // 입력 없으면 기본 1인분

            try {
              // 엔드포인트 연결
              const response = await apiClient.post(apiClient.urls.FRIDGE.COMPLETE_COOKING, {
                inven_id: invenId,
                recipe_id: selectedRecipe.recipe_id || 0, // 레시피 ID (추천 결과에 포함됨)
                servings: servingsNum
              });

              if (response) {
                const savedAmount = response.added_saving?.toLocaleString() || "0";
                
                // [정상 규격] Alert.alert("제목", "내용", [버튼배열])
                Alert.alert(
                  "절약 성공!", 
                  `이번 요리로 총 ${savedAmount}원을 절약하셨습니다.`, 
                  [
                    { 
                      text: "확인", 
                      onPress: () => {
                        // 탭 내비게이션 명칭 확인: 'FridgeHome' 또는 'Fridge'
                        navigation.navigate('FridgeMain'); 
                      } 
                    }
                  ]
                );
              }
            } catch (error) {
              console.error("통신 실패:", error);
              // 공통 에러 처리는 apiClient에서 하겠지만, 여기서도 안전하게 한 번 더!
            }
          },
        },
      ],
      "plain-text",
      "1" // 기본값 1인분 세팅
    );
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
                  ⏱ 약 {selectedRecipe.cooking_time ?? '-'} 분  |  난이도 :{' '}
                  {getDifficultyText(selectedRecipe.difficulty)}
                </Text>
                <Text style={styles.infoSubText}>
                  남은 유통기한: {selectedRecipe.days_left ?? '-'}일
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
                        매칭률 {Math.round((item.match_score || 0) * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.bottomSheet}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>냉털 메뉴 추천</Text>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiText}>{aiReason}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>요리 정보</Text>
                <View style={styles.recipeDetailBox}>
                  <Text style={styles.recipeDetailText}>{recipeSteps}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>요리 재료</Text>
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
                <Text style={styles.completeButtonText}>요리 완료</Text>
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