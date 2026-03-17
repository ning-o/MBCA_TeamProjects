import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

const FridgeMainScreen = () => {
  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- 상단 게이지 섹션 --- */}
        <View style={styles.gaugeContainer}>
          <Text style={styles.title}>Fridge Manager</Text>
          
          <View style={styles.gaugeWrapper}>
            {/* 반원 모양 (시안의 배경 회색 바) */}
            <View style={styles.gaugeBackground}>
              {/* 실제 채워지는 파란색 바 (50% 기준) */}
              <View style={[styles.gaugeFill, { transform: [{ rotate: '90deg' }] }]} />
            </View>
            
            {/* 중앙 수치 표시 */}
            <View style={styles.gaugeTextWrapper}>
              <Text style={styles.gaugeValue}>50</Text>
              <Text style={styles.gaugeUnit}>%</Text>
            </View>
            
            {/* 하단 날짜 표시 (1일 ~ 30일) */}
            <View style={styles.dateLabels}>
              <Text style={styles.dateText}>1일</Text>
              <Text style={styles.dateText}>15일</Text>
              <Text style={styles.dateText}>30일</Text>
            </View>
          </View>

          <View style={styles.infoWrapper}>
            <Text style={styles.infoTitle}>이번 달 식비 현황</Text>
            <Text style={styles.infoDesc}>"지금 페이스면 이번 달 4만원 남길 수 있어요!"</Text>
          </View>
        </View>

        {/* 하단 퀵 메뉴 영역 (다음 단계 작업 예정) */}
      </ScrollView>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 100 },
  gaugeContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8FAFC', // 상단은 살짝 연한 배경색
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 25 },
  gaugeWrapper: {
    width: 260,
    height: 130, // 반원이므로 너비의 딱 절반
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden', // 넘치는 원형 부분을 잘라냄
  },
  gaugeBackground: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 20,
    borderColor: '#E2E8F0',
    position: 'absolute',
    top: 0,
  },
  gaugeFill: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 20,
    borderColor: '#3B82F6',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    top: -20,
    left: -20,
  },
  gaugeTextWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  gaugeValue: { fontSize: 48, fontWeight: '900', color: '#1E293B' },
  gaugeUnit: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginLeft: 4 },
  dateLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    position: 'absolute',
    bottom: -25,
  },
  dateText: { fontSize: 12, color: '#94A3B8' },
  infoWrapper: { alignItems: 'center', marginTop: 40 },
  infoTitle: { fontSize: 16, color: '#3B82F6', fontWeight: 'bold', marginBottom: 5 },
  infoDesc: { fontSize: 14, color: '#64748B' },
});

export default FridgeMainScreen;