import React, { useState, useRef, useEffect, useCallback } from 'react'; // useCallback 추가
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, Modal, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native'; 
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Soup, Camera, ChevronRight, Settings, Users, LogOut, UtensilsCrossed } from 'lucide-react-native'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // useFocusEffect 추가

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import OCRConfirmScreen from './OCRConfirmScreen';
import apiClient from '../../common/api/api_client'; // apiClient 임포트 추가

const { width, height } = Dimensions.get('window');

const FridgeMainScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); 

  // --- [힌트 애니메이션 로직 추가] ---
  const [showHint, setShowHint] = useState(true);
  const translateY = useRef(new Animated.Value(0)).current;

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

  // --- [데이터 및 실시간 날짜 로직] ---
  const spentAmount = 17;     
  const budgetStartDay = 1;

  const [monthlyBudget, setMonthlyBudget] = useState('30');
  const [lastValidBudget, setLastValidBudget] = useState('30'); 
  const parsedBudget = parseInt(monthlyBudget) || 1; 

  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [inputFridgeName, setInputFridgeName] = useState("띠끌이네"); 
  const [confirmedFridgeName, setConfirmedFridgeName] = useState("티끌이네"); 

  const recommendedMenu = "제철 달래 된장찌개";

  // 💡 [유통기한 임박 재료 상태 관리 추가]
  const [imminentIngredient, setImminentIngredient] = useState({ name: "재료 없음", dDay: "-" });

  // 💡 [실시간 연동 로직 추가]: 화면에 포커스 될 때마다 가장 임박한 재료를 조회합니다.
  useFocusEffect(
    useCallback(() => {
      const fetchImminentIngredient = async () => {
        try {
          const data = await apiClient.get('/api/fridge/inventory/1');
          
          if (data && data.length > 0) {
            // dday 기준으로 가장 값이 작은(임박한) 재료 찾기
            const closestItem = data.reduce((prev, curr) => (prev.dday < curr.dday ? prev : curr));
            
            let dDayText = '';
            if (closestItem.dday === 0) dDayText = 'D-Day';
            else if (closestItem.dday < 0) dDayText = `D+${Math.abs(closestItem.dday)}`; // 기한 지남
            else dDayText = `D-${closestItem.dday}`;

            setImminentIngredient({ name: closestItem.name, dDay: dDayText });
          } else {
            setImminentIngredient({ name: "재료 없음", dDay: "-" });
          }
        } catch (error) {
          console.error('[FridgeMain] 유통기한 임박 재료 조회 실패:', error);
        }
      };

      fetchImminentIngredient();
    }, [])
  );

  const handleBudgetBlur = () => {
    if (monthlyBudget.trim() === '' || parseInt(monthlyBudget) <= 0) {
      setMonthlyBudget(lastValidBudget);
    } else {
      setLastValidBudget(monthlyBudget);
    }
  };

  const handleSaveSettings = () => {
    setConfirmedFridgeName(inputFridgeName);
    setIsManageModalVisible(false);
    Keyboard.dismiss();
  };

  const handleOpenManageModal = () => {
    if (showHint) setShowHint(false); 
    setIsManageModalVisible(true);    
  };

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const consumptionRate = Math.min((spentAmount / parsedBudget) * 100, 100); 
  const moneyRotation = -225 + (consumptionRate / 100) * 180;

  const dayProgress = (currentDay - 1) / (totalDaysInMonth - 1);
  const dayRotation = -90 + (dayProgress * 180);

  const passedDays = currentDay >= budgetStartDay ? (currentDay - budgetStartDay + 1) : 1;
  const dailyAverage = spentAmount / passedDays;
  const projectedTotal = dailyAverage * totalDaysInMonth;
  const remainingOrOver = parsedBudget - projectedTotal;
  const isGoodPace = remainingOrOver >= 0;

  const handleCameraLaunch = async () => {
    navigation.navigate('CustomCamera');
  };

  const handleManualAdd = () => {
    navigation.navigate('OCRConfirm', { isManual: true }); 
  };

  const topRecommendedRecipe = "우유 리조또";

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TouchableOpacity 
        style={[styles.manageButton, { top: insets.top + 8 }]} 
        onPress={handleOpenManageModal}
      >
        <View style={styles.manageButtonContent}>
          <Settings size={22} color="#3B82F6" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ height: height * 0.08 }} />
        
        <View style={styles.topSection}>
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

        <View style={styles.cardGrid}>
          <View style={styles.row}>
            <MenuCard 
              title="장 보러 가기전에 추천" 
              value={recommendedMenu} 
              renderIcon={() => <UtensilsCrossed size={20} color="#1E293B" />} 
              sub="제철 음식이 땡기지 않나요?" 
              alignRight={true} 
              isSubCenter={true} 
              onPress={() => Alert.alert("LLM 연동 준비중", "현재 예산 페이스와 제철 식재료를 분석하여 장보기 최적화 메뉴 추천 기능을 준비중입니다.")} 
            />

            <MenuCard 
              title="장본 재료 추가하기" 
              renderIcon={() => <Camera size={20} color="#1E293B" />} 
              value="영수증 촬영" 
              sub="직접 추가하기"  
              alignRight={true} 
              onPress={handleCameraLaunch} 
              onSubPress={handleManualAdd} 
            />
          </View>

          <View style={styles.row}>
            {/* 💡 연동된 데이터(imminentIngredient)가 여기에 적용됩니다 */}
            <MenuCard 
              title="냉장고 속 재료" 
              value={imminentIngredient.name} 
              prefixText={imminentIngredient.dDay} 
              highlight 
              alignRight={true} 
              onPress={() => navigation.navigate('RefDetail')} 
            />

            <MenuCard 
              title="냉장고 털기" 
              renderIcon={() => <Soup size={20} color="#1E293B" />} 
              value={topRecommendedRecipe} 
              sub="다른 요리 추천" 
              alignRight={true}
              onPress={() => navigation.navigate('Recipe', { recipeName: topRecommendedRecipe })} 
              onSubPress={() => navigation.navigate('RecipeList')} 
            />
          </View>
        </View>
      </ScrollView>

      {showHint && (
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
                <Text style={styles.hintText}>냉장고 설정을 해주세요!</Text>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}

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

                <TouchableOpacity style={styles.modalMenuItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Users size={18} color="#1E293B" style={{marginRight: 8}}/>
                    <Text style={styles.menuLabel}>동거인 초대</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalMenuItem, {borderBottomWidth: 0}]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LogOut size={18} color="#EF4444" style={{marginRight: 8}}/>
                    <Text style={[styles.menuLabel, {color: '#EF4444'}]}>냉장고 탈퇴/삭제</Text>
                  </View>
                </TouchableOpacity>
              </View>

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

const MenuCard = ({ title, value, unit, sub, icon, highlight, onPress, isInput, onChangeText, onBlur, alignRight, prefixText, onSubPress, renderIcon, isSubCenter }) => ( 
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress || (() => {})} 
    activeOpacity={isInput ? 1 : 0.7} 
  >
    <Text style={styles.cardTitle}>{title}</Text>
    
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {prefixText ? (
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
        <View style={[styles.cardContent, alignRight && { justifyContent: 'flex-end' }]}>
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

    {sub ? (
      onSubPress ? (
        <TouchableOpacity 
          onPress={onSubPress} 
          activeOpacity={0.6}
          style={styles.subBtnContainer} 
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
          alignRight && !isSubCenter && { textAlign: 'right' }, 
          isSubCenter && { textAlign: 'center', width: '100%' }  
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
  cardGrid: { paddingHorizontal: 20, marginTop: 35 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: {
    backgroundColor: '#FFFFFF', width: (width - 55) / 2, borderRadius: 25, padding: 18, height: 135, 
    justifyContent: 'space-between', elevation: 3,
  },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 18, marginRight: 5 },
  cardPrefixBlue: { fontSize: 15, color: '#3B82F6', fontWeight: '500' }, 
  cardValue: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', maxWidth: '80%' },
  cardUnit: { fontSize: 13, color: '#1E293B', marginLeft: 2, marginTop: 3 },
  cardSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  cardInput: { borderBottomWidth: 1, borderBottomColor: '#3B82F6', minWidth: 40, textAlign: 'center' },
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
    backgroundColor: '#EBF2FF', 
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginLeft: 4,
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

export default FridgeMainScreen;