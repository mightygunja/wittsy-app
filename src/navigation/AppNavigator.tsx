import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Loading } from '../components/common/Loading';
import { deepLinking } from '../services/deepLinking';

interface AppNavigatorProps {
  navigationRef?: any;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ navigationRef }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Initialize deep linking when navigation is ready
    if (navigationRef?.current) {
      deepLinking.initialize(navigationRef);
    }
  }, [navigationRef]);

  useEffect(() => {
    // Handle pending deep link after user authentication
    if (user && navigationRef?.current) {
      console.log('👤 User authenticated, checking for pending deep link');
      console.log('👤 User ID:', user.uid);
      console.log('👤 Navigation ref available:', !!navigationRef?.current);
      console.log('👤 Navigation state:', navigationRef?.current?.getRootState());
      
      // Handle pending deep link immediately - no delay needed
      deepLinking.handlePendingDeepLink(navigationRef);
      
      // Also re-initialize to catch any new deep links
      deepLinking.initialize(navigationRef);
    } else {
      console.log('⏸️ Not handling pending deep link - user:', !!user, 'navRef:', !!navigationRef?.current);
    }
  }, [user, navigationRef]);

  if (loading) {
    return <Loading />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
