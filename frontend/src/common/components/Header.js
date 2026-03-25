import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native'; 
import { useNavigation } from '@react-navigation/native';

const Header = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // ★ 현재 뒤로 갈 페이지가 있는지 체크 (있으면 true, 메인 홈이면 false)
  const canGoBack = navigation.canGoBack();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        
        {/* 왼쪽: 뒤로가기 버튼 영역 */}
        <View style={styles.sideButton}>
          {canGoBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color="#333" />
            </TouchableOpacity>
          ) : (
            /* ★ 메인 홈에서는 아무것도 렌더링하지 않음 (공간만 차지) */
            null
          )}
        </View>

        {/* 중앙: 로고 (언제나 정중앙 유지) */}
        <Text style={styles.brandText}>TIKKLE</Text>

        {/* 오른쪽: 알림 버튼 영역 (필요 없으면 여기도 null 처리 가능) */}
        <View style={styles.sideButton}>
          {/* 현재는 비워둠 */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // 좌-중-우 균형 유지
    paddingHorizontal: 16,
  },
  brandText: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#3B82F6',
    textAlign: 'center', // 텍스트 중앙 정렬
  },
  sideButton: { 
    width: 40, // ★ 중요: 왼쪽과 오른쪽의 너비를 똑같이 맞춰야 로고가 중앙에 옵니다.
    alignItems: 'center', 
    justifyContent: 'center' 
  }
});

export default Header;