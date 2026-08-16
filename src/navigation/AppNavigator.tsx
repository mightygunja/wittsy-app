import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Loading } from '../components/common/Loading';
import { ForceUpdateScreen } from '../components/common/ForceUpdateScreen';
import { deepLinking } from '../services/deepLinking';
import { useForceUpdate } from '../hooks/useForceUpdate';
import { analytics } from '../services/analytics';

/**
 * Web URL routing. Every screen gets a real path, so the browser URL always
 * reflects where you are and browser back/forward navigate the app instead
 * of leaving the site.
 *
 * /game/* and /group/* are deliberately ABSENT: those links must run the
 * join flow (deepLinking service) before navigating, so React Navigation
 * must not route them directly. Unmatched paths fall back to Home/Welcome,
 * and the deepLinking service picks the link up from there.
 */
const webLinking: LinkingOptions<{}> | undefined =
  Platform.OS === 'web'
    ? {
        prefixes: [],
        config: {
          // Deep URL entries (e.g. loading /starred directly) get Home placed
          // beneath them in the stack, so the header back button always exists.
          initialRouteName: 'Home' as never,
          screens: {
            // Auth stack
            Welcome: 'welcome',
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
            // Main stack
            Home: '',
            CreateRoom: 'create-room',
            BrowseRooms: 'browse',
            Leaderboard: 'leaderboard',
            StarredPhrases: 'starred',
            Profile: 'profile',
            EnhancedSettings: 'settings',
            Groups: 'groups',
            CreateGroup: 'groups/new',
            Friends: 'friends',
            Notifications: 'notifications',
            Challenges: 'challenges',
            Events: 'events',
            AvatarCreator: 'avatar',
            AvatarShop: 'avatar-shop',
            CoinShop: 'shop',
            BattlePass: 'battle-pass',
            PromptLibrary: 'prompts',
            SubmitPrompt: 'prompts/submit',
            QuickPlay: 'quick-play',
            Referral: 'invite',
          },
        },
      }
    : undefined;

interface AppNavigatorProps {
  navigationRef?: any;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ navigationRef }) => {
  const { user, loading } = useAuth();
  const { checking: checkingUpdate, updateRequired, minimumVersion, storeUrl } = useForceUpdate();

  const onNavigationReady = () => {
    deepLinking.initialize(navigationRef);
  };

  useEffect(() => {
    // Handle pending non-GameRoom deep links after user authentication.
    // GameRoom pending links are handled automatically by deepLinking.addListener()
    // the moment HomeScreen registers its listener, so no extra work needed here.
    if (user && navigationRef?.current) {
      console.log('👤 User authenticated, checking for pending deep link');
      deepLinking.handlePendingDeepLink(navigationRef);
      // NOTE: Do NOT call deepLinking.initialize() again here — it was already called
      // when navigationRef became ready. A second call adds duplicate event listeners
      // and re-processes getInitialURL(), causing double join attempts.
    }
  }, [user, navigationRef]);

  if (loading || checkingUpdate) {
    return <Loading />;
  }

  if (updateRequired) {
    return <ForceUpdateScreen minimumVersion={minimumVersion} storeUrl={storeUrl} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onNavigationReady}
      linking={webLinking}
      documentTitle={{
        formatter: (options, route) =>
          `${options?.title ?? route?.name ?? 'Wittz'} · Wittz`,
      }}
      onStateChange={() => {
        const routeName = navigationRef?.current?.getCurrentRoute()?.name;
        if (routeName) analytics.trackScreen(routeName);
      }}
    >
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
