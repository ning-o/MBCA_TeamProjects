import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

const { width, height } = Dimensions.get('window');

const FridgeMainScreen = () => {
  const navigation = useNavigation();

  // --- [데이터 영역] ---
  const spentAmount = 17; 
  const monthlyBudget = 30; 
  const consumptionRate = Math.min((spentAmount / monthlyBudget) * 100, 100); 

  // ★ 게이지 회전 각도 로직 (왼쪽에서 오른쪽으로 완벽하게 차오름)
  // 0%일 때 -225도(바닥으로 숨김), 100%일 때 -45도(완전 노출)
  const gaugeRotation = -225 + (consumptionRate / 100) * 180;

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ height: height * 0.08 }} />
        
        {/* ============================================================
            [START] 그래프(게이지) 섹션
            ============================================================ */}
        <View style={styles.topSection}>
          <Text style={styles.brandTitle}>Fridge Manager</Text>
          
          <View style={styles.gaugeWrapper}>
            {/* 130px 높이로 아랫부분을 잘라버리는 완벽한 반원 마스크 */}
            <View style={styles.gaugeContainer}>
              {/* 1. 배경 회색 반원 (항상 100% 위치 고정) */}
              <View style={styles.gaugeArcBackground} />
              
              {/* 2. 파란색 게이지 (데이터 연동 회전) */}
              <View style={[
                styles.gaugeFillActive, 
                { transform: [{ rotate: `${gaugeRotation}deg` }] } 
              ]} />
              
              {/* 3. 중앙 수치 표시 */}
              <View style={styles.valueWrapper}>
                <Text style={styles.mainValue}>{Math.floor(consumptionRate)}</Text>
                <Text style={styles.percentText}>%</Text>
              </View>
            </View>

            {/* 4. 하단 날짜 라벨 (가로 정렬, 삐뚤어짐 없음) */}
            <View style={styles.labelRow}>
              <Text style={styles.subText}>1일</Text>
              <Text style={styles.middleLabelText}>15일</Text>
              <Text style={styles.subText}>30일</Text>
            </View>   
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>이번 달 식비 현황</Text>
            <Text style={styles.infoQuote}>
              "지금 페이스면 이번 달 {monthlyBudget - spentAmount}만원 남길 수 있어요!"
            </Text>
          </View>
        </View>
        {/* ============================================================
            [END] 그래프(게이지) 섹션
            ============================================================ */}

        {/* --- 하단 2열 메뉴 카드 섹션 (건드리지 않음!) --- */}
        <View style={styles.cardGrid}>
          <View style={styles.row}>
            <MenuCard 
              title="한달 식비 입력" 
              value={monthlyBudget} 
              unit="만원" 
              sub={`${spentAmount}만원 사용`} 
              onPress={() => console.log("식비 입력 클릭")}
            />
            <MenuCard 
              title="장본 재료 추가하기" 
              icon="📸" 
              value="영수증 추가" 
              onPress={() => console.log("영수증 추가 클릭")}

            />
          </View>
          
          <View style={styles.row}>
            <MenuCard 
              title="냉장고 속 재료" 
              value="계란" 
              sub="유통기한 임박" 
              highlight 
              onPress={() => navigation.navigate('RefDetail')}
            />
            <MenuCard 
              title="냉장고 털기" 
              icon="🍲" 
              value="계란 볶음밥" 
              sub="다른 요리 추천 >" 
              onPress={() => navigation.navigate('Recipe')}
            />
          </View>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
};

// --- [공통 컴포넌트: MenuCard] ---
const MenuCard = ({ title, value, unit, sub, icon, highlight, onPress }) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress || (() => {})} 
    activeOpacity={0.7}
  >
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.cardContent}>
      {icon && <Text style={styles.cardIcon}>{icon}</Text>}
      <Text style={[styles.cardValue, highlight && { color: '#E11D48' }]}>{value}</Text>
      {unit && <Text style={styles.cardUnit}>{unit}</Text>}
    </View>
    {sub && <Text style={[styles.cardSub, highlight && { color: '#3B82F6' }]}>{sub}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scrollContent: { paddingBottom: 100 },
  
  topSection: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  brandTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3277', marginBottom: 25 },

  /* ============================================================
      [START] 그래프(게이지) 디테일 설정
     ============================================================ */
  gaugeWrapper: {
    width: 280,
    alignItems: 'center',
  },
  gaugeContainer: { 
    width: 260, 
    height: 130, // 컨테이너 높이를 반지름 크기로 딱 잘라서 하단을 숨김
    overflow: 'hidden', 
    alignItems: 'center', 
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gaugeArcBackground: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 25,
    borderColor: '#F1F5F9', // 배경 회색
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    top: 0,
    transform: [{ rotate: '-45deg' }], // 반원을 위쪽으로 고정
  },
  gaugeFillActive: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 25,
    borderColor: '#3B82F6', // 차오르는 파란색
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    top: 0,
    // 회전은 JSX의 인라인 transform에서 완벽하게 제어됩니다.
  },
  valueWrapper: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    marginBottom: -5, // 숫자가 붕 뜨지 않게 자연스럽게 안착
  },
  mainValue: { fontSize: 58, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
  percentText: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginLeft: 4 },
  
  labelRow: { 
    flexDirection: 'row', 
    width: 260, 
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 5,
  },
  // '15일' 별도 스타일
  middleLabelText: {
    // 공통 스타일 복사
    fontSize: 12, 
    color: '#94A3B8', 
    fontWeight: '700',
    // 독립적 위치 설정
    position: 'absolute',
    left: '50%',          // 정중앙으로
    marginLeft: -15,      
    top: -100,            // 이 값으로 높이 조절
  },

  subText: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },

  infoBox: { marginTop: 35, alignItems: 'center' },
  infoTitle: { fontSize: 16, color: '#3B82F6', fontWeight: '700', marginBottom: 6 },
  infoQuote: { fontSize: 14, color: '#64748B', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
  /* ============================================================
      [END] 그래프(게이지) 디테일 설정
     ============================================================ */

  // 하단 카드 레이아웃 (건드리지 않음)
  cardGrid: { paddingHorizontal: 20, marginTop: 35 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: {
    backgroundColor: '#FFFFFF',
    width: (width - 55) / 2,
    borderRadius: 25,
    padding: 18,
    height: 130,
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 18, marginRight: 5 },
  cardValue: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  cardUnit: { fontSize: 13, color: '#1E293B', marginLeft: 2, marginTop: 3 },
  cardSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
});

export default FridgeMainScreen;