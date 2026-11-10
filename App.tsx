import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, Platform, View } from 'react-native';
import { installWebAlert } from './src/utils/webAlert';
import { WebNavBar } from './src/components/web/WebNavBar';
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

// Cap OS font scaling at 30% growth.
// iOS "Larger Text" has 7 steps — the top ~3 steps (used by ~10% of users)
// cause layout overflow. Capping at 1.3 covers the 90% who use Large or below
// while still honouring their accessibility preference.
const MAX_FONT_SCALE = 1.3;
(Text as any).defaultProps = { ...(Text as any).defaultProps, maxFontSizeMultiplier: MAX_FONT_SCALE };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, maxFontSizeMultiplier: MAX_FONT_SCALE };

// react-native-web's Alert is a no-op — replace it so dialogs actually show.
installWebAlert();

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    console.log('🚀 APP STARTING - VERSION WITH JOIN ROOM CARD FEATURE');
    console.log('📱 Running in Expo Go:', isExpoGo());
    
    // Make navigation ref available globally for push notifications
    (global as any).navigationRef = navigationRef;
    
    // Initialize all services.
    //
    // Telemetry starts FIRST, before any await. It used to sit behind
    // audioService.initialize() and playBackgroundMusic(), which load eight
    // audio assets: if either threw or simply hung on a slow cold start, the
    // shared catch swallowed it and analytics.startSession() never ran, so
    // that session reported nothing at all — no sign-up, no screens, no
    // games. That was roughly half of all users.
    const initializeServices = async () => {
      try {
        errorTracking.initialize();
        analytics.setEnabled(true);
        analytics.startSession();
      } catch (error) {
        console.error('Failed to start analytics:', error);
      }

      // Each service is independent: one failing or hanging must not skip
      // the ones after it. The timeout does not cancel the work, it just
      // stops a stuck service from holding up the rest of startup.
      const step = async (name: string, run: () => Promise<unknown> | unknown, timeoutMs = 10000) => {
        try {
          await Promise.race([
            Promise.resolve(run()),
            new Promise((_resolve, reject) =>
              setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs)
            ),
          ]);
        } catch (error) {
          console.error(`Failed to initialize ${name}:`, error);
          errorTracking.logError(error as Error, { context: `App initialization: ${name}` });
        }
      };

      await step('audio', async () => {
        await audioService.initialize();
        // Skipped on web: browsers block audio before the first user gesture,
        // so autoplay here only produces console errors.
        if (Platform.OS !== 'web') {
          await audioService.playBackgroundMusic();
        }
      });

      // Web has no IAP — purchases live in the native apps.
      if (Platform.OS !== 'web') {
        await step('monetization', () => monetization.initialize());
      }

      await step('A/B testing', () => abTesting.initialize());

      await step('Google Sign-In', () => {
        // Not supported in Expo Go
        if (!isExpoGo()) {
          configureGoogleSignIn();
          console.log('✅ Google Sign-In configured (native build)');
        } else {
          console.log('⏭️ Skipping Google Sign-In configuration (Expo Go)');
        }
      });

      // Battle Pass and other auth-dependent services initialize in AuthContext
      await step('push notifications', () => notifications.initialize());

      console.log('All services initialized');
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
          <View style={{ flex: 1 }}>
            {/* Desktop-web top navigation; renders null on native/mobile web */}
            <WebNavBar navigationRef={navigationRef} />
            <View style={{ flex: 1 }}>
              <AppNavigator navigationRef={navigationRef} />
            </View>
          </View>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
