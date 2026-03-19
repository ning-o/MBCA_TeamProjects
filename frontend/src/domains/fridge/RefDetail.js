import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { Search, ChevronLeft, CalendarDays, Box, Home, Wallet, Refrigerator as FridgeIcon, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const Header = ({ title }) => (
  <View style={styles.header}>
    <TouchableOpacity>
      <ChevronLeft size={24} color="#6B7280" />
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
    <View style={{ width: 24 }} />
  </View>
);

const Footer = () => (
  <View style={styles.footer}>
    <TouchableOpacity style={styles.menuButton}>
      <View style={styles.iconCircle}>
        <Home size={24} color="#94A3B8" />
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.menuButton}>
      <View style={styles.iconCircle}>
        <Wallet size={24} color="#94A3B8" />
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.menuButton}>
      <View style={[styles.iconCircle, styles.activeCircle]}>
        <FridgeIcon size={24} color="#3B82F6" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.menuButton}>
      <View style={styles.iconCircle}>
        <User size={24} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  </View>
);

const RefDetail = () => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeStorage, setActiveStorage] = useState('냉장');

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'meat', name: '육류' },
    { id: 'fresh', name: '신선식품' },
    { id: 'seafood', name: '해산물' },
    { id: 'dairy', name: '유제품' },
    { id: 'etc', name: '기타' },
  ];

  const myFoodList = [
    { id: '1', name: '양파', count: '12', dday: 3, storage: '냉장', category: 'fresh' },
    { id: '2', name: '마늘', count: '12', dday: 5, storage: '냉장', category: 'fresh' },
    { id: '3', name: '봄동', count: '12', dday: 7, storage: '냉장', category: 'fresh' },
    { id: '4', name: '무', count: '12', dday: 12, storage: '냉장', category: 'fresh' },
    { id: '5', name: '목 전지살', count: '12', dday: 14, storage: '냉동', category: 'meat' },
    { id: '6', name: '양 갈비', count: '12', dday: 23, storage: '냉동', category: 'meat' },
    { id: '7', name: '닭고기', count: '12', dday: 31, storage: '냉동', category: 'meat' },
    { id: '8', name: '햄', count: '12', dday: 99, storage: '냉장', category: 'etc' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemMainInfo}>
        {item.category === 'fresh' || item.category === 'etc' 
          ? <CalendarDays size={20} color="#D1D5DB" style={styles.itemIcon} />
          : <Box size={20} color="#D1D5DB" style={styles.itemIcon} />
        }
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      <View style={styles.itemSubInfo}>
        <Text style={styles.itemCount}>수량 : {item.count}</Text>
        <Text style={styles.itemDday}>유통기한 D-{item.dday}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="냉장고 관리" />
      <View style={styles.searchBar}>
        <Search size={20} color="#D1D5DB" style={styles.searchIcon} />
        <TextInput placeholder="검색.." style={styles.searchInput} />
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
      <FlatList
        data={myFoodList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
      />
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 16,
    marginTop: 12,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1F2937', fontSize: 16 },
  categoryScroll: { paddingLeft: 16, paddingBottom: 16 },
  categoryBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryBtnActive: { backgroundColor: '#3B82F6' },
  categoryBtnText: { fontSize: 14, color: '#1F2937' },
  categoryBtnTextActive: { color: '#FFFFFF' },
  storageToggle: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  toggleBtnActive: { backgroundColor: '#3B82F6' },
  toggleText: { fontSize: 16, color: '#6B7280' },
  toggleTextActive: { color: '#FFFFFF' },
  listPadding: { paddingBottom: 120 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemMainInfo: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemSubInfo: { alignItems: 'flex-end' },
  itemCount: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  itemDday: { fontSize: 12, color: '#94A3B8' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 15,
  },
  menuButton: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCircle: { backgroundColor: '#E0F2FE' },
});

export default RefDetail;