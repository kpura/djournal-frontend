import 'react-native-get-random-values';
import * as React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons} from '@expo/vector-icons';

import GetStarted from './src/screens/GetStarted';
import AuthOptions from './src/screens/AuthOptions';
import HomePage from './src/screens/HomePage';
import MyJournal from './src/screens/MyJournal';
import MyEntry from './src/screens/MyEntry';
import Map from './src/screens/Map';
import Settings from './src/screens/Settings';
import AddJournal from './src/components/AddJournal';
import Logo from './src/screens/Logo';
import Notifications from './src/screens/Notifications';
import PlaceDetail from './src/components/PlaceDetail';
import FullEntryView from  './src/components/FullEntryView';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
            <Octicons name={iconName} size={iconSize} color={focused ? '#525fe1' : color} />
          );
        },
        tabBarLabel: ({ focused }) => (
          focused ? <Text style={{ fontSize: 12, color: '#525fe1', fontFamily: 'Poppins_400Regular' }}>{route.name}</Text> : null
        ),
        tabBarInactiveTintColor: '#000',
        tabBarStyle: {
          display: 'flex',
          borderTopWidth: 0.5,
          borderTopColor: '#E3E3E3',
          height: 80,
          paddingBottom: 5,
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
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Logo">
        <Stack.Screen name="Logo" component={Logo} options={{ headerShown: false }} />
        <Stack.Screen 
          name="GetStarted"
          component={GetStarted} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AuthOptions" component={AuthOptions} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MyJournal" component={MyJournal} />
        <Stack.Screen name="MyEntry" component={MyEntry} options={{ headerShown: false }} />
        <Stack.Screen name="AddJournal" component={AddJournal} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetail} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={Map} options={{ headerShown: false }} />
        <Stack.Screen name="FullEntryView" component={FullEntryView} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
