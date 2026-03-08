import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
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
import { isExpoGo } from './src/utils/platform';
import './src/utils/adminHelpers'; // Load admin helpers

// Cap OS font scaling at 15% growth across the entire app.
// Allows accessibility font settings to have a visible effect without
// exploding card layouts. Applies globally — no per-component changes needed.
// (allowFontScaling={false} was rejected: ignores accessibility entirely)
const MAX_FONT_SCALE = 1.15;
(Text as any).defaultProps = { ...(Text as any).defaultProps, maxFontSizeMultiplier: MAX_FONT_SCALE };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, maxFontSizeMultiplier: MAX_FONT_SCALE };

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    console.log('🚀 APP STARTING - VERSION WITH JOIN ROOM CARD FEATURE');
    console.log('📱 Running in Expo Go:', isExpoGo());
    
    // Make navigation ref available globally for push notifications
    (global as any).navigationRef = navigationRef;
    
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
        
        // Configure Google Sign-In (skip on Expo Go - not supported)
        if (!isExpoGo()) {
          configureGoogleSignIn();
          console.log('✅ Google Sign-In configured (native build)');
        } else {
          console.log('⏭️ Skipping Google Sign-In configuration (Expo Go)');
        }
        
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
