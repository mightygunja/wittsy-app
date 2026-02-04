import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ThemeProvider } from './src/contexts/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { notifications } from './src/services/notifications';
import { errorTracking } from './src/services/errorTracking';
import { analytics } from './src/services/analytics';
import { monetization } from './src/services/monetization';
import { abTesting } from './src/services/abTesting';
import { audioService } from './src/services/audioService';
import { configureGoogleSignIn } from './src/services/auth';
import './src/utils/adminHelpers'; // Load admin helpers

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Initialize all services
    const initializeServices = async () => {
      try {
        // Initialize error tracking first
        errorTracking.initialize();
        
        // Initialize audio service
        await audioService.initialize();
        
        // Start background music
        await audioService.playBackgroundMusic();
        
        // Initialize analytics
        analytics.setEnabled(true);
        
        // Initialize monetization
        await monetization.initialize();
        
        // Initialize A/B testing
        await abTesting.initialize();
        
        // Configure Google Sign-In
        configureGoogleSignIn();
        
        // Note: Battle Pass, seeding, and other auth-dependent services 
        // will initialize after user authentication in AuthContext
        
        // Initialize push notifications
        await notifications.initialize();
        
        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
        errorTracking.logError(error as Error, { context: 'App initialization' });
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      notifications.cleanup();
      audioService.cleanup();
    };
  }, []);

  return (
    <SettingsProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator navigationRef={navigationRef} />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
