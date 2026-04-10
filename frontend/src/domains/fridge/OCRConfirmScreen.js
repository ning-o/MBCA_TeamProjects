import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../common/components/Header';
import apiClient from '../../common/api/api_client';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * [Android 전용 설정]
 * LayoutAnimation은 Android에서 기본적으로 비활성화되어 있으므로
 * UIManager를 통해 명시적으로 활성화해야 애니메이션이 정상 작동함.
 */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * OCRConfirmScreen: 영수증 분석 결과 검토 및 품목 데이터 확정 화면
 * - OCR 분석 결과를 사용자에게 보여주고 수동 보정(명칭, 수량, 가격) 기회 제공
 * - 최종 확정된 데이터를 서버(DB)에 일괄 저장하는 트랜잭션 전 단계 역할
 */
const OCRConfirmScreen = ({ route }) => {
  const navigation = useNavigation();

  // [파라미터 확보] FridgeMain 또는 Camera에서 전달받은 인벤토리 ID 및 이미지 경로
  const invenId = route.params?.invenId || 1;
  const photoUri = route.params?.photoUri;
  const isManual = route.params?.isManual || false;

  // [상태 관리] 로딩 여부, 분석된 아이템 목록, 현재 수정 중인 카드 인덱스
  const [loading, setLoading] = useState(!isManual);
  const [items, setItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(isManual ? 0 : null);

  useEffect(() => {
    // 직접 추가 모드일 경우 빈 입력 필드 생성 후 종료
    if (isManual) {
      setItems([{ rawName: '', matchedName: '', quantity: '1', price: '' }]);
      return;
    }

    // OCR 모드인데 이미지가 없다면 예외 처리
    if (!photoUri) {
      Alert.alert('오류', '촬영된 이미지가 없습니다.');
      setLoading(false);
      return;
    }

    runOCR();
  }, [isManual, photoUri]);

  /**
   * [Helper] 이미지 파일 시스템 경로에서 파일명 추출
   */
  const getFileNameFromUri = (uri) => {
    const last = uri.split('/').pop();
    if (!last) return `ocr_${Date.now()}.jpg`;
    return last.includes('.') ? last : `${last}.jpg`;
  };

  /**
   * [Helper] 확장자 기반 MIME Type 결정 (이미지 서버 전송용)
   */
  const getMimeTypeFromUri = (uri) => {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.heic')) return 'image/heic';
    if (lower.endsWith('.heif')) return 'image/heif';
    return 'image/jpeg';
  };

  /**
   * normalizeParsedItems: 서버 응답 데이터 정규화
   * - 신규 리스트 방식(items)과 기존 객체 방식(quantities)을 모두 완벽히 대응하도록 수리했습니다.
   */
  const normalizeParsedItems = (responseData) => {
    // 1. [검문 강화] items 리스트가 실제로 '데이터를 포함'하고 있는지 먼저 확인합니다.
    const itemsList = responseData?.items || responseData?.parsed_items || responseData?.results || [];

    if (Array.isArray(itemsList) && itemsList.length > 0) {
      // 리스트에 알맹이가 있다면 이 로직을 태웁니다.
      return itemsList.map((item, index) => ({
        id: (item.id ?? index) + 1, 
        // [수정] 백엔드에서 온 상세 명칭(ex: 오겹살)을 rawName에 우선 할당
        rawName: String(item.original_name ?? item.canonical_food ?? '').trim(),
        // DB 매칭용 표준 명칭(ex: 돼지고기)은 matchedName에 보관 (서버 전송용)
        matchedName: String(item.ingredient_id ?? ''),
        quantity: String(item.quantity ?? 1),
        price: String(item.after_price ?? item.price ?? ''),
      }));
    }

    // 2. [비상 전력] 리스트가 비었거나 없을 경우, 로그에 찍혔던 quantities(객체)를 뒤져서 복구합니다.
    if (responseData?.quantities && typeof responseData.quantities === 'object' && Object.keys(responseData.quantities).length > 0) {
      return Object.entries(responseData.quantities).map(([name, qty], index) => ({
        id: index + 1, 
        rawName: name,
        matchedName: name,
        quantity: String(qty ?? 1),
        price: '', // 예전 방식은 가격이 없으므로 빈값 처리
      }));
    }

    // 3. 둘 다 없으면 빈 배열 반환
    return [];
  };

  /**
   * [API 연동 1] runOCR: 영수증 이미지 분석 요청
   * - 엔드포인트: apiClient.urls.FRIDGE.OCR (/api/fridge/ocr)
   * - 방식: multipart/form-data (FormData 객체를 통해 파일 바이너리 전송)
   * - 특징: apiClient 전역 설정을 이용하되, 파일 전송을 위해 Content-Type만 개별 Override함
   */
  const runOCR = async () => {
    try {
      setLoading(true);

      console.log('[OCR] photoUri:', photoUri);

      const fileName = getFileNameFromUri(photoUri);
      const mimeType = getMimeTypeFromUri(photoUri);

      // 파일 데이터 포장 (Multipart 규격)
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: fileName,
        type: mimeType,
      });

      console.log('[OCR] 요청 URL:', apiClient.urls.FRIDGE.OCR);

      // API 호출: apiClient 인터셉터(JWT, 공통 에러 처리) 로직이 자동으로 적용됨
      const data = await apiClient.post(apiClient.urls.FRIDGE.OCR, formData, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data', // 파일 전송을 위한 헤더 설정
        },
      });

      console.log('[OCR] response data:', data);

      const normalizedItems = normalizeParsedItems(data);

      if (!normalizedItems.length) {
        Alert.alert(
          '안내',
          'OCR은 완료되었지만 추출된 품목이 없습니다. 직접 수정해주세요.'
        );
        setItems([{ rawName: '', matchedName: '', quantity: '1', price: '' }]);
        setExpandedIndex(0);
        return;
      }

      setItems(normalizedItems);
      setExpandedIndex(null);
    } catch (error) {
      console.error('[OCR] 오류:', error);
      Alert.alert('OCR 오류', error.message || '이미지 분석 중 문제가 발생했습니다.');
      setItems([{ rawName: '', matchedName: '', quantity: '1', price: '' }]);
      setExpandedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * [UI/UX] 토글 제어
   * LayoutAnimation을 사용하여 카드가 펼쳐지고 접히는 동작을 부드럽게 구현
   */
  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  /**
   * [데이터 보정] 특정 필드(이름, 수량 등) 수정 시 상태 업데이트
   */
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  /**
   * [데이터 관리] 품목 삭제
   */
  const removeItem = (index) => {
    if (items.length <= 1) {
      Alert.alert('알림', '최소 하나의 항목은 있어야 합니다.');
      return;
    }

    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  };

  /**
   * [데이터 관리] 신규 품목 필드 추가
   */
  const addItem = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems([...items, { rawName: '', matchedName: '', quantity: '1', price: '' }]);
    setExpandedIndex(items.length);
  };


  /**
   * [영수증 데이터 저장 로직]
   * - 인식된 식재료 리스트를 현재 로그인한 유저의 냉장고(inven_id)로 전송
   */
  const handleSave = async () => {
    try {
      // 1. 유효성 검사: 저장할 항목 유무 확인
      if (!items || items.length === 0) {
        Alert.alert('알림', '저장할 항목이 없습니다.');
        return;
      }

      // ---------------------------------------------------------
      // 유저의 실제 냉장고 ID 검증 로직 강화
      // ---------------------------------------------------------
      const userInfo = await AsyncStorage.getItem('userInfo');
      let myRealInvenId = null; // 기존의 임의 할당(1) 제거

      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        if (parsed.inven_id) {
          myRealInvenId = parsed.inven_id;
        }
      }

      // 유효한 냉장고 ID가 없을 경우 저장을 차단하고 안내합니다.
      if (!myRealInvenId) {
        Alert.alert(
          '저장 불가',
          '활성화된 냉장고 정보를 찾을 수 없습니다.\n계정에 냉장고가 생성되어 있는지 확인해주세요.'
        );
        return;
      }
      // ---------------------------------------------------------

      // 2. 서버 DTO 규격에 맞춰 페이로드 구성 (IngredientCreate 스키마 대응)
      const payload = items.map((item) => ({
        inven_id: myRealInvenId, // 진짜 냉장고 ID
        ingredient_id: item.id,
        ingredient_name: item.matchedName ? item.matchedName.trim() : "", // 공백 제거 처리 추가
        storage_type: String(item.storageType || "1"), // 기본값 냉장(1) 할당
        quantity: parseInt(item.quantity) || 1, 
        phurchase_date: new Date().toISOString().split('T')[0], // 오늘 날짜 기록
        after_price: parseInt(item.price, 10) || 0,
      }));

      console.log(`[SAVE] 데이터 전송 시작 (대상 냉장고 ID: ${myRealInvenId})`);

      // 3. API 호출: apiClient 인터셉터에 의해 Authorization 헤더가 자동 부착됨
      const responseData = await apiClient.post(apiClient.urls.FRIDGE.SAVE_ITEMS, payload);
      console.log('[SAVE] 서버 응답 결과:', responseData);

      // 4. 저장 결과 상태에 따른 후속 조치
      if (responseData.status === "success") {
        Alert.alert(
          '저장 완료',
          `${responseData.saved_count}개의 항목이 냉장고에 등록되었습니다.`,
          [
            { 
              text: '확인', 
              // 성공 시 메인 냉장고 화면으로 네비게이션 이동
              onPress: () => navigation.navigate('FridgeMain', { screen: 'FridgeMain' }) 
            }
          ]
        );
      } else {
        // partial_success 등 일부 실패 케이스 대응 (DB 미등록 품목 등)
        const errorMsg = responseData.errors?.map(e => e.error).join('\n') || "미등록 품목 제외";
        Alert.alert(
          '일부 저장 성공', 
          `일부 항목을 제외하고 저장이 완료되었습니다.\n(제외 사유: 미등록 품목)\n\n${errorMsg}`,
          [
            { 
              text: '확인', 
              onPress: () => navigation.navigate('FridgeMain', { screen: 'FridgeMain' }) 
            }
          ]
        );
      }

    } catch (error) {
      // API 통신 및 데이터 파싱 관련 예외 처리
      console.error('[SAVE] 데이터 저장 중 치명적 오류:', error);
      Alert.alert('통신 오류', '서버와 연결할 수 없거나 데이터 규격이 맞지 않습니다.');
    }
  };

  // 뷰 렌더링 영역 (구조 및 스타일 보존)
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 60 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>AI가 영수증 항목을 추출하고 있습니다...</Text>
            </View>
          ) : (
            <>
              <View style={styles.titleRow}>
                <Text style={styles.title}>
                  {isManual ? '재료 직접 추가' : '재료 확인'}
                </Text>

                <TouchableOpacity onPress={addItem} style={styles.addButton}>
                  <Text style={styles.addButtonText}>+ 항목 추가</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.resultList}>
                {items.map((item, index) => {
                  const isExpanded = expandedIndex === index;

                  return (
                    <View
                      key={`${index}-${item.rawName}-${item.matchedName}`}
                      style={[styles.itemCard, isExpanded && styles.expandedCard]}
                    >
                      {!isExpanded && (
                        <TouchableOpacity
                          style={styles.collapsedView}
                          onPress={() => toggleExpand(index)}
                        >
                          <View style={styles.collapsedInfo}>
                            <Text style={styles.itemIndex}>{index + 1}</Text>
                            <Text style={styles.itemNameSimple} numberOfLines={1}>
                              {item.rawName || item.matchedName || '(이름 없음)'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#3B82F6', marginRight: 15 }}>
                              {item.price ? `${item.price}원` : ''} 
                            </Text>
                            <Text style={styles.itemQuantitySimple}>
                              수량: {item.quantity}
                            </Text>
                          </View>

                          <View style={styles.actionGroup}>
                            <Text style={styles.editButtonText}>수정</Text>
                            <Ionicons name="chevron-down" size={16} color="#3B82F6" />
                          </View>
                        </TouchableOpacity>
                      )}

                      {isExpanded && (
                        <View style={styles.expandedView}>
                          <View style={styles.cardHeader}>
                            <Text style={styles.cardIndex}>품목 {index + 1} 상세 수정</Text>
                            <View style={styles.headerActions}>
                              <TouchableOpacity
                                onPress={() => removeItem(index)}
                                style={styles.iconBtn}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => toggleExpand(index)}
                                style={styles.iconBtn}
                              >
                                <Ionicons
                                  name="chevron-up"
                                  size={18}
                                  color="#64748B"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                              {isManual ? '품목명' : '영수증 원본명'}
                            </Text>
                            <TextInput
                              style={[styles.input, !isManual && styles.readonlyInput]}
                              value={item.rawName}
                              onChangeText={(text) => updateItem(index, 'rawName', text)}
                              editable={isManual}
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>냉장고 등록 명칭</Text>
                            <TextInput
                              style={styles.input}
                              value={item.matchedName}
                              onChangeText={(text) =>
                                updateItem(index, 'matchedName', text)
                              }
                              placeholder="예: 우유, 계란"
                            />
                          </View>

                          <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                              <Text style={styles.label}>수량</Text>
                              <TextInput
                                style={styles.input}
                                value={item.quantity}
                                onChangeText={(text) => updateItem(index, 'quantity', text)}
                                keyboardType="numeric"
                              />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                              <Text style={styles.label}>가격(원)</Text>
                              <TextInput
                                style={styles.input}
                                value={item.price}
                                onChangeText={(text) => updateItem(index, 'price', text)}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.closeExpandedBtn}
                            onPress={() => toggleExpand(index)}
                          >
                            <Text style={styles.closeExpandedBtnText}>수정 완료</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {!loading && (
        <View style={styles.bottomFixedArea}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              냉장고에 모두 넣기 ({items.length}개)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scrollContent: { padding: 16, paddingTop: 10, paddingBottom: 30 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  addButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addButtonText: { fontSize: 12, color: '#475569', fontWeight: '600' },

  loadingBox: { marginTop: 40, alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748B', fontWeight: '500' },

  resultList: { width: '100%' },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  expandedCard: { borderColor: '#3B82F6', borderWidth: 1.5, elevation: 3 },

  collapsedView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  collapsedInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  itemNameSimple: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  itemQuantitySimple: { fontSize: 13, color: '#64748B', marginRight: 10 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  editButtonText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },

  expandedView: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardIndex: { fontSize: 13, fontWeight: 'bold', color: '#3B82F6' },
  headerActions: { flexDirection: 'row' },
  iconBtn: { marginLeft: 12 },

  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: '700' },
  input: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  readonlyInput: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
  closeExpandedBtn: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  closeExpandedBtnText: { color: '#475569', fontSize: 13, fontWeight: '600' },

  bottomFixedArea: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#F8FAFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});

export default OCRConfirmScreen;