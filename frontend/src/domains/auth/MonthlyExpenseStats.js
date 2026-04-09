import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, Modal, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native'; 
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Soup, Camera, ChevronRight, Settings, Users, LogOut, UtensilsCrossed } from 'lucide-react-native'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import Footer from '../../common/components/Footer'; // 사용 안 할 거면 지우셔도 됩니다

const mockExpenses = [
  { id: '1', date: '2026-01-15', category: '구독관리', amount: 12000, description: 'Netflix' },
  { id: '2', date: '2026-01-20', category: '냉장고관리', amount: 45000, description: '채소/과일' },
  { id: '3', date: '2026-02-05', category: '구독관리', amount: 15000, description: 'Spotify' },
  { id: '4', date: '2026-02-10', category: '냉장고관리', amount: 38000, description: '육류' },
  { id: '5', date: '2026-02-25', category: '구독관리', amount: 9900, description: 'YouTube Premium' },
  { id: '6', date: '2026-03-03', category: '냉장고관리', amount: 52000, description: '유제품/계란' },
  { id: '7', date: '2026-03-12', category: '구독관리', amount: 12000, description: 'Netflix' },
  { id: '8', date: '2026-03-18', category: '냉장고관리', amount: 41000, description: '채소/과일' },
];

const MonthlyExpenseStats = () => {
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [showHint, setShowHint] = useState(true);
    const translateY = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState('list');
  const [startMonth, setStartMonth] = useState('2026-01');
  const [endMonth, setEndMonth] = useState('2026-03');
  const [includeSubscription, setIncludeSubscription] = useState(true);
  const [includeRefrigerator, setIncludeRefrigerator] = useState(true);

  const insets = useSafeAreaInsets(); // [추가] 노치 높이 계산

  const filteredExpenses = mockExpenses.filter((expense) => {
    const expenseMonth = expense.date.substring(0, 7);
    const isInRange = expenseMonth >= startMonth && expenseMonth <= endMonth;
    const categoryMatch =
      (includeSubscription && expense.category === '구독관리') ||
      (includeRefrigerator && expense.category === '냉장고관리');

    return isInRange && categoryMatch;
  });

  const monthlyTotals = filteredExpenses.reduce((acc, expense) => {
    const month = expense.date.substring(0, 7);
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {});

  useEffect(() => {
    if (showHint) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: 10, duration: 600, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [showHint]);
  
  useEffect(() => {
    const getMyId = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          if (parsed.inven_id) {
            setMyInvenId(parsed.inven_id);
          }
        }
      } catch (e) {
        console.error("ID 로드 실패:", e);
      }
    };
    getMyId();
  }, []);

  const handleOpenManageModal = () => {
    if (showHint) setShowHint(false); 
    setIsManageModalVisible(true);    
  };

  
    const handleSaveSettings = async () => {
      try {
      setIsSubmitting(true);
  
      // 현재 상태값인 myInvenId를 전달
      const response = await saveRefrigeratorData(
        inputFridgeName, 
        monthlyBudget, 
        myInvenId // 이 값이 누락되면 신규 생성으로 인식
      );
  
      if (response) {
        setConfirmedFridgeName(inputFridgeName);
        setLastValidBudget(monthlyBudget);
        Alert.alert('성공', '냉장고 정보가 수정되었습니다.');
        setIsManageModalVisible(false);
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '알 수 없는 오류가 발생했습니다.';
        console.error(`[SAVE_ERROR] ${errorDetail}`);
        
        Alert.alert(
          '저장 실패', 
          `서버 통신 중 문제가 발생했습니다.\n(사유: ${errorDetail})`
        );
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = Object.entries(monthlyTotals)
    .sort()
    .map(([month, total]) => ({
      month: month.substring(5),
      total,
    }));

  const screenWidth = Dimensions.get('window').width;

  const renderExpenseList = () => (
    <ScrollView style={styles.tabContent}>
      {filteredExpenses.length === 0 ? (
        <Text style={styles.emptyText}>조회된 데이터가 없습니다</Text>
      ) : (
        filteredExpenses.map((expense) => (
          <View key={expense.id} style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseDescription}>{expense.description}</Text>
              <Text style={styles.expenseAmount}>
                {expense.amount.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.expenseFooter}>
              <Text style={styles.expenseDate}>{expense.date}</Text>
              <View
                style={[
                  styles.categoryBadge,
                  expense.category === '구독관리'
                    ? styles.subscriptionBadge
                    : styles.refrigeratorBadge,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    expense.category === '구독관리'
                      ? styles.subscriptionText
                      : styles.refrigeratorText,
                  ]}
                >
                  {expense.category}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderMonthlyTotals = () => (
    <ScrollView style={styles.tabContent}>
      {Object.entries(monthlyTotals).length === 0 ? (
        <Text style={styles.emptyText}>조회된 데이터가 없습니다</Text>
      ) : (
        Object.entries(monthlyTotals)
          .sort()
          .reverse()
          .map(([month, total]) => (
            <View key={month} style={styles.totalCard}>
              <View>
                <Text style={styles.totalMonth}>{month}</Text>
                <Text style={styles.totalCount}>
                  {filteredExpenses.filter((e) => e.date.startsWith(month)).length}건
                </Text>
              </View>
              <Text style={styles.totalAmount}>{total.toLocaleString()}원</Text>
            </View>
          ))
      )}
    </ScrollView>
  );

  const renderChart = () => (
    <ScrollView style={styles.tabContent}>
      {chartData.length === 0 ? (
        <Text style={styles.emptyText}>조회된 데이터가 없습니다</Text>
      ) : (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>월별 절약 추이</Text>
          <LineChart
            data={{
              labels: chartData.map((d) => d.month),
              datasets: [
                {
                  data: chartData.map((d) => d.total),
                },
              ],
            }}
            width={screenWidth - 64}
            height={300}
            yAxisSuffix="원"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 8,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#2563eb',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* [수정] 기기별 노치에 대응하기 위해 paddingTop에 insets.top 추가 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>월간 절약 통계</Text>
      </View>

      <TouchableOpacity 
        style={[styles.manageButton, { top: insets.top + 16}]} 
        onPress={handleOpenManageModal}
      >
        <View style={styles.manageButtonContent}>
          <Settings size={22} color="#EBF2FF" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      {/* Search Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>조회 기간</Text>
          <View style={styles.dateRangeContainer}>

  {/* 시작 년월 입력창 */}
  <TouchableOpacity activeOpacity={0.8}>
    <TextInput
      style={styles.dateInput}
      value={startMonth}
      editable={true} // 키보드 입력을 막고 클릭 이벤트만 허용
      pointerEvents="none" // TouchableOpacity가 클릭을 가로채도록 설정
    />
  </TouchableOpacity>

  <Text style={styles.dateSeparator}>~</Text>

  {/* 종료 년월 입력창 */}
  <TouchableOpacity activeOpacity={0.8}>
    <TextInput
      style={styles.dateInput}
      value={endMonth}
      editable={true}
      pointerEvents="none"
    />
  </TouchableOpacity>

          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'list' && styles.tabButtonActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'list' && styles.tabButtonTextActive]}
          >
            절약 리스트
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'totals' && styles.tabButtonActive]}
          onPress={() => setActiveTab('totals')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'totals' && styles.tabButtonTextActive,
            ]}
          >
            월별 합계
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chart' && styles.tabButtonActive]}
          onPress={() => setActiveTab('chart')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'chart' && styles.tabButtonTextActive]}
          >
            그래프
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'list' && renderExpenseList()}
      {activeTab === 'totals' && renderMonthlyTotals()}
      {activeTab === 'chart' && renderChart()}

      
      {/* {showHint && (
        <TouchableWithoutFeedback onPress={() => setShowHint(false)}>
          <View style={StyleSheet.absoluteFillObject}>
            <Animated.View 
              style={[
                styles.hintContainer, 
                { top: insets.top + 50, transform: [{ translateY }] }
              ]}
            >
              <Text style={styles.hintArrow}>▲</Text>
              <View style={styles.hintBubble}>
                <Text style={styles.hintText}>회원 관리</Text>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )} */}
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={isManageModalVisible}
        onRequestClose={() => setIsManageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>회원 관리</Text>
              
              <View style={styles.modalMenuContainer}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#3B82F6' }]} 
                  onPress={handleSaveSettings}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>회원 탈퇴/삭제</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalMenuContainer}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} 
                  onPress={() => {
                    setIsManageModalVisible(false);
                  }}
                >
                  <Text style={{ color: '#64748B', fontWeight: 'bold' }}>닫기</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      <Footer/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 16,
    // [수정] 내부 텍스트가 노치에 가려지지 않도록 패딩 높이 조절을 위해 고정 padding 보조
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  dateSeparator: {
    color: '#6b7280',
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563eb',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#2563eb',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 32,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionBadge: {
    backgroundColor: '#f3e8ff',
  },
  refrigeratorBadge: {
    backgroundColor: '#dcfce7',
  },
  categoryText: {
    fontSize: 12,
  },
  subscriptionText: {
    color: '#7c3aed',
  },
  refrigeratorText: {
    color: '#16a34a',
  },
  totalCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  totalCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  dateInput: {
    width: 110,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0', // 입력창 느낌을 주기 위한 테두리
  },
  dateSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#999',
  },  
  manageButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1001, 
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb', 
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EBF2FF',
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EBF2FF',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '65%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#1E293B' },
  modalMenuContainer: { width: '100%', marginBottom: 20 },
  modalMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuLabel: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  menuValue: { fontSize: 14, color: '#64748B' },
  modalInput: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#3B82F6', 
    fontSize: 14, 
    padding: 0, 
    minWidth: 40, 
    textAlign: 'right',
    color: '#1E293B'
  },
  modalBtn: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf:'center'
  },
  hintContainer: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    zIndex: 2000,
  },
  hintArrow: { fontSize: 24, color: '#3B82F6', marginBottom: -5, marginLeft: 110 },
  hintBubble: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 10,
  },
  hintText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  hintSubText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 4 },
});

export default MonthlyExpenseStats;