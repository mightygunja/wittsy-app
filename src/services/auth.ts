import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getAuth, firestore } from './firebase';
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

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  username: string
): Promise<User> => {
  try {
    const auth = getAuth();
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;

    await firebaseUser.updateProfile({ displayName: username });

    const newUser: User = {
      uid: firebaseUser.uid,
      username,
      email,
      avatar: getDefaultAvatar(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        roundsWon: 0,
        starsEarned: 0,
        totalVotes: 0,
        averageVotes: 0,
        votingAccuracy: 0,
        submissionRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        longestPhraseLength: 0,
        shortestWinningPhraseLength: 0,
        comebackWins: 0,
        closeCalls: 0,
        favoriteCategory: '',
        totalPlayTime: 0
      },
      rating: 1200,
      rank: 'Bronze I',
      level: 1,
      xp: 0,
      achievements: [],
      settings: {
        theme: 'auto',
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.7,
        notificationsEnabled: true,
        showOnlineStatus: true,
        allowFriendRequests: true,
        profileVisibility: 'public',
        colorBlindMode: false,
        reducedAnimations: false,
        autoSubmit: false,
        showVoteCounts: true,
        hapticFeedback: true,
      },
      friends: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    await firestore.collection('users').doc(firebaseUser.uid).set(newUser);
    return newUser;
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(error.message || 'Failed to register user');
  }
};

// Sign in
export const signIn = async (email: string, password: string): Promise<FirebaseAuthTypes.User> => {
  try {
    const auth = getAuth();
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    await firestore
      .collection('users')
      .doc(userCredential.user.uid)
      .set({ lastActive: new Date().toISOString() }, { merge: true });

    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.User> => {
  throw new Error('Google Sign-In requires @react-native-google-signin/google-signin setup');
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    const auth = getAuth();
    await auth.signOut();
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const auth = getAuth();
    await auth.sendPasswordResetEmail(email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const userDoc = await firestore.collection('users').doc(firebaseUser.uid).get();
    if (!userDoc.exists) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseAuthTypes.User | null) => void) => {
  const auth = getAuth();
  return auth.onAuthStateChanged(callback);
};
