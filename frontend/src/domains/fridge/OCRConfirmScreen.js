import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // 아이콘 라이브러리 추가
import Header from '../../common/components/Header';

// 안드로이드에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OCRConfirmScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const photoUri = route.params?.photoUri;
  const isManual = route.params?.isManual || false; 

  const [loading, setLoading] = useState(!isManual); 
  const [items, setItems] = useState([]);
  
  // ★ 핵심: 어떤 항목이 펼쳐져 있는지 관리하는 상태 (null이면 모두 접힘) ★
  const [expandedIndex, setExpandedIndex] = useState(isManual ? 0 : null); 

  useEffect(() => {
    if (isManual) {
      setItems([{ rawName: '', matchedName: '', quantity: '1', price: '' }]);
      return;
    }

    // 가상의 다중 항목 데이터 주입 (나중에 API 연결)
    const fakeAnalysis = setTimeout(() => {
      setItems([
        { rawName: '유기농 우유 1000ml (행사)', matchedName: '우유', quantity: '1', price: '3500' },
        { rawName: '감자 1봉(5입/국산)', matchedName: '감자', quantity: '1', price: '4200' },
        { rawName: '서울 요거트 4입', matchedName: '요거트', quantity: '1', price: '2800' },
        { rawName: '크린랩 위생장갑', matchedName: '위생장갑', quantity: '1', price: '1500' },
        { rawName: '진라면 매운맛 5입', matchedName: '라면', quantity: '1', price: '3850' },
      ]);
      setLoading(false); 
    }, 2500);

    return () => clearTimeout(fakeAnalysis);
  }, [isManual]);

  // ★ 펼치기/접기 토글 함수 (애니메이션 효과 추가) ★
  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedIndex === index) {
      setExpandedIndex(null); // 이미 펼쳐진 걸 누르면 접음
    } else {
      setExpandedIndex(index); // 새로운 항목 펼침
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      Alert.alert("알림", "최소 하나의 항목은 있어야 합니다.");
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const addItem = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems([...items, { rawName: '', matchedName: '', quantity: '1', price: '' }]);
    setExpandedIndex(items.length); // 새 항목 추가 시 바로 펼침
  };

  const handleSave = () => {
    Alert.alert(
      "저장 완료", 
      `${items.length}개의 항목이 냉장고에 등록되었습니다.`,
      [{ text: "확인", onPress: () => navigation.navigate('FridgeMain') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ 
          flex: 1,
          marginTop: 60
        }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>AI가 영수증 항목을 추출하고 있습니다...</Text>
            </View>
          ) : (
            <>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{isManual ? "재료 직접 추가" : "재료 확인"}</Text>
                {isManual && (
                  <TouchableOpacity onPress={addItem} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ 항목 추가</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.resultList}>
                {items.map((item, index) => {
                  const isExpanded = expandedIndex === index;
                  
                  return (
                    <View key={index} style={[styles.itemCard, isExpanded && styles.expandedCard]}>
                      
                      {/* 1. 접혔을 때 보이는 간결한 한 줄 (Collapsed View) ★ */}
                      {!isExpanded && (
                        <TouchableOpacity style={styles.collapsedView} onPress={() => toggleExpand(index)}>
                          <View style={styles.collapsedInfo}>
                            <Text style={styles.itemIndex}>{index + 1}</Text>
                            <Text style={styles.itemNameSimple} numberOfLines={1}>
                              {item.matchedName || item.rawName || "(이름 없음)"}
                            </Text>
                            <Text style={styles.itemQuantitySimple}>수량: {item.quantity}</Text>
                          </View>
                          <View style={styles.actionGroup}>
                            <Text style={styles.editButtonText}>수정</Text>
                            <Ionicons name="chevron-down" size={16} color="#3B82F6" />
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* 2. 펼쳤을 때 보이는 상세 입력폼 (Expanded View) ★ */}
                      {isExpanded && (
                        <View style={styles.expandedView}>
                          <View style={styles.cardHeader}>
                            <Text style={styles.cardIndex}>품목 {index + 1} 상세 수정</Text>
                            <View style={styles.headerActions}>
                              <TouchableOpacity onPress={() => removeItem(index)} style={styles.iconBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => toggleExpand(index)} style={styles.iconBtn}>
                                <Ionicons name="chevron-up" size={18} color="#64748B" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>{isManual ? "품목명" : "영수증 원본명"}</Text>
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
                              onChangeText={(text) => updateItem(index, 'matchedName', text)}
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
                          <TouchableOpacity style={styles.closeExpandedBtn} onPress={() => toggleExpand(index)}>
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
            <Text style={styles.saveButtonText}>냉장고에 모두 넣기 ({items.length}개)</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scrollContent: { padding: 16, paddingTop: 10, paddingBottom: 30 }, // ScrollView 내부 패딩 조정
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  addButton: { backgroundColor: '#E2E8F0', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  addButtonText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  
  loadingBox: { marginTop: 40, alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748B', fontWeight: '500' },

  resultList: { width: '100%' },
  itemCard: { 
    backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
    overflow: 'hidden' // 애니메이션 시 내용물이 카드를 빠져나가지 않게
  },
  expandedCard: { borderColor: '#3B82F6', borderWidth: 1.5, elevation: 3 },

  // --- [접혔을 때 스타일] ---
  collapsedView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  collapsedInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIndex: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginRight: 10, width: 20, textAlign: 'center' },
  itemNameSimple: { fontSize: 15, fontWeight: '500', color: '#1E293B', flex: 1, marginRight: 10 },
  itemQuantitySimple: { fontSize: 13, color: '#64748B', marginRight: 10 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  editButtonText: { fontSize: 13, color: '#3B82F6', fontWeight: '600', marginRight: 4 },

  // --- [펼쳤을 때 스타일] ---
  expandedView: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cardIndex: { fontSize: 13, fontWeight: 'bold', color: '#3B82F6' },
  headerActions: { flexDirection: 'row' },
  iconBtn: { marginLeft: 12 },
  
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: '700' },
  input: { backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 8, fontSize: 14, color: '#1E293B' },
  readonlyInput: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
  closeExpandedBtn: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  closeExpandedBtnText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  
  bottomFixedArea: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10, backgroundColor: '#F8FAFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  saveButton: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});

export default OCRConfirmScreen;