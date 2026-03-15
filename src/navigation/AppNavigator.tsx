import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Loading } from '../components/common/Loading';
import { ForceUpdateScreen } from '../components/common/ForceUpdateScreen';
import { deepLinking } from '../services/deepLinking';
import { useForceUpdate } from '../hooks/useForceUpdate';

interface AppNavigatorProps {
  navigationRef?: any;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ navigationRef }) => {
  const { user, loading } = useAuth();
  const { checking: checkingUpdate, updateRequired, minimumVersion, storeUrl } = useForceUpdate();

  useEffect(() => {
    // Initialize deep linking when navigation is ready
    if (navigationRef?.current) {
      deepLinking.initialize(navigationRef);
    }
  }, [navigationRef]);

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
    <NavigationContainer ref={navigationRef}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
