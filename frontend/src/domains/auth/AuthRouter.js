import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import MonthlyExpenseStats from './MonthlyExpenseStats';

const Stack = createStackNavigator();

const AuthRouter = () => (
  <Stack.Navigator initialRouteName="MonthlyExpense" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="MonthlyExpense" component={MonthlyExpenseStats} />
  </Stack.Navigator>
);

export default AuthRouter;