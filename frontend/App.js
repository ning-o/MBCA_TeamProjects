// 우리 앱의 최상위 컴포넌트
// 모든 화면은 이 파일을 거쳐서 랜더링 되며, 화면 간의 이동 경로 정의

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native'; // Route 관리 라이브러리 현재 미사용
import { SafeAreaProvider } from 'react-native-safe-area-context'; // 기기별 노치 및 여백 정보를 앱 전체에 공급


// 만든 화면 불러오기
import SampleScreen from './src/domains/SampleScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <SampleScreen />
    </SafeAreaProvider>
  );
}
