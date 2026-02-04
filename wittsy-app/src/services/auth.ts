import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, firestore } from './firebase';
import { User, Avatar } from '../types';
import { referralService } from './referralService';

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

// Get or create user profile in Firestore
export const getOrCreateUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // User document exists, return it
      return userSnap.data() as User;
    } else {
      // User document doesn't exist, create it
      console.log('Creating new user document for:', firebaseUser.email);
      const newUser: User = {
        uid: firebaseUser.uid,
        username: firebaseUser.displayName || 'Player',
        email: firebaseUser.email || '',
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
        coins: 1000,
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
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      
      await setDoc(userRef, newUser as any);
      console.log('✅ User document created successfully');
      return newUser as any;
    }
  } catch (error) {
    console.error('Error getting/creating user profile:', error);
    return null;
  }
};

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  username: string,
  referralCode?: string
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
    
    // Initialize referral data
    try {
      await referralService.initializeReferralData(firebaseUser.uid, username, referralCode);
      console.log('✅ Referral data initialized');
    } catch (error) {
      console.error('⚠️ Failed to initialize referral data:', error);
      // Don't fail registration if referral fails
    }
    
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

// Configure Google Sign-In (call this on app startup)
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: '1836a769-48db-4dc3-bffb-6487530c5daa.apps.googleusercontent.com',
      offlineAccess: true,
      iosClientId: 'com.googleusercontent.apps.1836a769-48db-4dc3-bffb-6487530c5daa',
    });
    console.log('✅ Google Sign-In configured');
  } catch (error) {
    console.error('Failed to configure Google Sign-In:', error);
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    console.log('🔵 Starting Google Sign-In...');
    
    // Check if device supports Google Play services (Android only)
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch (playServicesError: any) {
      // On iOS, this will fail but that's okay
      if (playServicesError.code !== 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw playServicesError;
      }
    }
    
    // Get user info from Google
    const userInfo = await GoogleSignin.signIn();
    console.log('✅ Got Google user info');
    
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(userInfo.data?.idToken);
    
    // Sign in to Firebase with the Google credential
    const userCredential = await signInWithCredential(auth, googleCredential);
    console.log('✅ Signed in to Firebase with Google credential');
    
    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(userCredential.user);
    
    // Initialize referral data for new Google sign-ins
    if (userProfile) {
      try {
        const existingReferral = await referralService.getReferralData(userCredential.user.uid);
        if (!existingReferral) {
          await referralService.initializeReferralData(
            userCredential.user.uid, 
            userProfile.username || 'Player'
          );
        }
      } catch (error) {
        console.error('⚠️ Failed to initialize referral data:', error);
      }
    }
    
    // Update last active
    await setDoc(
      doc(firestore, 'users', userCredential.user.uid),
      { lastActive: new Date().toISOString() },
      { merge: true }
    );
    
    console.log('✅ Google Sign-In complete');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in is already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    }
    
    throw new Error(error.message || 'Failed to sign in with Google');
  }
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
