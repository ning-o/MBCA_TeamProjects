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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 사장님 PC IP로 바꾸면 됩니다.
const API_BASE_URL = 'http://192.168.35.167:8000';

const OCRConfirmScreen = ({ route }) => {
  const navigation = useNavigation();

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
      id: item.id ?? index,
      rawName: String(
        item.raw_text ??
        item.rawName ??
        item.original_name ??
        item.name ??
        item.canonical_food ??
        ''
      ),
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

  // ★ 현재 사장님 백엔드 구조 대응
  if (responseData?.quantities && typeof responseData.quantities === 'object') {
    return Object.entries(responseData.quantities).map(([name, qty], index) => ({
      id: index,
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
      const url = `${API_BASE_URL}/api/fridge/ocr`;

      console.log('[OCR] 요청 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          // Content-Type은 FormData일 때 직접 넣지 않는 게 안전
        },
      });

      console.log('[OCR] response status:', response.status);

      const text = await response.text();
      console.log('[OCR] raw response:', text);

      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`서버 응답이 JSON 형식이 아닙니다: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data?.detail || `OCR 요청 실패 (HTTP ${response.status})`);
      }

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
      const payload = {
        items: items.map((item) => ({
          raw_name: item.rawName,
          matched_name: item.matchedName,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      console.log('[SAVE] payload:', JSON.stringify(payload));

      // 저장 API 붙일 때 사용
      // const response = await fetch(`${API_BASE_URL}/api/fridge/save-items`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      Alert.alert(
        '저장 완료',
        `${items.length}개의 항목이 냉장고에 등록되었습니다.`,
        [{ text: '확인', onPress: () => navigation.navigate('FridgeMain') }]
      );
    } catch (error) {
      console.error('[SAVE] 오류:', error);
      Alert.alert('저장 오류', '냉장고 저장 중 문제가 발생했습니다.');
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