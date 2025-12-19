import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { BrowseRoomsScreen } from '../screens/BrowseRoomsScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import GameRoomScreen from '../screens/GameRoomScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6C63FF'
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BrowseRooms" 
        component={BrowseRoomsScreen}
        options={{ title: 'Browse Rooms' }}
      />
      <Stack.Screen 
        name="CreateRoom" 
        component={CreateRoomScreen}
        options={{ title: 'Create Room' }}
      />
      <Stack.Screen 
        name="GameRoom" 
        component={GameRoomScreen}
        options={{ title: 'Game Room' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};
