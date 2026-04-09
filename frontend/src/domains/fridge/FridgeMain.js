import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, Modal, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native'; 
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Soup, Camera, ChevronRight, Settings, Users, LogOut, UtensilsCrossed } from 'lucide-react-native'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';
import apiClient from '../../common/api/api_client';
import { saveRefrigeratorData } from './FridgeComponents/FridgeRefrigerator';

const { width, height } = Dimensions.get('window');

const FridgeMainScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); 

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

  // const spentAmount = 17; # 홈 화면 게이지 목데이터    
  const [spentAmount, setSpentAmount] = useState(0); // 실시간 지출액 상태
  const budgetStartDay = 1;

  const [monthlyBudget, setMonthlyBudget] = useState('30');
  const [lastValidBudget, setLastValidBudget] = useState('30'); 
  const parsedBudget = parseInt(monthlyBudget) || 1; 

  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [inputFridgeName, setInputFridgeName] = useState("띠끌이네"); 
  const [confirmedFridgeName, setConfirmedFridgeName] = useState("티끌이네");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myInvenId, setMyInvenId] = useState(null);

  const recommendedMenu = "AI의 제철음식 추천 받기";

  const [imminentIngredient, setImminentIngredient] = useState({ name: "재료 없음", dDay: "-" });
  
  /** * [수정] 하드코딩 제거 및 상태 관리 추가
   * - topRecommendedRecipe를 상태로 관리하여 API 결과 반영
   */
  const [topRecommendedRecipe, setTopRecommendedRecipe] = useState("레시피 조회중...");

  /**
   * [수정] 레시피 추천용 데이터 가공 함수 (Recipe.js와 동일 규격)
   */
  const buildInputStock = (inventoryData) => {
    const stock = {};
    (inventoryData || []).forEach((item) => {
      const name = item.item_name || item.name || item.ingredient_name;
      const quantity = item.quantity ?? item.amount ?? 1;
      if (name) stock[name] = quantity;
    });
    return stock;
  };

  /**
   * [실시간 연동 로직] 화면 포커스 시 인벤토리 조회 및 냉털 레시피 추천
   * - route params 또는 AsyncStorage에서 확보한 myInvenId를 기준으로 데이터 로드
   */
  useFocusEffect(
  useCallback(() => {
    const fetchData = async () => {
      try {
        const targetInvenId = route?.params?.invenId || myInvenId;

        if (!targetInvenId) {
          console.log('[FridgeMain] 인벤토리 ID 대기 중...');
          return;
        }  

        console.log(`[FridgeMain] 조회 시작 - ID: ${targetInvenId}`);

        // 1) 냉장고 상세
        const detailsUrl = apiClient.urls.FRIDGE.GET_DETAILS(targetInvenId);
        console.log("[FridgeMain] details URL:", detailsUrl);

        const details = await apiClient.get(detailsUrl);

        if (details) {
          setConfirmedFridgeName(details.inven_nickname || "티끌이네");
          setInputFridgeName(details.inven_nickname || "티끌이네");

          const budgetStr = String(details.mounth_food_exp ?? '30');
          setMonthlyBudget(budgetStr);
          setLastValidBudget(budgetStr);
        }

        // 2) 지출 합계
        try {
          const summaryUrl = apiClient.urls.FRIDGE.GET_SPENDING_SUMMARY(targetInvenId);
          console.log("[FridgeMain] summary URL:", summaryUrl);

          const summaryData = await apiClient.get(summaryUrl);

          if (summaryData && summaryData.total_spent !== undefined) {
            setSpentAmount(summaryData.total_spent / 10000);
          }
        } catch (summaryErr) {
          console.error('[FridgeMain] 지출 합계 로드 실패:', summaryErr);
        }

        // 3) 인벤토리 조회
        const inventoryUrl = apiClient.urls.FRIDGE.GET_INVENTORY(targetInvenId);
        console.log("[FridgeMain] inventory URL:", inventoryUrl);

        const inventoryData = await apiClient.get(inventoryUrl);

        console.log(`[FridgeMain] ${targetInvenId}번 냉장고 접속 성공!`);

        if (inventoryData && inventoryData.length > 0) {
          console.log(`[FridgeMain] 총 ${inventoryData.length}개의 재료 데이터 수신 완료`);

          const sortedData = [...inventoryData].sort((a, b) => {
            const valA = a.d_days || a.dday || "";
            const valB = b.d_days || b.dday || "";

            if (typeof valA === 'string' && typeof valB === 'string') {
              return valA.localeCompare(valB);
            }
            return Number(valA) - Number(valB);
          });

          const closestItem = sortedData[0];
          let dDayText = '';
          let ddayNum = 0;

          if (closestItem.dday !== undefined && typeof closestItem.dday === 'number') {
            ddayNum = closestItem.dday;
          } else if (closestItem.d_days) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const expiryDate = new Date(String(closestItem.d_days).replace(/-/g, '/'));
            expiryDate.setHours(0, 0, 0, 0);

            const diffTime = expiryDate.getTime() - today.getTime();
            ddayNum = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          if (ddayNum === 0) dDayText = 'D-Day';
          else if (ddayNum < 0) dDayText = `D+${Math.abs(ddayNum)}`;
          else dDayText = `D-${ddayNum}`;

          setImminentIngredient({
            name: closestItem.ingredient_name || closestItem.name || "알 수 없음",
            dDay: dDayText,
          });

          const input_stock = buildInputStock(inventoryData);

          const recipeResult = await apiClient.post(
            apiClient.urls.FRIDGE.RECOMMEND_RECIPE,
            {
              input_stock,
              top_k: 1,
            }
          );

          if (recipeResult?.recipes && recipeResult.recipes.length > 0) {
            setTopRecommendedRecipe(recipeResult.recipes[0].recipe_name);
          } else {
            setTopRecommendedRecipe("추천 레시피 없음");
          }
        } else {
          console.log('[FridgeMain] 현재 냉장고가 비어있음 (Inventory Empty)');
          setImminentIngredient({ name: "재료 없음", dDay: "-" });
          setTopRecommendedRecipe("재료를 추가해주세요");
        }
      } catch (error) {
            console.error('[FridgeMain] 데이터 통합 조회 중 예외 발생:', error);
            console.error('[FridgeMain] 응답 status:', error?.response?.status);
            console.error('[FridgeMain] 응답 data:', error?.response?.data);
            console.error('[FridgeMain] 실패 URL:', error?.config?.url);
            console.error('[FridgeMain] 실패 method:', error?.config?.method);
            setTopRecommendedRecipe("조회 실패");
          }
    };

    fetchData();
  }, [route?.params?.invenId, myInvenId])
);

  const handleBudgetBlur = () => {
    if (monthlyBudget.trim() === '' || parseInt(monthlyBudget) <= 0) {
      setMonthlyBudget(lastValidBudget);
    } else {
      setLastValidBudget(monthlyBudget);
    }
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
              onPress={() => navigation.navigate('SeasonalRecommendFood')}
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
              alignRight={true}
              onPress={() => navigation.navigate('Recipe', { recipeName: topRecommendedRecipe })} 
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
  cardPrefixBlue: { fontSize: 15, color: '#3B82F6', fontWeight: '500', marginRight: 10, }, 
  cardValue: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', maxWidth: '85%' },
  cardUnit: { fontSize: 13, color: '#1E293B', marginLeft: 6, marginTop: 3 },
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