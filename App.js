import 'react-native-get-random-values';
import * as React from 'react';
//import { useEffect } from 'react';
//import { setupDatabase } from './src/api/database';
//import NetInfo from "@react-native-community/netinfo";
//import { syncOfflineData } from "./src/api/database";
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';

import GetStarted from './src/screens/GetStarted';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomePage from './src/screens/HomePage';
import MyJournal from './src/screens/MyJournal';
import MyEntry from './src/screens/MyEntry';
import Map from './src/screens/Map';
import Settings from './src/screens/Settings';
import AddJournal from './src/components/AddJournal';
import Logo from './src/screens/Logo';
import DataVisualization from './src/screens/DataVisualization';
import PlaceDetail from './src/components/PlaceDetail';
import FullEntryView from './src/components/FullEntryView';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
  cardStyle: { backgroundColor: 'transparent' },
  headerStyleInterpolator: CardStyleInterpolators.forFade,
};

// Custom transition for modal screens
const modalScreenOptions = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          let iconSize = focused ? 30 : 24;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Journal') {
            iconName = 'book';
          } else if (route.name === 'Maps') {
            iconName = 'location';
          } else if (route.name === 'Settings') {
            iconName = 'gear';
          }

          return (
            <Octicons name={iconName} size={iconSize} color={focused ? '#13547D' : color} />
          );
        },
        tabBarLabel: ({ focused }) => (
          focused ? <Text style={{ fontSize: 12, color: '#13547D', fontFamily: 'Poppins_600SemiBold' }}>{route.name}</Text> : null
        ),
        tabBarInactiveTintColor: '#237CA2',
        tabBarStyle: {
          display: 'flex',
          borderTopWidth: 0.5,
          borderTopColor: '#E3E3E3',
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomePage} options={{ headerShown: false }} />
      <Tab.Screen name="Journal" component={MyJournal} options={{ headerShown: false }} />
      <Tab.Screen name="Maps" component={Map} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function App() {
  //useEffect(() => {
    //setupDatabase();
  //}, []);

  //useEffect(() => {
    //const unsubscribe = NetInfo.addEventListener(state => {
      //if (state.isConnected) {
        //syncOfflineData();
      //}
    //});

    //return () => unsubscribe();
  //}, []);
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Logo"
        screenOptions={screenOptions}
      >
        <Stack.Screen name="Logo" component={Logo} options={{ headerShown: false }} />
        <Stack.Screen 
          name="GetStarted"
          component={GetStarted} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MyJournal" component={MyJournal} />
        <Stack.Screen name="MyEntry" component={MyEntry} options={{ headerShown: false }} />
        <Stack.Screen 
          name="AddJournal" 
          component={AddJournal}
          options={modalScreenOptions}
        />
        <Stack.Screen 
          name="DataVisualization" 
          component={DataVisualization} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PlaceDetail" 
          component={PlaceDetail} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="Map" component={Map} options={{ headerShown: false }} />
        <Stack.Screen 
          name="FullEntryView" 
          component={FullEntryView} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}