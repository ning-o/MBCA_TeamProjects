// [공용] 푸터 - 메뉴 버튼 레이아웃 표준
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Footer = () => {
  return (
    <View style={styles.footer}>
      {/* 각 메뉴를 클릭 가능한 버튼 영역으로 분리 */}
      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuText}>홈</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuText}>구독 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuText}>냉장고 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuText}>내정보</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    height: 100, // 높이를 살짝 키워 터치 영역 확보
    flexDirection: 'row', // 가로로 버튼 나열
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 20, // 아이폰 하단 바 영역 고려
  },
  menuButton: {
    flex: 1, // 4개 버튼이 똑같은 넓이를 가짐
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});

export default Footer;