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

  if (loading) {
    return <Loading />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
