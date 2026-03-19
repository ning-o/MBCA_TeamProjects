// src/screens/MainHome.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../common/components/Header'; // 사용 안 할 거면 지우셔도 됩니다
import Footer from '../common/components/Footer'; // 사용 안 할 거면 지우셔도 됩니다

function MainHome({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <Header/>
      <View style={styles.container}>
        <Text style={styles.text}>여기가 앱 공통 메인 홈입니다.</Text>
        <Text>메인 홈 화면은 여기서 작업하세요</Text>
      </View>
      <Footer/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' }
});

export default MainHome;