import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SampleScreen from './src/domains/SampleScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SampleScreen />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}