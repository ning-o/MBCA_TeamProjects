import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Soup, Camera, ChevronRight, Settings, Users, LogOut, UtensilsCrossed } from 'lucide-react-native'; // UtensilsCrossed 아이콘 추가
import { useNavigation } from '@react-navigation/native';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import OCRConfirmScreen from './OCRConfirmScreen';

const { width, height } = Dimensions.get('window');

const FridgeMainScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // 헤더 위 버튼 위치 계산용

  // --- [데이터 및 실시간 날짜 로직] ---
  const spentAmount = 17;     
  const budgetStartDay = 1;

  // 1. 한달 식비 입력 상태 관리 (사용자 입력 시 실시간 게이지 반영)
  const [monthlyBudget, setMonthlyBudget] = useState('30');
  const [lastValidBudget, setLastValidBudget] = useState('30'); // 취소 시 기존 값 복구용 백업
  const parsedBudget = parseInt(monthlyBudget) || 1; // 0이나 빈칸일 때 에러 방지

  // 냉장고 관리 모달 및 상태 관리
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [inputFridgeName, setInputFridgeName] = useState("팀장님네"); // 사용자 입력용 (앞에 이름만)
  const [confirmedFridgeName, setConfirmedFridgeName] = useState("팀장님네"); // 최종 확정된 이름

  // LLM 추천 메뉴 임시 데이터 (추후 API 연동)
  const recommendedMenu = "제철 달래 된장찌개";

  // 입력창 포커스가 해제될 때(끌 때) 실행되는 함수
  const handleBudgetBlur = () => {
    if (monthlyBudget.trim() === '' || parseInt(monthlyBudget) <= 0) {
      // 안 쓰고 끄거나 0원을 입력하면 백업해둔 기존 값으로 원상복구
      setMonthlyBudget(lastValidBudget);
    } else {
      // 정상 입력하고 끄면 백업 데이터도 업데이트
      setLastValidBudget(monthlyBudget);
    }
  };

  // 설정 저장 함수
  const handleSaveSettings = () => {
    setConfirmedFridgeName(inputFridgeName);
    setIsManageModalVisible(false);
    Keyboard.dismiss();
  };

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 소비량 게이지 각도 (입력된 예산 기반 계산)
  const consumptionRate = Math.min((spentAmount / parsedBudget) * 100, 100); 
  const moneyRotation = -225 + (consumptionRate / 100) * 180;

  // 오늘 날짜 바늘 각도
  const dayProgress = (currentDay - 1) / (totalDaysInMonth - 1);
  const dayRotation = -90 + (dayProgress * 180);

  // 페이스 예측 계산
  const passedDays = currentDay >= budgetStartDay ? (currentDay - budgetStartDay + 1) : 1;
  const dailyAverage = spentAmount / passedDays;
  const projectedTotal = dailyAverage * totalDaysInMonth;
  const remainingOrOver = parsedBudget - projectedTotal;
  const isGoodPace = remainingOrOver >= 0;

  // --- [하단 카드용 연동 데이터 및 함수] ---
  
  // 2-1. 장본 재료 추가 (카메라 실행 및 이미지 획득 로직)
  const handleCameraLaunch = async () => {
    navigation.navigate('CustomCamera');
  };

  // 2-2. 장본 재료 직접 추가 (사진 없이 이동)
  const handleManualAdd = () => {
    // isManual: true 라는 암호를 같이 보냅니다.
    navigation.navigate('OCRConfirm', { isManual: true }); 
  };

  // 3. 냉장고 속 재료 (RefDetail에서 불러올 가장 유통기한 임박한 재료)
  const imminentIngredient = { name: "계란", dDay: "D-2" };

  // 4. 냉장고 털기 (현재 재료 기반 추천 요리 1순위)
  const topRecommendedRecipe = "우유 리조또";

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* 📍 [수정 영역] 냉장고 관리 버튼 (Header.js 의 zIndex 1000 보다 높게 설정) */}
      <TouchableOpacity 
        style={[styles.manageButton, { top: insets.top + 8 }]} 
        onPress={() => setIsManageModalVisible(true)}
      >
        <Settings size={24} color="#333" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ height: height * 0.08 }} />
        
        {/* ============================================================
            [START] 게이지바 영역
            ============================================================ */}
        <View style={styles.topSection}>
          {/* 📍 [수정 영역] 설정된 이름을 반영하여 출력 */}
          <Text style={styles.brandTitle}>{confirmedFridgeName} 냉장고</Text>
          
          <View style={styles.gaugeWrapper}>
            <View style={styles.gaugeBox}>
              
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeArcBackground} />
                <View style={[
                  styles.gaugeFillActive, 
                  { transform: [{ rotate: `${moneyRotation}deg` }] } 
                ]} />
                
                <View style={styles.valueWrapper}>
                  <Text style={styles.mainValue}>{Math.floor(consumptionRate)}</Text>
                  <Text style={styles.percentText}>%</Text>
                </View>
              </View>

              <View style={[
                styles.needleLayer,
                { transform: [{ rotate: `${dayRotation}deg` }] }
              ]}>
                <View style={{ position: 'absolute', top: -18, alignItems: 'center', transform: [{ rotate: `${-dayRotation}deg` }] }}>
                  <Text style={styles.needleText}>오늘</Text>
                </View>
                <View style={styles.needlePointer} />
              </View>

            </View>

            <View style={styles.labelRow}>
              <Text style={styles.subText}>1일</Text>
              <Text style={styles.middleLabelText}>15일</Text>
              <Text style={styles.subText}>말일</Text>
            </View>   
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>이번 달 식비 현황</Text>
            <Text style={[styles.infoQuote, !isGoodPace && { color: '#E11D48' }]}>
              "{isGoodPace ? `지금 페이스면 ${remainingOrOver.toFixed(1)}만원 남겨요!` : `이대로면 ${Math.abs(remainingOrOver).toFixed(1)}만원 초과해요!`}"
            </Text>
          </View>
        </View>
        {/* ============================================================
            [END] 게이지바 영역
            ============================================================ */}

        {/* ============================================================
            [START] 하단 버튼 카드 영역
            ============================================================ */}
        <View style={styles.cardGrid}>
          
          {/* 윗줄 (1번, 2번 카드) */}
          <View style={styles.row}>
            {/* 1. 한달 식비 입력 카드 -> 제철음식 추천 LLM 카드로 변경 */}
            <MenuCard 
              title="장 보러 가기전에 추천" 
              value={recommendedMenu} 
              renderIcon={() => <UtensilsCrossed size={20} color="#1E293B" />} 
              sub="제철 음식이 땡기지 않나요?" 
              alignRight={true} 
              isSubCenter={true} // 서브 텍스트 중앙 정렬
              onPress={() => Alert.alert("LLM 연동 준비중", "현재 예산 페이스와 제철 식재료를 분석하여 장보기 최적화 메뉴 추천 기능을 준비중입니다.")} 
            />

            {/* 2. 장본 재료 추가하기 (클릭 시 카메라 실행) */}
            <MenuCard 
              title="장본 재료 추가하기" 
              renderIcon={() => <Camera size={20} color="#1E293B" />} 
              value="영수증 촬영" 
              sub="직접 추가하기"  
              alignRight={true} 
              onPress={handleCameraLaunch} 
              onSubPress={handleManualAdd} // 서브 버튼 클릭 시 직접 추가 함수 실행
            />
          </View>

          {/* 아랫줄 (3번, 4번 카드) */}
          <View style={styles.row}>
            {/* 3. 냉장고 속 재료 (유통기한 가장 임박한 재료 노출) */}
            <MenuCard 
              title="냉장고 속 재료" 
              value={imminentIngredient.name} 
              prefixText={imminentIngredient.dDay} // 이름 왼쪽에 D-day 데이터 삽입
              highlight 
              alignRight={true} // 우측 정렬 적용
              onPress={() => navigation.navigate('RefDetail')} 
            />

            {/* 4. 냉장고 털기 (현재 재료 기반 추천 요리 1순위) */}
            <MenuCard 
              title="냉장고 털기" 
              renderIcon={() => <Soup size={20} color="#1E293B" />} 
              value={topRecommendedRecipe} 
              sub="다른 요리 추천" 
              alignRight={true}
              // 카드 메인(우유 리조또 영역) 클릭 시 이동
              onPress={() => navigation.navigate('Recipe', { recipeName: topRecommendedRecipe })} 
              // 하단 '다른 요리 추천' 클릭 시 이동
              onSubPress={() => navigation.navigate('RecipeList')} 
            />
          </View>

        </View>
        {/* ============================================================
            [END] 하단 버튼 카드 영역
            ============================================================ */}
            
      </ScrollView>

      {/* 냉장고 관리 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isManageModalVisible}
        onRequestClose={() => setIsManageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>냉장고 관리</Text>
              
              <View style={styles.modalMenuContainer}>
                {/* 1. 냉장고 이름 입력 받기 */}
                <View style={styles.modalMenuItem}>
                  <Text style={styles.menuLabel}>냉장고 이름</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={styles.modalInput}
                      value={inputFridgeName}
                      onChangeText={setInputFridgeName}
                      placeholder="이름 입력"
                      selectTextOnFocus={true} 
                    />
                    <Text style={styles.menuValue}> 냉장고 〉</Text>
                  </View>
                </View>

                {/* 2. 냉장고 한달 식비 설정 */}
                <View style={styles.modalMenuItem}>
                  <Text style={styles.menuLabel}>한달 식비 설정</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={styles.modalInput}
                      value={monthlyBudget}
                      onChangeText={setMonthlyBudget}
                      onBlur={handleBudgetBlur}
                      keyboardType="numeric"
                      maxLength={4}
                      selectTextOnFocus={true} 
                    />
                    <Text style={styles.menuValue}> 만원 〉</Text>
                  </View>
                </View>

                {/* 3. 동거인 초대 */}
                <TouchableOpacity style={styles.modalMenuItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Users size={18} color="#1E293B" style={{marginRight: 8}}/>
                    <Text style={styles.menuLabel}>동거인 초대</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* 4. 냉장고 탈퇴/삭제 */}
                <TouchableOpacity style={[styles.modalMenuItem, {borderBottomWidth: 0}]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LogOut size={18} color="#EF4444" style={{marginRight: 8}}/>
                    <Text style={[styles.menuLabel, {color: '#EF4444'}]}>냉장고 탈퇴/삭제</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 하단 버튼 영역 */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} 
                  onPress={() => {
                    setIsManageModalVisible(false);
                    setInputFridgeName(confirmedFridgeName); 
                    setMonthlyBudget(lastValidBudget); 
                  }}
                >
                  <Text style={{ color: '#64748B', fontWeight: 'bold' }}>닫기</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#3B82F6' }]} 
                  onPress={handleSaveSettings}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>저장</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
};

// --- [공통 메뉴 카드 컴포넌트] ---
const MenuCard = ({ title, value, unit, sub, icon, highlight, onPress, isInput, onChangeText, onBlur, alignRight, prefixText, onSubPress, renderIcon, isSubCenter }) => ( // ★ isSubCenter Props 추가
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress || (() => {})} 
    activeOpacity={isInput ? 1 : 0.7} 
  >
    {/* 상단: 타이틀 */}
    <Text style={styles.cardTitle}>{title}</Text>
    
    {/* 중단: 중앙 컨텐츠 */}
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {prefixText ? (
        /* 3번 카드 전용 레이아웃: 반반 나누어 중앙 정렬 */
        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.cardPrefixBlue}>{prefixText}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.cardValue, highlight && { color: '#E11D48' }]} numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </Text>
          </View>
        </View>
      ) : (
        /* 기본 카드 레이아웃 (1, 2, 4번 카드) */
        <View style={[styles.cardContent, alignRight && { justifyContent: 'flex-end' }]}>
          
          {/* 아이콘 렌더링 */}
          {renderIcon ? (
            <View style={{ marginRight: 5 }}>{renderIcon()}</View>
          ) : icon ? (
            <Text style={styles.cardIcon}>{icon}</Text>
          ) : null}
          
          {isInput ? (
            <TextInput
              style={[styles.cardValue, styles.cardInput, alignRight && { textAlign: 'right' }]}
              value={String(value)}
              onChangeText={onChangeText}
              onBlur={onBlur}
              keyboardType="numeric"
              maxLength={4} 
              selectTextOnFocus={true} 
            />
          ) : (
            <Text style={[styles.cardValue, highlight && { color: '#E11D48' }]} numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </Text>
          )}
          {unit && <Text style={[styles.cardUnit, alignRight && { marginTop: 0 }]}>{unit}</Text>}
        </View>
      )}
    </View>

    {/* 하단: 서브 버튼 텍스트 */}
    {sub ? (
      onSubPress ? (
        <TouchableOpacity 
          onPress={onSubPress} 
          activeOpacity={0.6}
          style={styles.subBtnContainer} // 서브 버튼 클릭 영역 컨테이너
        >
          <Text style={[styles.subBtnText, highlight && { color: '#3B82F6' }]}>
            {sub}
          </Text>
          <ChevronRight size={10} color={highlight ? "#3B82F6" : "#94A3B8"} style={{marginLeft: 2}} />
        </TouchableOpacity>
      ) : (
        <Text style={[
          styles.cardSub, 
          highlight && { color: '#3B82F6' }, 
          alignRight && !isSubCenter && { textAlign: 'right' }, // isSubCenter가 아닐 때만 우측 정렬
          isSubCenter && { textAlign: 'center', width: '100%' }  // 1번 카드 서브 텍스트만 중앙 정렬
        ]}>
          {sub}
        </Text>
      )
    ) : (
      <View style={{ height: 14 }} /> 
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scrollContent: { paddingBottom: 100 },
  
  /* ============================================================
     [START] 게이지바 영역 스타일
     ============================================================ */
  topSection: {
    backgroundColor: '#FFFFFF', borderBottomLeftRadius: 50, borderBottomRightRadius: 50,
    paddingTop: 20, paddingBottom: 40, alignItems: 'center', elevation: 5,
  },
  brandTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3277', marginTop: 10, marginBottom: 20 },
  gaugeWrapper: { width: 280, alignItems: 'center' },
  gaugeBox: { width: 260, height: 130, position: 'relative' },
  gaugeContainer: { 
    width: 260, height: 130, overflow: 'hidden', alignItems: 'center', 
    justifyContent: 'flex-end', position: 'relative',
  },
  gaugeArcBackground: {
    width: 260, height: 260, borderRadius: 130, borderWidth: 25, borderColor: '#F1F5F9',
    borderBottomColor: 'transparent', borderLeftColor: 'transparent',
    position: 'absolute', top: 0, transform: [{ rotate: '-45deg' }],
  },
  gaugeFillActive: {
    width: 260, height: 260, borderRadius: 130, borderWidth: 25, borderColor: '#3B82F6',
    borderBottomColor: 'transparent', borderLeftColor: 'transparent',
    position: 'absolute', top: 0,
  },
  needleLayer: {
    width: 260, height: 260, position: 'absolute', top: 0, left: 0, alignItems: 'center', zIndex: 10,
  },
  needlePointer: { width: 1.8, height: 25, backgroundColor: '#FF3B30', borderRadius: 2 },
  needleText: { fontSize: 10, color: '#FF3B30', fontWeight: 'bold' },
  valueWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: -5 },
  mainValue: { fontSize: 58, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
  percentText: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginLeft: 4 },
  labelRow: { flexDirection: 'row', width: 260, justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
  middleLabelText: {
    fontSize: 12, color: '#94A3B8', fontWeight: '700',
    position: 'absolute', left: '50%', marginLeft: -15, top: -100,
  },
  subText: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  infoBox: { marginTop: 35, alignItems: 'center' },
  infoTitle: { fontSize: 16, color: '#3B82F6', fontWeight: '700', marginBottom: 6 },
  infoQuote: { fontSize: 14, color: '#64748B', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
  /* ============================================================
     [END] 게이지바 영역 스타일
     ============================================================ */


  /* ============================================================
     [START] 하단 버튼 카드 영역 스타일
     ============================================================ */
  
  /* 공통 카드 레이아웃 */
  cardGrid: { paddingHorizontal: 20, marginTop: 35 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: {
    backgroundColor: '#FFFFFF', width: (width - 55) / 2, borderRadius: 25, padding: 18, height: 135, // 보조 버튼 공간 확보 위해 미세 조정
    justifyContent: 'space-between', elevation: 3,
  },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  
  /* 카드 내부 아이콘 및 값 스타일 */
  cardIcon: { fontSize: 18, marginRight: 5 },
  cardPrefixBlue: { fontSize: 15, color: '#3B82F6', fontWeight: '500' }, 
  cardValue: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', maxWidth: '80%' },
  cardUnit: { fontSize: 13, color: '#1E293B', marginLeft: 2, marginTop: 3 },
  cardSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  /* 1번 카드(식비 입력) 전용 TextInput 스타일 */
  cardInput: { borderBottomWidth: 1, borderBottomColor: '#3B82F6', minWidth: 40, textAlign: 'center' },

  /* 보조 버튼 영역 스타일 */
  subBtnContainer: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  subBtnText: { fontSize: 10, color: '#033169', fontWeight: '800' },
  /* ============================================================
     [END] 하단 버튼 카드 영역 스타일
     ============================================================ */

  /* ============================================================
     [START] 새로 추가된 관리 버튼 및 모달 스타일
     ============================================================ */
  manageButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1001, // Header.js 의 zIndex 1000 보다 높게 설정
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 25,
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
  },
  /* ============================================================
     [END] 새로 추가된 관리 버튼 및 모달 스타일
     ============================================================ */
});

export default FridgeMainScreen;