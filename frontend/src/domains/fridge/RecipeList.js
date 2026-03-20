// 냉장고 홈 '냉장고 털기' 카드에서 [다른 요리 추천>] 클릭 시 이동되는 페이지
// 냉장고 속 재료로 할 수 있는 '여러가지' 요리 추천을 보여주는 페이지
import React from 'react';
import { View, Text, StyleSheet, FlatContainer, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../../common/components/Header';
import { ChevronRight } from 'lucide-react-native';

const RecipeList = () => {
  const navigation = useNavigation();

  // 가짜 데이터: 나중에 서버에서 받아올 추천 요리 리스트
  const recommendedRecipes = [
    { id: 1, name: '우유 리조또', ingredients: '우유, 찬밥, 양파', match: '95%' },
    { id: 2, name: '계란 간장밥', ingredients: '계란, 간장, 버터', match: '88%' },
    { id: 3, name: '우유 계란찜', ingredients: '우유, 계란, 파', match: '75%' },
    { id: 4, name: '프렌치 토스트', ingredients: '식빵, 우유, 계란', match: '60%' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="추천 요리 목록" showBack={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subTitle}>내 냉장고 재료로 만들 수 있는 요리들</Text>
        
        {recommendedRecipes.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.recipeCard}
            onPress={() => navigation.navigate('Recipe', { recipeId: item.id, recipeName: item.name })}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.matchBadge}>일치율 {item.match}</Text>
              <Text style={styles.recipeName}>{item.name}</Text>
              <Text style={styles.ingredientsText}>필요 재료: {item.ingredients}</Text>
            </View>
            <ChevronRight size={20} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scrollContent: { padding: 20, paddingTop: 80 }, // 헤더 높이만큼 여백
  subTitle: { fontSize: 14, color: '#64748B', marginBottom: 20, fontWeight: '600' },
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
  cardInfo: { flex: 1 },
  matchBadge: { fontSize: 10, color: '#3B82F6', fontWeight: '700', marginBottom: 4 },
  recipeName: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  ingredientsText: { fontSize: 12, color: '#94A3B8' },
});

export default RecipeList;