import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { User } from 'firebase/auth';
import * as authService from '../services/auth';
import * as guestAuth from '../services/guestAuth';
import { UserProfile } from '../types';
import { monetization } from '../services/monetization';
import { battlePass } from '../services/battlePassService';
import { analytics } from '../services/analytics';
import { friendlyAuthError } from '../utils/authErrors';
import { initializePushNotifications } from '../services/pushNotificationService.expo';
import { isExpoGo } from '../utils/platform';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setIsGuest(firebaseUser?.isAnonymous || false);

      if (firebaseUser) {
        // Attach analytics identity + device context to this user
        analytics.setUser(firebaseUser.uid);
        analytics.setUserProps({ is_guest: firebaseUser.isAnonymous === true });

        // Initialize RevenueCat with user ID
        await monetization.initialize(firebaseUser.uid);
        
        // Initialize Battle Pass (requires authentication)
        await battlePass.initialize();

        // Register this device for push notifications (native builds only —
        // web has no push channel and Expo Go lacks the module). Deliberately
        // not awaited: the OS permission prompt must not block sign-in.
        if (Platform.OS !== 'web' && !isExpoGo()) {
          initializePushNotifications(firebaseUser.uid).catch((pushError) =>
            console.error('Push notification init failed:', pushError)
          );
        }

        // NOTE: client-side seeding removed. Prompts are admin-only under the
        // rules (open create let anyone bypass the approval pipeline), and
        // challenges come from the scheduled Cloud Functions. Seeding a fresh
        // project is done from an admin account via the seed utils.

        // Create or fetch the user profile. A failure here used to fall back to
        // a temporary in-memory profile, which let people play in a phantom
        // account whose games, coins and purchases were never saved anywhere.
        try {
          const userDoc = await authService.getOrCreateUserProfile(firebaseUser);

          // Now that the profile exists, re-sync telemetry's device context: for
          // a brand-new account the sign-in-time merge above was rejected (no
          // profile doc yet). No-op when that earlier merge succeeded.
          analytics.setUser(firebaseUser.uid);
          setUserProfile(userDoc as any);
        } catch (profileError) {
          console.error('Failed to load or create the user profile:', profileError);
          setUserProfile(null);
          await authService.signOut().catch(() => {});
          Alert.alert(
            'Account Setup Failed',
            "We couldn't finish setting up your account. Please check your connection and sign in again."
          );
        }
      } else {
        setUserProfile(null);
        // Clear the purchase-credit target so a later sign-in with a
        // different account can never receive this user's purchases.
        monetization.setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign-in attempts must NOT toggle the global `loading` flag: AppNavigator
  // swaps the whole NavigationContainer for a full-screen <Loading /> while it
  // is true, which unmounts the auth screens and wipes their local state
  // (typed email, inline error messages). The screens show their own button
  // spinners, and the onAuthStateChange listener drives the success transition.
  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    await authService.registerUser(email, password, username, referralCode);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signInWithApple = async () => {
    await authService.signInWithApple();
  };

  const signInAsGuest = async () => {
    setLoading(true);
    try {
      console.log('🎮 Starting guest sign in...');
      await guestAuth.signInAsGuest();
      console.log('✅ Guest sign in completed');
    } catch (error) {
      console.error('❌ Guest sign in failed:', error);
      Alert.alert('Couldn\'t Start', friendlyAuthError(error instanceof Error ? error.message : undefined));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await authService.getOrCreateUserProfile(user);
      setUserProfile(userDoc as any);
    } catch (error) {
      // Keep the profile we already have rather than dropping the session
      console.error('Failed to refresh the user profile:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isGuest,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signInAsGuest,
    signOut: handleSignOut,
    resetPassword,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
