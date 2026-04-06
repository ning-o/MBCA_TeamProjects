import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Search, CalendarDays, Box } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

const RefDetail = () => {
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeStorage, setActiveStorage] = useState('냉장');
  const [searchText, setSearchText] = useState('');

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'meat', name: '육류' },
    { id: 'fresh', name: '신선식품' },
    { id: 'seafood', name: '해산물' },
    { id: 'dairy', name: '유제품' },
    { id: 'etc', name: '기타' },
  ];

  const myFoodList = [
    { id: '1', name: '소고기', count: '12', dday: 3, storage: '냉장', category: '신선식품' },
    { id: '2', name: '마늘', count: '12', dday: 5, storage: '냉장', category: '신선식품' },
    { id: '3', name: '봄동', count: '12', dday: 7, storage: '냉장', category: '신선식품' },
    { id: '4', name: '무', count: '12', dday: 12, storage: '냉장', category: '신선식품' },
    { id: '5', name: '목 전지살', count: '12', dday: 14, storage: '냉동', category: '육류' },
    { id: '6', name: '양 갈비', count: '12', dday: 23, storage: '냉동', category: '육류' },
    { id: '7', name: '닭고기', count: '12', dday: 31, storage: '냉동', category: '육류' },
    { id: '8', name: '햄', count: '12', dday: 99, storage: '냉장', category: '기타' },
  ];

  // 💡 필터링 로직: 냉장/냉동 탭 + 카테고리 + 검색어 일치 여부 확인
  const filteredList = myFoodList.filter(item => {
    const isStorageMatch = item.storage === activeStorage;
    const isCategoryMatch = activeCategory === '전체' || item.category === activeCategory;
    const isSearchMatch = item.name.includes(searchText);
    return isStorageMatch && isCategoryMatch && isSearchMatch;
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemMainInfo}>
        {item.category === '신선식품' || item.category === '기타' 
          ? <CalendarDays size={20} color="#94A3B8" style={styles.itemIcon} />
          : <Box size={20} color="#94A3B8" style={styles.itemIcon} />
        }
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      <View style={styles.itemSubInfo}>
        <Text style={styles.itemCount}>수량 : {item.count}</Text>
        <Text style={[styles.itemDday, item.dday <= 3 && { color: '#EF4444' }]}>
          유통기한 D-{item.dday}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 공통 헤더 사용 */}
      <Header />

      {/* 검색바 */}
      <View style={styles.searchBar}>
        <Search size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput 
          placeholder="식재료 검색" 
          style={styles.searchInput} 
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 카테고리 필터 */}
      <View style={{ height: 60 }}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryScroll}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.categoryBtn, activeCategory === item.name && styles.categoryBtnActive]}
              onPress={() => setActiveCategory(item.name)}
            >
              <Text style={[styles.categoryBtnText, activeCategory === item.name && styles.categoryBtnTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 냉장/냉동 토글 */}
      <View style={styles.storageToggle}>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeStorage === '냉장' && styles.toggleBtnActive]}
          onPress={() => setActiveStorage('냉장')}
        >
          <Text style={[styles.toggleText, activeStorage === '냉장' && styles.toggleTextActive]}>냉장</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeStorage === '냉동' && styles.toggleBtnActive]}
          onPress={() => setActiveStorage('냉동')}
        >
          <Text style={[styles.toggleText, activeStorage === '냉동' && styles.toggleTextActive]}>냉동</Text>
        </TouchableOpacity>
      </View>

      {/* 재료 리스트 */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={<Text style={styles.emptyText}>냉장고가 비어있네요!</Text>}
      />

      {/* ✅ 공통 푸터 사용 */}
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1E293B', fontSize: 16 },

  categoryScroll: { paddingLeft: 16, paddingBottom: 16 },
  categoryBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryBtnActive: { backgroundColor: '#3B82F6' },
  categoryBtnText: { fontSize: 14, color: '#64748B' },
  categoryBtnTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  storageToggle: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  toggleBtn: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  toggleText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  toggleTextActive: { color: '#3B82F6' },

  listPadding: { paddingBottom: 100 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemMainInfo: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#334155' },
  itemSubInfo: { alignItems: 'flex-end' },
  itemCount: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  itemDday: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' }
});

export default RefDetail;