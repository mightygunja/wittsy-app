import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  username: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: username });

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
        closeCallWins: 0,
        unanimousVotes: 0,
        perfectGames: 0
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

    await setDoc(doc(firestore, 'users', firebaseUser.uid), newUser);
    return newUser;
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(error.message || 'Failed to register user');
  }
};

// Sign in
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    await setDoc(
      doc(firestore, 'users', userCredential.user.uid),
      { lastActive: new Date().toISOString() },
      { merge: true }
    );

    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  throw new Error('Google Sign-In requires additional setup');
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    console.warn('Auth not initialized, returning empty unsubscribe');
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};
