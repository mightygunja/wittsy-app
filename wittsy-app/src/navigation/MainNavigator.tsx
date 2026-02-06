import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { BrowseRoomsScreen } from '../screens/BrowseRoomsScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import GameRoomScreen from '../screens/GameRoomScreen';
import { EnhancedProfileScreen } from '../screens/EnhancedProfileScreen';
import { EnhancedLeaderboardScreen } from '../screens/EnhancedLeaderboardScreen';
import { AdminConsoleScreen } from '../screens/AdminConsoleScreen';
import { PromptLibraryScreen } from '../screens/PromptLibraryScreen';
import { SubmitPromptScreen } from '../screens/SubmitPromptScreen';
import { PromptApprovalScreen } from '../screens/PromptApprovalScreen';
import { QuickPlayScreen } from '../screens/QuickPlayScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { EnhancedSettingsScreen } from '../screens/EnhancedSettingsScreen';
import { ThemeSettingsScreen } from '../screens/settings/ThemeSettingsScreen';
import { AudioSettingsScreen } from '../screens/settings/AudioSettingsScreen';
import { GameplaySettingsScreen } from '../screens/settings/GameplaySettingsScreen';
import { LanguageSettingsScreen } from '../screens/settings/LanguageSettingsScreen';
import { AccessibilitySettingsScreen } from '../screens/settings/AccessibilitySettingsScreen';
import { PrivacySettingsScreen } from '../screens/settings/PrivacySettingsScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import { ProfileEditScreen } from '../screens/settings/ProfileEditScreen';
import { FeedbackScreen } from '../screens/settings/FeedbackScreen';
import { AdminFeedbackScreen } from '../screens/settings/AdminFeedbackScreen';
import { AvatarCreatorScreenV2 as AvatarCreatorScreen } from '../screens/AvatarCreatorScreenV2';
import { AvatarShopScreen } from '../screens/AvatarShopScreen';
import { CoinShopScreen } from '../screens/CoinShopScreen';
import { AnalyticsDashboardScreen } from '../screens/AnalyticsDashboardScreen';
import { BattlePassScreen } from '../screens/BattlePassScreen';
import { AdminEventsScreen } from '../screens/AdminEventsScreen';
import { StarredPhrasesScreen } from '../screens/StarredPhrasesScreen';
import { ReferralScreen } from '../screens/ReferralScreen';

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
        component={EnhancedProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={EnhancedLeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen 
        name="AdminConsole" 
        component={AdminConsoleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PromptLibrary" 
        component={PromptLibraryScreen}
        options={{ title: 'Prompt Library' }}
      />
      <Stack.Screen 
        name="SubmitPrompt" 
        component={SubmitPromptScreen}
        options={{ title: 'Submit Prompt' }}
      />
      <Stack.Screen 
        name="PromptApproval" 
        component={PromptApprovalScreen}
        options={{ title: 'Approve Prompts' }}
      />
      <Stack.Screen 
        name="QuickPlay" 
        component={QuickPlayScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen 
        name="Challenges" 
        component={ChallengesScreen}
        options={{ title: 'Challenges' }}
      />
      <Stack.Screen 
        name="Events" 
        component={EventsScreen}
        options={{ title: 'Events' }}
      />
      <Stack.Screen 
        name="EnhancedSettings" 
        component={EnhancedSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="ThemeSettings" 
        component={ThemeSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AudioSettings" 
        component={AudioSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GameplaySettings" 
        component={GameplaySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LanguageSettings" 
        component={LanguageSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AccessibilitySettings" 
        component={AccessibilitySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={PrivacySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AdminFeedback" 
        component={AdminFeedbackScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AvatarCreator" 
        component={AvatarCreatorScreen}
        options={{ title: 'Avatar Creator' }}
      />
      <Stack.Screen 
        name="AvatarShop" 
        component={AvatarShopScreen}
        options={{ title: 'Avatar Shop' }}
      />
      <Stack.Screen 
        name="CoinShop" 
        component={CoinShopScreen}
        options={{ title: 'Coin Shop' }}
      />
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsDashboardScreen}
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen 
        name="BattlePass" 
        component={BattlePassScreen}
        options={{ title: 'Battle Pass' }}
      />
      <Stack.Screen 
        name="AdminEvents" 
        component={AdminEventsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StarredPhrases" 
        component={StarredPhrasesScreen}
        options={{ title: 'Starred Phrases' }}
      />
      <Stack.Screen 
        name="Referral" 
        component={ReferralScreen}
        options={{ title: 'Invite Friends' }}
      />
    </Stack.Navigator>
  );
};
