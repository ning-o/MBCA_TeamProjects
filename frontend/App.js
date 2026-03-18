import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';

// import SampleScreen from './src/domains/SampleScreen';
import FridgeRouter from './src/domains/fridge/FridgeRouter';
import SubsRouter from './src/domains/subs/SubsRouter';
import MainHome from './src/domains/MainHome';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={MainHome} />
          <Stack.Screen name="Fridge" component={FridgeRouter} />
          <Stack.Screen name="Subs" component={SubsRouter} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}