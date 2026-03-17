// src/common/components/Footer.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Wallet, Refrigerator, User } from 'lucide-react-native';

const Footer = () => {
  const insets = useSafeAreaInsets();

  return (
    // position: 'absolute'를 주어 화면 어디서든 바닥에 고정 됨
    <View style={[
      styles.footer, 
      { 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 20, // 노치 유무에 따른 하단 여백
        height: insets.bottom > 0 ? 85 + insets.bottom : 85   // 전체 높이 최적화
      }
    ]}>
      
      <TouchableOpacity style={styles.menuButton}>
        <View style={[styles.iconCircle, styles.activeCircle]}>
          <Home size={24} color="#3B82F6" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.iconCircle}>
          <Wallet size={24} color="#94A3B8" strokeWidth={2} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.iconCircle}>
          <Refrigerator size={24} color="#94A3B8" strokeWidth={2} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.iconCircle}>
          <User size={24} color="#94A3B8" strokeWidth={2} />
        </View>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute', // 화면 하단에 고정
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    zIndex: 1000,
    // 그림자 효과
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  menuButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10, // 아이콘을 살짝 위로 정렬
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent', // 평소엔 투명하게
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCircle: {
    backgroundColor: '#EBF2FF', // 활성화된 버튼만 블루 배경
  },
});

export default Footer;