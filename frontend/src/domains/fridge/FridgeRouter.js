// [냉장고 관리 도메인 관련 페이지] 라우터 관리 파일
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FridgeMain from './FridgeMain';
import RefDetail from './RefDetail';
import RecipeScreen from './Recipe';
import OCRConfirmScreen from './OCRConfirmScreen';
// import RecipeList from './RecipeList';
import CustomCameraScreen from './FridgeComponents/CustomCameraScreen';
import SeasonalRecommendFood from './SeasonalRecommendFood';
const Stack = createStackNavigator();

const FridgeRouter = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FridgeMain" component={FridgeMain} />
      {/* 여기에 만든 화면 추가 */}
      <Stack.Screen name="RefDetail" component={RefDetail} />
      <Stack.Screen name="Recipe" component={RecipeScreen} />
      <Stack.Screen name="OCRConfirm" component={OCRConfirmScreen} />
      <Stack.Screen name="CustomCamera" component={CustomCameraScreen} />
      <Stack.Screen name="SeasonalRecommendFood" component={SeasonalRecommendFood}/>
    </Stack.Navigator>
  );
};

export default FridgeRouter; 