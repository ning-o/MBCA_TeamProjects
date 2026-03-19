import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

const { width, height } = Dimensions.get('window');

const FridgeMainScreen = () => {
  // --- [데이터 영역: 나중에 DB 연동] ---
  const spentAmount = 15; // 사용자가 쓴 금액 (단위: 만원)
  const monthlyBudget = 30; // 한 달 총 예산 (단위: 만원)
  
  // 퍼센트 및 게이지 각도 계산 로직
  // 공식: (현재/예산) * 180도 - 45도 (시작점이 -45도이므로)
  const consumptionRate = Math.min((spentAmount / monthlyBudget) * 100, 100); 
  const gaugeRotation = (consumptionRate / 100) * 180 - 45;

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 헤더 공간 확보용 스페이서 (비율 유지) */}
        <View style={{ height: height * 0.08 }} />
        
        {/* ============================================================
            [START] 그래프(게이지) 섹션
           ============================================================ */}
        <View style={styles.topSection}>
          <Text style={styles.brandTitle}>Fridge Manager</Text>
          
          <View style={styles.gaugeContainer}>
            {/* 1. 배경 회색 반원 (고정) */}
            <View style={styles.gaugeArcBackground} />
            
            {/* 2. 동적 파란색 게이지 (데이터 연동) */}
            <View style={[
              styles.gaugeFillActive, 
              { transform: [{ rotate: `${gaugeRotation}deg` }] } 
            ]} />
            
            {/* 3. 중앙 수치 표시 */}
            <View style={styles.valueWrapper}>
              <Text style={styles.mainValue}>{Math.floor(consumptionRate)}</Text>
              <Text style={styles.percentText}>%</Text>
            </View>

            {/* 4. 하단 날짜/눈금 가이드 */}
            <View style={styles.labelRow}>
              <Text style={styles.subText}>1일</Text>
              <Text style={styles.subText}>15일</Text>
              <Text style={styles.subText}>30일</Text>
            </View>
          </View>

          {/* 하단 텍스트 정보 */}
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

        {/* --- 하단 2열 메뉴 카드 섹션 --- */}
        <View style={styles.cardGrid}>
          <View style={styles.row}>
            <MenuCard title="한달 식비 입력" value={monthlyBudget} unit="만원" sub={`${spentAmount}만원 사용`} />
            <MenuCard title="장본 재료 추가하기" icon="📸" value="영수증 추가" isAction />
          </View>
          <View style={styles.row}>
            <MenuCard title="냉장고 속 재료" value="계란" sub="유통기한 임박" highlight />
            <MenuCard title="냉장고 털기" icon="🍲" value="계란 볶음밥" sub="다른 요리 추천 >" />
          </View>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
};

const MenuCard = ({ title, value, unit, sub, icon, highlight }) => (
  <TouchableOpacity style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.cardContent}>
      {icon && <Text style={styles.cardIcon}>{icon}</Text>}
      <Text style={[styles.cardValue, highlight && { color: '#E11D48' }]}>{value}</Text>
      {unit && <Text style={styles.cardUnit}>{unit}</Text>}
    </View>
    {sub && <Text style={[styles.cardSub, highlight && { color: '#E11D48' }]}>{sub}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scrollContent: { paddingBottom: 100 },
  
  // 상단 화이트 판 (Top Section)
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

  /* [그래프 디테일 설정] */
  gaugeContainer: { width: 280, height: 140, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  gaugeArcBackground: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 22,
    borderColor: '#E9F0FB',
    position: 'absolute',
    top: 0,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  gaugeFillActive: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 22,
    borderColor: '#4A8BFF',
    position: 'absolute',
    top: 0,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // transform은 인라인 스타일에서 데이터 연동 처리
  },
  valueWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  mainValue: { fontSize: 54, fontWeight: '900', color: '#1E293B' },
  percentText: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginLeft: 4 },
  labelRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingHorizontal: 10, position: 'absolute', bottom: 5 },
  subText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  infoBox: { marginTop: 35, alignItems: 'center' },
  infoTitle: { fontSize: 16, color: '#3B82F6', fontWeight: '700', marginBottom: 6 },
  infoQuote: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  // 하단 카드 레이아웃
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