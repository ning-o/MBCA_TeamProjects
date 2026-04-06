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

// [추가]: 중앙 집중식 API 관리를 위해 설계해둔 apiClient를 임포트.
// [이유]: 파일마다 IP를 하드코딩하지 않고 환경변수(.env) 기반의 baseUrl을 공통으로 사용하기 위함. 
import apiClient from '../../common/api/api_client';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// [수정]: 기존에 하드코딩되어 있던 API_BASE_URL 변수 선언을 삭제.
// [이유]: 통신 기본 주소는 apiClient 내부에서 config.js(또는 .env)의 값을 자동으로 참조하도록 설계되어 있기 때문.

const OCRConfirmScreen = ({ route }) => {
  const navigation = useNavigation();

  const invenId = route.params?.invenId || 1;

  const photoUri = route.params?.photoUri;
  const isManual = route.params?.isManual || false;

  const [loading, setLoading] = useState(!isManual);
  const [items, setItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(isManual ? 0 : null);

  useEffect(() => {
    if (isManual) {
      setItems([{ rawName: '', matchedName: '', quantity: '1', price: '' }]);
      return;
    }

    if (!photoUri) {
      Alert.alert('오류', '촬영된 이미지가 없습니다.');
      setLoading(false);
      return;
    }

    runOCR();
  }, [isManual, photoUri]);

  const getFileNameFromUri = (uri) => {
    const last = uri.split('/').pop();
    if (!last) return `ocr_${Date.now()}.jpg`;
    return last.includes('.') ? last : `${last}.jpg`;
  };

  const getMimeTypeFromUri = (uri) => {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.heic')) return 'image/heic';
    if (lower.endsWith('.heif')) return 'image/heif';
    return 'image/jpeg';
  };

  const normalizeParsedItems = (responseData) => {
    const parsed =
      responseData?.parsed_items ||
      responseData?.items ||
      responseData?.results ||
      null;

    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ({
        // 인덱스가 0부터 시작하므로 DB(Pantry)의 1번부터 매칭되도록 + 1 추가
        id: (item.id ?? index) + 1, 
        rawName: String(
          item.raw_text ??
          item.rawName ??
          item.original_name ??
          item.name ??
          item.canonical_food ??
          ''
        ).trim(),
        matchedName: String(
          item.canonical_food ??
          item.matchedName ??
          item.matched_name ??
          item.item_name ??
          item.name ??
          ''
        ),
        quantity: String(item.quantity ?? item.qty ?? 1),
        price: String(item.price ?? item.amount ?? ''),
      }));
    }

    // 현재 사장님 백엔드 구조 대응 (객체 형태일 때)
    if (responseData?.quantities && typeof responseData.quantities === 'object') {
      return Object.entries(responseData.quantities).map(([name, qty], index) => ({
        // [수정]: 여기서도 1번부터 시작하기 위해 index + 1 적용
        id: index + 1, 
        rawName: name,
        matchedName: name,
        quantity: String(qty ?? 1),
        price: '',
      }));
    }

    return [];
  };

  const runOCR = async () => {
    try {
      setLoading(true);

      console.log('[OCR] photoUri:', photoUri);

      const fileName = getFileNameFromUri(photoUri);
      const mimeType = getMimeTypeFromUri(photoUri);

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: fileName,
        type: mimeType,
      });

      // 백엔드 엔드포인트에 맞춰 둘 중 하나 사용
      // 1) 원문 OCR만 확인용: /api/fridge/ocr/test
      // 2) 품목 파싱까지 포함: /api/fridge/ocr/analyze
      
      // [수정]: 기존 fetch API 통신 로직을 제거하고, apiClient.post 방식으로 교체.
      // [이유]: fetch 사용 시 필요했던 수동 에러 처리(response.ok)와 JSON 파싱 과정을 apiClient 인터셉터가 자동으로 처리해주어 중복 코드를 방지.
      console.log('[OCR] 요청 URL:', apiClient.urls.FRIDGE.OCR);

      const data = await apiClient.post(apiClient.urls.FRIDGE.OCR, formData, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
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

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

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

  const addItem = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems([...items, { rawName: '', matchedName: '', quantity: '1', price: '' }]);
    setExpandedIndex(items.length);
  };

  const handleSave = async () => {
    try {
      if (!items || items.length === 0) {
        Alert.alert('알림', '저장할 항목이 없습니다.');
        return;
      }

      // [실전 구동용 페이로드 구성]
      // 1. inven_id: 실제 접속 중인 냉장고 ID 사용
      // 2. ingredient_id: OCR 결과(normalizeParsedItems)에서 매칭된 실제 마스터 ID
      // 3. storage_type: 스키마 규격에 맞게 문자열 "1"(냉장)로 전송
      // 4. quantity: 숫자형(Int)으로 변환
      // 5. phurchase_date: 현재 날짜 전송
      
      const payload = items.map((item) => ({
        inven_id: invenId, 
        ingredient_id: item.id, // OCR 분석 단계에서 Pantry DB와 매칭된 실제 ID
        storage_type: String(item.storageType || "1"),
        quantity: parseInt(item.quantity) || 1, 
        phurchase_date: new Date().toISOString().split('T')[0], 
      }));

      console.log('[SAVE] 실전 데이터 전송 시작:', JSON.stringify(payload));

      // [실제 API 호출 활성화]
      const responseData = await apiClient.post(apiClient.urls.FRIDGE.SAVE_ITEMS, payload);
      
      console.log('[SAVE] 서버 응답 결과:', responseData);

      if (responseData.status === "success") {
        Alert.alert(
          '저장 완료',
          `${responseData.saved_count}개의 항목이 냉장고에 등록되었습니다.`,
          [{ text: '확인', onPress: () => navigation.navigate('FridgeMain') }]
        );
      } else {
        // 일부 실패 시 에러 메시지 표시
        const errorMsg = responseData.errors?.map(e => e.error).join('\n');
        Alert.alert('부분 저장 실패', `일부 항목 저장 중 오류가 발생했습니다.\n${errorMsg}`);
      }

    } catch (error) {
      console.error('[SAVE] 실전 구동 중 치명적 오류:', error);
      Alert.alert('통신 오류', '서버와 연결할 수 없거나 데이터 규격이 맞지 않습니다.');
    }
  };

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
                              {item.matchedName || item.rawName || '(이름 없음)'}
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