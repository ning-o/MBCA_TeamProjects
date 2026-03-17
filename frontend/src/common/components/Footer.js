import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Wallet, Refrigerator, User } from 'lucide-react-native';

const BRAND = {
  DEEP: '#033169',
  MAIN: '#0665B8',
  BRIGHT: '#35A2E3',
  LIGHT: '#F0F7FF',
  INACTIVE: '#94A3B8',
};

const Footer = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('home');

  const getTabStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      circleStyle: [
        styles.iconCircle,
        isActive && styles.activeCircle,
        isActive && styles.activeShadow
      ],
      iconColor: isActive ? BRAND.MAIN : BRAND.INACTIVE,
      strokeWidth: isActive ? 2.5 : 2
    };
  };

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20, height: insets.bottom > 0 ? 85 + insets.bottom : 85 }]}>
      
      {/* 1번 영역: 홈 - 공통 */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => setActiveTab('home')}
      >
        <View style={getTabStyle('home').circleStyle}>
          <Home size={24} color={getTabStyle('home').iconColor} strokeWidth={getTabStyle('home').strokeWidth} />
        </View>
      </TouchableOpacity>

      {/* 2번 영역: 구독 관리 */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => setActiveTab('wallet')}
      >
        <View style={getTabStyle('wallet').circleStyle}>
          <Wallet size={24} color={getTabStyle('wallet').iconColor} strokeWidth={getTabStyle('wallet').strokeWidth} />
        </View>
      </TouchableOpacity>

      {/* 3번 영역: 냉장고 관리 */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => setActiveTab('fridge')}
      >
        <View style={getTabStyle('fridge').circleStyle}>
          <Refrigerator size={24} color={getTabStyle('fridge').iconColor} strokeWidth={getTabStyle('fridge').strokeWidth} />
        </View>
      </TouchableOpacity>

      {/* 4번 영역: 마이페이지 */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => setActiveTab('user')}
      >
        <View style={getTabStyle('user').circleStyle}>
          <User size={24} color={getTabStyle('user').iconColor} strokeWidth={getTabStyle('user').strokeWidth} />
        </View>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute', // 바닥 고정
    bottom: 0, 
    left: 0, 
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    zIndex: 1000,
    elevation: 20,
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -3 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 5 
      },
    }),
  },
  menuButton: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 10 
  },
  iconCircle: { 
    width: 54, 
    height: 54, 
    borderRadius: 27, 
    backgroundColor: 'transparent', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  activeCircle: { 
    backgroundColor: BRAND.LIGHT 
  },
  activeShadow: {
    ...Platform.select({
      ios: { 
        shadowColor: BRAND.DEEP, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 6 
      },
      android: { 
        elevation: 6 
      },
    }),
  },
});

export default Footer;