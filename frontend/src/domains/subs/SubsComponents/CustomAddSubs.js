
import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const CustomAddSubs = ({ visible, onClose, onSubmit }) => {

  const [image, setImage] = useState(null);
  const [inputname, setinputname] = useState('');
  const [inputprice, setinputprice] = useState('');
  const [category, setCategory] = useState('카테고리 선택'); 
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const categories = ['OTT', '음악', '도서/교육', '쇼핑', '생활/편의', '기타'];

  // 숫자에 콤마 추가
  const formatPrice = (value) => {
    const onlyNums = value.replace(/[^0-9]/g, '');
    const formatted = onlyNums.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
    setinputprice(formatted);
  };  

  const handleConfirm = () => {
    if (inputname.trim() && inputprice.trim() && category !== '카테고리 선택') {
      // 콤마를 제거한 '숫자' 형태로 변환
      const numericPrice = inputprice.replace(/,/g, '');
      
      onSubmit({ 
        name: inputname, 
        price: numericPrice, 
        logo: image,
        category: category,
      });
      
      setinputname('');
      setCategory('카테고리 선택');
      setinputprice('');
      setImage(null);
      onClose();

    } else {
      alert('이름과 요금을 모두 입력해주세요.');
    }
  };

  // 로고 이미지 설정
  const pickImage = async () => {
    // 갤러리 접근 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('갤러리 접근 권한이 필요합니다!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // 사진 편집(자르기 등) 허용
      aspect: [1, 1],      // 1:1 비율
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); // 선택된 이미지 URI 저장
    }
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* 배경 클릭 시 닫히도록 Pressable 추가 */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>직접 입력 추가</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>취소</Text>
            </TouchableOpacity>
          </View>

          {/* 로고 사전 설정 */}
          <View style={styles.imageSection}>
            <View style={styles.previewContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagedefualt}>
                    <Text>{inputname ? inputname.slice(0, 4) : ''}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text>로고 선택</Text>
            </TouchableOpacity>            
          </View>

          <View style={styles.namebox}>
            <Text style={{marginBottom:8}}>구독 서비스 이름</Text>
            <TextInput
            style={styles.modalInput}
            placeholder="구독 서비스 이름을 입력하세요"
            value={inputname}
            onChangeText={setinputname}
            autoFocus={true} // 모달 열리자마자 키보드 활성화
          />            
          </View>

          <View style={styles.pricebox}>
            <Text style={{marginBottom:8}}>요금제 금액</Text>
            <TextInput
            style={styles.modalInput}
            placeholder="0"
            value={inputprice}
            onChangeText={formatPrice}
            keyboardType="number-pad"
            autoFocus={true} // 모달 열리자마자 키보드 활성화
            />            
          </View>

          {/* 카테고리 선택 (추가된 부분) */}
          <View style={styles.categoryBox}>
            <Text style={styles.label}>카테고리</Text>
            <TouchableOpacity 
              style={styles.dropdownSelector} 
              onPress={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <Text style={{ color: category === '카테고리 선택' ? '#999' : '#000' }}>
                {category}
              </Text>
              <Text style={{ fontSize: 12 }}>{isCategoryOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isCategoryOpen && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled={true}>
                  {categories.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategory(item);
                        setIsCategoryOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          

          <TouchableOpacity style={styles.submitButton} onPress={handleConfirm}>
            <Text style={styles.submitButtonText}>확인</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '90%', // 원하는 높이만큼 조절
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeText: {
    color: '#555555',
    fontSize: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  imageSection: {
    flexDirection:'row',
    marginBottom:10,
    paddingBottom:10,
    borderBottomWidth:1,
  },

  previewContainer: {
    margin:5,
    gap: 15,
    width:50,
    height:50,
  },

  previewImage: {
    width: 50,      // 부모 컨테이너(previewContainer) 크기에 맞게 조절
    height: 50,
    borderRadius: 25, // 원형으로 만들고 싶을 경우
    resizeMode: 'cover',
  },

  imagePickerButton: {
    paddingHorizontal:5,
    height:30,    
    margin: 5,
    marginLeft:15,
    borderRadius: 8,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop:'auto',
    backgroundColor: '#E1E1E1',

  },

  imagedefualt: {
    margin:3,
    width:30,
    height:30,
    backgroundColor:'#ddd',
    borderRadius: 100 / 2,
  },

  namebox: {
    marginBottom:8,
    borderBottomWidth:1,
  },

  pricebox: {
    marginBottom:8,
    borderBottomWidth:1,
  },

  // 카테고리 스타일
  categoryBox: {
    marginBottom: 20,
    zIndex: 1000, // 드롭다운이 다른 요소 위로 올라오게 설정
  },

  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },

  dropdownList: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    backgroundColor: 'white',
    maxHeight: 150, // 리스트 최대 높이
    // 그림자 효과 (iOS/Android)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  
  dropdownItemText: {
    fontSize: 14,
  },

});

export default CustomAddSubs;