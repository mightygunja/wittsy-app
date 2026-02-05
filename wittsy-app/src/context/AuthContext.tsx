import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { User } from 'firebase/auth';
import * as authService from '../services/auth';
import * as guestAuth from '../services/guestAuth';
import { UserProfile } from '../types';
import { monetization } from '../services/monetization';
import { battlePass } from '../services/battlePassService';
import { seedChallenges } from '../utils/seedChallenges';
import { seedPrompts } from '../utils/seedPrompts';

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
        // Initialize RevenueCat with user ID
        await monetization.initialize(firebaseUser.uid);
        
        // Initialize Battle Pass (requires authentication)
        await battlePass.initialize();
        
        // Seed data after authentication
        await seedChallenges();
        await seedPrompts();
        
        // Create or fetch user profile from Firestore
        const userDoc = await authService.getOrCreateUserProfile(firebaseUser);
        
        if (userDoc) {
          setUserProfile(userDoc as any); // Type conversion needed
        } else {
          // Fallback to temporary profile
          setUserProfile({
            uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || 'Anonymous',
          avatar: {
            faceShape: 'circle',
            skinTone: '#FFD1A3',
            hairstyle: 'short',
            hairColor: '#000000',
            eyes: 'normal',
            mouth: 'smile',
            accessories: [],
            background: '#6C63FF'
          },
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            roundsWon: 0,
            starsEarned: 0,
            totalVotes: 0,
            averageVotes: 0,
            submissionRate: 100,
            votingAccuracy: 0,
            currentStreak: 0,
            bestStreak: 0,
            longestPhraseLength: 0,
            shortestWinningPhraseLength: 0,
            comebackWins: 0,
            closeCallWins: 0,
            unanimousVotes: 0,
            perfectGames: 0
          },
          rating: 1200,
          rank: 'Bronze I',
          level: 1,
          xp: 0,
          achievements: [],
          friends: [],
          settings: {
            theme: 'auto',
            soundEnabled: true,
            musicVolume: 0.7,
            sfxVolume: 0.8,
            notificationsEnabled: true,
            showOnlineStatus: true,
            allowFriendRequests: true,
            profileVisibility: 'public'
          },
          createdAt: new Date(),
          lastActive: new Date()
        });
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    setLoading(true);
    try {
      await authService.registerUser(email, password, username, referralCode);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    setLoading(true);
    try {
      await authService.signInWithApple();
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setLoading(true);
    try {
      console.log('🎮 Starting guest sign in...');
      await guestAuth.signInAsGuest();
      console.log('✅ Guest sign in completed');
    } catch (error) {
      console.error('❌ Guest sign in failed:', error);
      Alert.alert('Error', `Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    if (user) {
      const userDoc = await authService.getOrCreateUserProfile(user);
      if (userDoc) {
        setUserProfile(userDoc as any);
      }
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
