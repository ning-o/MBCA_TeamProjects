// 구독 관리 도메인 메인 샘플페이지
import React from 'react';
import { View, Text } from 'react-native';
import Footer from '../../common/components/Footer';

const SubsMain = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>구독 도메인 연결 확인용 샘플</Text>
      <Footer />
    </View>
  );
};

export default SubsMain;