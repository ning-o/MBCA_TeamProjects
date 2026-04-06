import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Search, CalendarDays, Box } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import apiClient from '../../common/api/api_client';

const RefDetail = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [myFoodList, setMyFoodList] = useState([]);
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

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/fridge/inventory/1');
      setMyFoodList(data);
    } catch (error) {
      console.error('[RefDetail] 호출 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

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
    // ✅ edges={['right', 'left']} 속성을 넣어 스타일 유지
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header />
      <View style={{ marginTop: 60 }}> 
        {/* 헤더 공간 확보를 위해 View로 감싸거나 마진 추가 */}
        <View style={styles.searchBar}>
          <Search size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput 
            placeholder="식재료 검색" 
            style={styles.searchInput} 
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

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
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={<Text style={styles.emptyText}>냉장고가 비어있네요!</Text>}
          onRefresh={fetchInventory}
          refreshing={loading}
        />
      )}
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