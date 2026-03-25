import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Home, Wallet, Refrigerator as FridgeIcon, User } from 'lucide-react-native';

const Footer = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute(); // 1. 현재 화면의 이름을 실시간으로 파악합니다.

  // 2. 현재 화면이 버튼의 목적지와 같은지 확인하는 함수
  const isActive = (screenName) => route.name === screenName;

  return (
    <View style={[
      styles.footer, 
      { 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
        height: insets.bottom > 0 ? 85 + insets.bottom : 85 
      }
    ]}>
      
      {/* 홈 버튼 */}
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => navigation.navigate('Home')}
      >
        <View style={[styles.iconCircle, isActive('Home') && styles.activeCircle]}>
          <Home 
            size={24} 
            color={isActive('Home') ? "#3B82F6" : "#94A3B8"} 
            strokeWidth={isActive('Home') ? 2.5 : 2} 
          />
        </View>
      </TouchableOpacity>

      {/* 구독 관리 버튼 */}
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => navigation.navigate('Subs')}
      >
        <View style={[styles.iconCircle, isActive('Subs') && styles.activeCircle]}>
          <Wallet 
            size={24} 
            color={isActive('Subs') ? "#3B82F6" : "#94A3B8"} 
            strokeWidth={isActive('Subs') ? 2.5 : 2} 
          />
        </View>
      </TouchableOpacity>

      {/* 냉장고 관리 버튼*/}
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => navigation.navigate('Fridge')}
      >
        <View style={[styles.iconCircle, isActive('RefDetail') && styles.activeCircle]}>
          <FridgeIcon 
            size={24} 
            color={isActive('RefDetail') ? "#3B82F6" : "#94A3B8"} 
            strokeWidth={isActive('RefDetail') ? 2.5 : 2} 
          />
        </View>
      </TouchableOpacity>

      {/* 마이페이지 버튼 */}
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => navigation.navigate('Auth')}
        >
        <View style={[styles.iconCircle, isActive('User') && styles.activeCircle]}>
          <User 
            size={24} 
            color={isActive('User') ? "#3B82F6" : "#94A3B8"} 
            strokeWidth={isActive('User') ? 2.5 : 2} 
          />
        </View>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    zIndex: 1000,
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
    paddingTop: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCircle: {
    backgroundColor: '#EBF2FF', // 활성화된 버튼에만 들어가는 배경색
  },
});

export default Footer;