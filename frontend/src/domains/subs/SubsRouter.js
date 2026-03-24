// [구독 관리 도메인 관련 페이지] 라우터 관리 파일


import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SubsMain from './SubsMain';
import SubScreenSearch from './SubScreenSearch';


const Tab = createMaterialTopTabNavigator();

const SubsRouter = () => {
  return (
      <Tab.Navigator
        initialRouteName="Main"
        screenOptions={{
          // tabBarShowLabel: false, // 상단 탭 바 글자를 숨기고 싶을 때
          // tabBarStyle: { height: 0 }, // 상단 탭 바 자체를 숨겨서 완전한 페이지 전환 느낌을 줄 때
          swipeEnabled: true, // 옆으로 밀어서 넘기기 활성화 (기본값 true)
          animationEnabled: true, // 애니메이션 활성화
        }}
      >
        <Tab.Screen 
          name="Main" 
          component={SubsMain} 
        />
        <Tab.Screen 
          name="Search" 
          component={SubScreenSearch} 
        />
      </Tab.Navigator>
    );
};

export default SubsRouter;