// [냉장고 관리 도메인 관련 페이지] 라우터 관리 파일
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FridgeMain from './FridgeMain';


const Stack = createStackNavigator();

const FridgeRouter = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FridgeMain" component={FridgeMain} />
      {/* 여기에 만든 화면 추가 */}
    </Stack.Navigator>
  );
};

export default FridgeRouter;