// [구독 관리 도메인 관련 페이지] 라우터 관리 파일
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SubsMain from './SubsMain';

const Stack = createStackNavigator();

const SubsRouter = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SubsMain" component={SubsMain} />
      {/* 여기에 만든 화면 추가 */}
    </Stack.Navigator>
  );
};

export default SubsRouter;