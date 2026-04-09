import React, { useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SubsMain from './SubsMain';
import SubScreenSearch from './SubScreenSearch';

const Tab = createMaterialTopTabNavigator();

const SubsRouter = () => {
  const [searchRefreshKey, setSearchRefreshKey] = useState(0);
  const [mainRefreshKey, setMainRefreshKey] = useState(0);

  return (
    <Tab.Navigator
      initialRouteName="Main"
      screenOptions={{
        tabBarStyle: { height: 0 },
        swipeEnabled: true,
        animationEnabled: true,
      }}
    >
      <Tab.Screen name="Main">
        {(props) => (
          <SubsMain
            {...props}
            mainRefreshKey={mainRefreshKey}
            triggerSearchRefresh={() => setSearchRefreshKey(Date.now())}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Search">
        {(props) => (
          <SubScreenSearch
            {...props}
            searchRefreshKey={searchRefreshKey}
            triggerMainRefresh={() => setMainRefreshKey(Date.now())}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default SubsRouter;