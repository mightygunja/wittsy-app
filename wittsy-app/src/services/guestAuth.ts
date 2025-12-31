/**
 * Guest Authentication Service
 * Handles anonymous user creation and account linking
 */

import { 
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, Avatar } from '../types';

// Helper to create default avatar
const getDefaultAvatar = (): Avatar => ({
  faceShape: 'circle',
  skinTone: '#FFD1A3',
  hairstyle: 'short',
  hairColor: '#000000',
  eyes: 'normal',
  mouth: 'smile',
  accessories: [],
  background: '#6C63FF'
});

/**
 * Sign in as anonymous guest user
 * This allows users to start playing immediately without barriers
 */
export const signInAsGuest = async (): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInAnonymously(auth);
    const firebaseUser = userCredential.user;
    
    // Create guest user profile in Firestore
    const guestUser: User = {
      uid: firebaseUser.uid,
      username: `Guest${Math.floor(Math.random() * 10000)}`,
      email: '',
      avatar: getDefaultAvatar(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        roundsWon: 0,
        starsEarned: 0,
        totalVotes: 0,
        averageVotes: 0,
        votingAccuracy: 0,
        submissionRate: 100,
        currentStreak: 0,
        bestStreak: 0,
        longestPhraseLength: 0,
        shortestWinningPhraseLength: 0,
        comebackWins: 0,
        closeCallWins: 0,
        unanimousVotes: 0,
        perfectGames: 0,
      },
      rating: 1200,
      rank: 'Bronze I',
      level: 1,
      xp: 0,
      coins: 500, // Give guests starter coins
      gems: 0,
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
        profileVisibility: 'public',
      },
      isGuest: true,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    
    await setDoc(doc(firestore, 'users', firebaseUser.uid), guestUser as any);
    console.log('✅ Guest user created:', guestUser.username);
    
    return firebaseUser;
  } catch (error: any) {
    console.error('Error signing in as guest:', error);
    throw new Error(error.message || 'Failed to sign in as guest');
  }
};

/**
 * Link anonymous account to permanent email/password account
 * Preserves all progress, stats, and achievements
 */
export const linkGuestToAccount = async (
  email: string,
  password: string,
  username: string
): Promise<FirebaseUser> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    if (!currentUser.isAnonymous) {
      throw new Error('Current user is not a guest account');
    }
    
    // Create email/password credential
    const credential = EmailAuthProvider.credential(email, password);
    
    // Link the credential to the anonymous account
    const userCredential = await linkWithCredential(currentUser, credential);
    const linkedUser = userCredential.user;
    
    // Update display name
    await updateProfile(linkedUser, { displayName: username });
    
    // Update Firestore user document
    await updateDoc(doc(firestore, 'users', linkedUser.uid), {
      username,
      email,
      isGuest: false,
      accountLinkedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
    
    console.log('✅ Guest account linked to permanent account:', username);
    
    return linkedUser;
  } catch (error: any) {
    console.error('Error linking guest account:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    
    throw new Error(error.message || 'Failed to create account');
  }
};

/**
 * Check if current user is a guest
 */
export const isGuestUser = (): boolean => {
  const currentUser = auth.currentUser;
  return currentUser?.isAnonymous || false;
};

/**
 * Get guest user progress summary for upgrade prompts
 */
export const getGuestProgress = async (userId: string): Promise<{
  gamesPlayed: number;
  level: number;
  achievements: number;
  stars: number;
}> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return { gamesPlayed: 0, level: 1, achievements: 0, stars: 0 };
    }
    
    const userData = userDoc.data();
    
    return {
      gamesPlayed: userData.stats?.gamesPlayed || 0,
      level: userData.level || 1,
      achievements: userData.achievements?.length || 0,
      stars: userData.stats?.starsEarned || 0,
    };
  } catch (error) {
    console.error('Error getting guest progress:', error);
    return { gamesPlayed: 0, level: 1, achievements: 0, stars: 0 };
  }
};

/**
 * Check if we should show account upgrade prompt
 * Returns true at strategic moments
 */
export const shouldShowUpgradePrompt = async (userId: string): Promise<{
  shouldShow: boolean;
  reason: string;
}> => {
  try {
    const progress = await getGuestProgress(userId);
    
    // Show after first win
    if (progress.gamesPlayed === 1) {
      return { shouldShow: true, reason: 'first_win' };
    }
    
    // Show after reaching level 3
    if (progress.level === 3) {
      return { shouldShow: true, reason: 'level_milestone' };
    }
    
    // Show after earning 3 achievements
    if (progress.achievements === 3) {
      return { shouldShow: true, reason: 'achievements' };
    }
    
    // Show after earning 5 stars
    if (progress.stars === 5) {
      return { shouldShow: true, reason: 'stars' };
    }
    
    // Show after 5 games played
    if (progress.gamesPlayed === 5) {
      return { shouldShow: true, reason: 'games_played' };
    }
    
    return { shouldShow: false, reason: '' };
  } catch (error) {
    console.error('Error checking upgrade prompt:', error);
    return { shouldShow: false, reason: '' };
  }
};
