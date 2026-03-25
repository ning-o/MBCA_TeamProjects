import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

const { height } = Dimensions.get('window');

const RecipeScreen = () => {
  const navigation = useNavigation();

  const recipeData = {
    title: "짜장라면",
    matchRate: "76%",
    tags: ["#면", "#평균 6000원"],
    time: "10 mins",
    difficulty: "보통",
    aiReason: "맑은 날(맑음 (선선함))엔 상쾌한 짜장라면이 딱이에요! 냉장고에 있는 남은 양파를 처리하기에도 가장 좋은 메뉴입니다.",
    details: "1. 물 550ml를 끓입니다.\n2. 면과 건더기 스프를 넣고 5분 더 끓입니다.\n3. 물을 8스푼 남기고 버린 후 짜장 스프와 유성 스프를 넣어 비벼주세요.\n4. 기호에 따라 볶은 양파나 계란 후라이를 곁들이면 더 맛있습니다.",
    ingredients: [
      { id: 1, name: "짜장라면 1봉", checked: true },
      { id: 2, name: "양파 1/4개", checked: false },
      { id: 3, name: "계란 1알", checked: true },
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 1. 공통 헤더 적용 */}
      <Header />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 공간 확보 (헤더가 절대 위치일 경우 대비) */}
        <View style={{ height: 60 }} />

        {/* 추천 카드 영역 (상단 고정에서 스크롤 내부로 이동하거나 유지 선택 가능) */}
        <View style={styles.recommendCard}>
          <View style={styles.cardHeader}>
            <View style={styles.rankBadge}><Text style={styles.rankText}>1위</Text></View>
            <Text style={styles.matchText}>매칭률 <Text style={styles.matchPercent}>{recipeData.matchRate}</Text></Text>
          </View>
          <View style={styles.cardMain}>
            <Text style={styles.foodTitle}>{recipeData.title}</Text>
            <View style={styles.tagRow}>
              {recipeData.tags.map((tag, i) => <Text key={i} style={styles.tagText}>{tag} </Text>)}
            </View>
            <Text style={styles.infoText}>⏱ {recipeData.time}  |  난이도 : {recipeData.difficulty}</Text>
          </View>
        </View>

        {/* 상세 내용 영역 */}
        <View style={styles.bottomSheet}>
          {/* AI Pick 이유 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI's Pick Reason</Text>
            <View style={styles.aiBubble}>
              <Text style={styles.aiText}>{recipeData.aiReason}</Text>
            </View>
          </View>

          {/* 레시피 상세 설명 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe Step</Text>
            <View style={styles.recipeDetailBox}>
              <Text style={styles.recipeDetailText}>{recipeData.details}</Text>
            </View>
          </View>

          {/* 재료 리스트 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipeData.ingredients.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <View style={[styles.checkBox, item.checked && styles.checkedBox]}>
                  {item.checked && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.ingredientName}>{item.name}</Text>
              </View>
            ))}
          </View>

          {/* 요리 완료 버튼 */}
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => alert("요리가 완료되었습니다! 냉장고 재료가 업데이트됩니다.")}
          >
            <Text style={styles.completeButtonText}>요리 완료!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ✅ 2. 공통 푸터 적용 */}
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 100 }, // 푸터 높이만큼 여백
  
  recommendCard: {
    backgroundColor: '#1E293B',
    borderRadius: 30,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rankBadge: { backgroundColor: '#6366F1', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  rankText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  matchText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  matchPercent: { color: '#818CF8', fontSize: 18 },
  foodTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  tagRow: { flexDirection: 'row', marginBottom: 10 },
  tagText: { color: '#818CF8', fontWeight: 'bold', fontSize: 14 },
  infoText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 40,
    minHeight: height * 0.5,
  },
  section: { marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  
  aiBubble: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: '#6366F1' },
  aiText: { color: '#475569', fontSize: 15, lineHeight: 24 },

  recipeDetailBox: { backgroundColor: '#F1F5F9', padding: 20, borderRadius: 20 },
  recipeDetailText: { color: '#334155', fontSize: 15, lineHeight: 26 },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkBox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkedBox: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  ingredientName: { fontSize: 16, color: '#334155' },

  completeButton: { 
    marginTop: 40,
    backgroundColor: '#1E293B', 
    paddingVertical: 18, 
    borderRadius: 30, 
    alignItems: 'center', 
    elevation: 5 
  },
  completeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default RecipeScreen;