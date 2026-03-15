// [공용] 헤더 - 브랜드 로고 및 텍스트 고정 레이아웃
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => { 
  return (
    <View style={styles.header}>
      {/* 왼쪽: 브랜드 텍스트 로고 */}
      <Text style={styles.brandText}>TIKKLE(헤더 영역)</Text>

    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 120,              // 헤더 높이
    width: '100%',
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',  // 글자를 헤더 박스의 '바닥' 쪽으로 붙이기.
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,       // 바닥에서 살짝 띄우기.
    borderBottomWidth: 1,
    borderBottomColor: '#eee',

  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',       
    letterSpacing: 1.5,
  },

});

export default Header;