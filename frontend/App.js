import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';

// import SampleScreen from './src/domains/SampleScreen';
import FridgeRouter from './src/domains/fridge/FridgeRouter';
import SubsRouter from './src/domains/subs/SubsRouter';
import AuthRouter from './src/domains/auth/AuthRouter';
import MainHome from './src/domains/MainHome';
import Login from './src/domains/auth/LoginScreen';
import SignUp from './src/domains/auth/SignUpScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Home" component={MainHome} />
          <Stack.Screen name="Auth" component={AuthRouter} />
          <Stack.Screen name="Fridge" component={FridgeRouter} />
          <Stack.Screen name="Subs" component={SubsRouter} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}