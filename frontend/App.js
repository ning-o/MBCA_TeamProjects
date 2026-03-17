import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';

import SampleScreen from './src/domains/SampleScreen';
import FridgeRouter from './src/domains/fridge/FridgeRouter';
import SubsRouter from './src/domains/subs/SubsRouter';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          {/* 메인 홈(현재 샘플로 대체) */}
          <Stack.Screen name="Home" component={SampleScreen} />
          
          {/* 냉장고 도메인 */}
          <Stack.Screen name="Fridge" component={FridgeRouter} />
          
          {/* 구독 도메인 */}
          <Stack.Screen name="Subs" component={SubsRouter} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}