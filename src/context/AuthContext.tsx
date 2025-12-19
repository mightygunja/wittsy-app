import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import * as authService from '../services/auth';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Now using React Native Firebase - works natively!
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // TODO: Fetch user profile from Firestore
        // For now, create a basic profile from auth user
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
            votingAccuracy: 0
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
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      await authService.registerUser(email, password, username);
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

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut: handleSignOut,
    resetPassword
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
