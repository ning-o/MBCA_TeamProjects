import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../../common/components/Header';

const OCRConfirmScreen = ({ route }) => {
  const navigation = useNavigation();
  
  const photoUri = route.params?.photoUri;
  const isManual = route.params?.isManual || false; 

  const [loading, setLoading] = useState(!isManual); 
  const [rawItemName, setRawItemName] = useState('');
  const [matchedIngredient, setMatchedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [afterPrice, setAfterPrice] = useState('');

  useEffect(() => {
    if (isManual) return;

    const fakeAnalysis = setTimeout(() => {
      setRawItemName('유기농 우유 1000ml (행사)');
      setMatchedIngredient('우유'); 
      setQuantity('1');
      setAfterPrice('3500');
      setLoading(false); 
    }, 2500);

    return () => clearTimeout(fakeAnalysis);
  }, [isManual]);

  const handleSave = () => {
    Alert.alert("저장 완료", `[${matchedIngredient || rawItemName}] ${quantity}개가 냉장고에 추가되었습니다!`);
    navigation.navigate('FridgeMain');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      {/* 1. 스크롤 영역 (버튼 제외한 내용물만 스크롤) */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.title}>{isManual ? "재료 직접 추가" : "영수증 분석 결과"}</Text>

        {!isManual && photoUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri }} style={styles.blurBackground} blurRadius={15} />
            <View style={styles.overlayLayer} />
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>AI가 영수증 항목을 추출하고 있습니다...</Text>
          </View>
        ) : (
          <View style={styles.resultBox}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isManual ? "품목명" : "영수증 원본 품목명"}</Text>
              <TextInput 
                style={[styles.input, !isManual && styles.readonlyInput]} 
                value={rawItemName} 
                onChangeText={setRawItemName} 
                placeholder={isManual ? "예: 서울우유 1L" : ""}
                editable={isManual} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>매칭된 냉장고 재료</Text>
              <TextInput 
                style={styles.input} 
                value={matchedIngredient} 
                onChangeText={setMatchedIngredient} 
                placeholder="예: 계란, 우유"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.label}>수량 (단위)</Text>
                <TextInput 
                  style={styles.input} 
                  value={quantity} 
                  onChangeText={setQuantity} 
                  placeholder="예: 1개, 500g"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.8 }]}>
                <Text style={styles.label}>가격 (원)</Text>
                <TextInput 
                  style={styles.input} 
                  value={afterPrice} 
                  onChangeText={setAfterPrice} 
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
            
          </View>
        )}
      </ScrollView>

      {/* 2. ★ 하단 고정 버튼 영역 (스크롤 밖으로 뺐습니다!) ★ */}
      {!loading && (
        <View style={styles.bottomFixedArea}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>냉장고에 넣기</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  // 스크롤이 끝까지 내려갔을 때 버튼에 가려지지 않게 여백을 줍니다.
  scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 20 }, 
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  
  imageContainer: { 
    width: '60%', height: 300, borderRadius: 15, overflow: 'hidden', elevation: 3, 
    marginBottom: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
  },
  blurBackground: { position: 'absolute', width: '100%', height: '100%', opacity: 0.8 },
  overlayLayer: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  previewImage: { width: '100%', height: '100%', zIndex: 1 },

  loadingBox: { marginTop: 40, alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748B', fontWeight: '500' },
  resultBox: { width: '100%' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, fontSize: 16, color: '#1E293B' },
  readonlyInput: { backgroundColor: '#F1F5F9', color: '#64748B' },
  
  // --- [하단 고정 버튼 영역 스타일] ---
  bottomFixedArea: {
    paddingHorizontal: 20,
    paddingBottom: 20, // 아이폰 하단 홈바 여백 등을 고려
    paddingTop: 10,
    backgroundColor: '#F8FAFF', // 배경색과 통일시켜서 자연스럽게
  },
  saveButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default OCRConfirmScreen;