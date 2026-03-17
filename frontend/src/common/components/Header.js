// [공용 헤더 컴포넌트]
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {/* 왼쪽: 뒤로가기 */}
        <TouchableOpacity style={styles.sideButton}>
          <Text style={styles.iconText}>{"<"}</Text>
        </TouchableOpacity>

        {/* 중앙: 로고 */}
        <Text style={styles.brandText}>TIKKLE</Text>

        {/* 오른쪽: 알림or설정 추후 필요하다면 추가할 수 있게 레이아웃만 잡아놓은 상태 */}
        <TouchableOpacity style={styles.sideButton}>
          {/* <Text style={styles.iconText}>{"🔔"}</Text> */}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', // 상단 고정
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brandText: { fontSize: 22, fontWeight: '900', color: '#35A2E3' },
  iconText: { fontSize: 20, color: '#333' },
  sideButton: { width: 40, alignItems: 'center' }
});

export default Header;