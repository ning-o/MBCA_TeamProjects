/**
 * 프론트엔드 화면 구성 샘플 가이드
 * 헤더, 푸터 적용 방법 및 화면 설계(Layout) 표준 제시
 * App.js에서 이 파일을 import해야 폰으로 실시간 확인이 가능
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; 
// SafeAreaView: 폰의 "노치" (카메라 구멍, 하단 홈바 영역 등)을 자동으로 피해주는 라이브러리

// 공용 헤더 & 푸터 불러오기
import Header from '../common/components/Header';
import Footer from '../common/components/Footer';

const SampleScreen = () => {
  return (
    <View style={styles.container}>
      {/* [고정] 공용 헤더 사용 */}
      <Header/>

      {/* [FREE ZONE] 맘대로 코딩=============== */}
      <View style={styles.content}>
        {/* "Text" 태그문은 웹의 span,p,h1 같은 글자를 담는 태그문임 */}
        <Text style={styles.infoText}>프론트엔드 테스트 글입니다.</Text>

        {/* "View" 태그문은 웹의 div & section 같은 영역 태그문임 */}
        <View style={styles.box}>
          <Text>글이 보이면 정상입니다.</Text>
        </View>
      </View>
      {/* [FREE ZONE]========================= */}

      {/* [고정] 공용 푸터 사용 */}
      <Footer />
    </View>
  );
};

// 스타일 가이드 표준
const styles = StyleSheet.create({
  container: { 
    flex: 1, // 전체 화면 꽉 채우기
    backgroundColor: '#fff' 
  },
  content: { 
    flex: 1, // 헤더와 푸터 제외한 남은 모든 공간 차지
    paddingHorizontal: 20,
    paddingBottom: 100, // 푸터(absolute)에 가려짐 방지용 패딩
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
  },
  box: {
    width: '100%',
    height: 100,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SampleScreen;