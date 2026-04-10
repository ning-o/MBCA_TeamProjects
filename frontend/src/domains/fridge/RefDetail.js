import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Search, Beef, Carrot, Fish, Milk, Package, Box, ChevronDown, ChevronUp } from 'lucide-react-native'; // 아이콘 추가
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import apiClient from '../../common/api/api_client';

// 카테고리별 아이콘 매핑
const categoryIcons = {
  '육류': <Beef size={20} color="#E11D48" />,
  '신선식품': <Carrot size={20} color="#22C55E" />,
  '해산물': <Fish size={20} color="#3B82F6" />,
  '유제품': <Milk size={20} color="#6366F1" />,
  '기타': <Package size={20} color="#94A3B8" />,
};

const RefDetail = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [myFoodList, setMyFoodList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeStorage, setActiveStorage] = useState('냉장');
  const [searchText, setSearchText] = useState('');
  
  // 아이템별 토글 상태 관리 (key: 품목명)
  const [expandedItems, setExpandedItems] = useState({});

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
      const userInfo = await AsyncStorage.getItem('userInfo');
      console.log("1. AsyncStorage 원본 데이터:", userInfo); // 추가할 로그 1

      let targetInvenId;
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        targetInvenId = parsed.inven_id; 
        console.log("2. 파싱된 inven_id 값:", targetInvenId); // 추가할 로그 2
      }

      if (!targetInvenId) {
        console.log('[RefDetail] 내 ID를 찾지 못해 1번 냉장고를 조회합니다.');
        targetInvenId = 1;
      }
      
      console.log("3. 최종 API 호출용 ID:", targetInvenId); // 추가할 로그 3
      

      console.log(`[RefDetail] ${targetInvenId}번 냉장고 데이터 불러오기`);

      const url = apiClient.urls.FRIDGE.GET_INVENTORY(targetInvenId);
      const data = await apiClient.get(url);

      setMyFoodList(data);
    } catch (error) {
      // 컴포넌트 레벨 예외 처리 로그 기록
      console.error('[RefDetail] 호출 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  /**
   * 품목별 데이터 그룹화 및 정렬 로직
   * 1. 필터링 수행
   * 2. 동일 품목명 기준 그룹화 (수량 합산, 최소 D-Day 추출)
   * 3. 가장 임박한 D-Day 순으로 정렬
   */
  const getGroupedList = () => {
    const grouped = {};

    myFoodList
      .filter(item => {
        const isStorageMatch = item.storage === activeStorage;
        const isCategoryMatch = activeCategory === '전체' || item.category === activeCategory;
        const itemName = item.name || item.ingredient_name || "";
        const isSearchMatch = itemName.includes(searchText);
        return isStorageMatch && isCategoryMatch && isSearchMatch;
      })
      .forEach(item => {
        const name = item.name || item.ingredient_name || "알 수 없음";
        
        if (!grouped[name]) {
          grouped[name] = {
            name: name,
            category: item.category,
            totalCount: 0,
            minDday: item.dday,
            uniqueDdays: new Set(), // 유통기한 중복 체크용 Set 추가
            items: [] // 개별 재고 리스트
          };
        }
        
        grouped[name].totalCount += parseInt(item.count || 0);
        grouped[name].uniqueDdays.add(item.dday); // 현재 아이템의 유통기한 추가
        
        if (item.dday < grouped[name].minDday) {
          grouped[name].minDday = item.dday;
        }
        grouped[name].items.push(item);
      });

    // 개별 리스트도 유통기한 순으로 정렬하여 반환
    return Object.values(grouped).sort((a, b) => (a.minDday || 0) - (b.minDday || 0));
  };

  // 토글 핸들러
  const toggleExpand = (itemName, uniqueDdayCount) => {
    // 유통기한 종류가 2개 미만(1개 이하)이면 토글 동작 안 함
    if (uniqueDdayCount < 2) return;
    
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedItems[item.name];
    // 유통기한이 서로 다른 재고가 존재하는지 확인
    const canExpand = item.uniqueDdays.size >= 2;

    return (
      <View style={styles.groupContainer}>
        {/* 대표 품목 카드 (수량 합계 및 가장 임박한 D-Day 표시) */}
        <TouchableOpacity 
          style={styles.itemCard} 
          onPress={() => toggleExpand(item.name, item.uniqueDdays.size)}
          activeOpacity={canExpand ? 0.7 : 1}
        >
          <View style={styles.itemMainInfo}>
            <View style={styles.itemIcon}>
              {categoryIcons[item.category] || <Box size={20} color="#94A3B8" />}
            </View>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemTotalCount}>총 수량 : {item.totalCount}</Text>
            </View>
          </View>
          
          <View style={styles.itemSubInfo}>
            <View style={styles.ddayContainer}>
              <Text style={[styles.itemDday, (item.minDday !== undefined && item.minDday <= 3) && { color: '#EF4444' }]}>
                {item.minDday === 0 ? 'D-Day' : `유통기한 D-${item.minDday}`}
              </Text>
              {/* 유통기한이 다른 재고가 있을 때만 화살표 아이콘 표시 */}
              {canExpand && (
                isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* 상세 재고 리스트 (유통기한이 다른 재고가 있고 토글 활성화 시 노출) */}
        {canExpand && isExpanded && item.items.map((subItem, index) => (
          <View key={`${item.name}-${index}`} style={styles.subItemRow}>
            <View style={styles.subItemInfo}>
              <Text style={styles.subItemText}>재고 {index + 1}</Text>
              <Text style={styles.subItemCount}>수량 : {subItem.count}</Text>
            </View>
            <Text style={[styles.subItemDday, (subItem.dday !== undefined && subItem.dday <= 3) && { color: '#EF4444' }]}>
              {subItem.dday === 0 ? 'D-Day' : `유통기한 D-${subItem.dday}`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header />
      <View style={{ marginTop: 60 }}> 
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
          data={getGroupedList()}
          keyExtractor={(item) => item.name}
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
  groupContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemMainInfo: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#334155' },
  itemTotalCount: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  itemSubInfo: { alignItems: 'flex-end' },
  ddayContainer: { flexDirection: 'row', alignItems: 'center' },
  itemDday: { fontSize: 14, color: '#64748B', fontWeight: 'bold', marginRight: 4 },
  
  // 상세 아이템 스타일
  subItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingLeft: 55, // 아이콘 너비만큼 들여쓰기
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subItemInfo: { flexDirection: 'row', alignItems: 'center' },
  subItemText: { fontSize: 13, color: '#64748B', marginRight: 15 },
  subItemCount: { fontSize: 13, color: '#64748B' },
  subItemDday: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' }
});

export default RefDetail;