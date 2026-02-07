import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  fetchSignInMethodsForEmail,
  linkWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, Avatar } from '../types';
import { referralService } from './referralService';

// Dynamic imports for Expo Go compatibility
let GoogleSignin: any = null;
let AppleAuthentication: any = null;

try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.log('⏭️ Skipping Google Sign-In import (Expo Go)');
}

try {
  AppleAuthentication = require('expo-apple-authentication');
} catch (e) {
  console.log('⏭️ Skipping Apple Authentication import (Expo Go)');
}

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
    
    // Update last active - don't fail sign-in if this fails
    try {
      await setDoc(
        doc(firestore, 'users', userCredential.user.uid),
        { lastActive: new Date().toISOString() },
        { merge: true }
      );
    } catch (updateError) {
      console.error('⚠️ Failed to update last active (non-critical):', updateError);
      // Don't throw - sign-in should still succeed
    }

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
      webClientId: '757129696124-0idv372oukrados213f4cuok31fvce4l.apps.googleusercontent.com',
      iosClientId: '757129696124-cildtmm00qi49redkpq5jtkvdaua02at.apps.googleusercontent.com',
      offlineAccess: true,
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

// Sign in with Apple
export const signInWithApple = async (): Promise<FirebaseUser> => {
  try {
    if (!AppleAuthentication) {
      throw new Error('Apple Authentication not available');
    }

    console.log('🍎 Starting Apple Sign-In...');
    
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('✅ Got Apple credential');

    // Create an Apple credential for Firebase
    const { identityToken } = credential;
    if (!identityToken) {
      throw new Error('No identity token returned from Apple');
    }

    const provider = new OAuthProvider('apple.com');
    const appleCredential = provider.credential({
      idToken: identityToken,
    });

    // Try to sign in with Apple credential
    let userCredential;
    let isAccountLinking = false;
    
    try {
      userCredential = await signInWithCredential(auth, appleCredential);
      console.log('✅ Signed in to Firebase with Apple credential');
    } catch (signInError: any) {
      console.log('⚠️ Sign-in failed, checking for account linking...', signInError.code);
      
      // Check if this is an account-exists-with-different-credential error
      if (signInError.code === 'auth/account-exists-with-different-credential') {
        console.log('🔗 Account exists with different credential, triggering linking flow...');
        
        // Get the email from the Apple credential
        const email = credential.email;
        if (!email) {
          throw new Error('No email provided by Apple. Cannot link accounts.');
        }
        
        // Check what sign-in methods exist for this email
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        console.log(`📧 Existing sign-in methods for ${email}:`, signInMethods);
        
        // If user has email/password, we need to prompt for password to link
        if (signInMethods.includes('password')) {
          // This error will be caught by the UI and trigger a password prompt
          // The UI will handle the linking, then the user will be signed in
          const error: any = new Error('ACCOUNT_LINKING_REQUIRED');
          error.email = email;
          error.pendingCredential = appleCredential;
          throw error;
        }
        
        // For other providers, we can't auto-link
        throw new Error(
          `This email is already registered with ${signInMethods[0]}. Please sign in with that method first.`
        );
      }
      
      // Re-throw other errors
      throw signInError;
    }

    // Get or create user profile with retry logic
    let userProfile = null;
    let retries = 3;
    while (retries > 0 && !userProfile) {
      try {
        userProfile = await getOrCreateUserProfile(userCredential.user);
        if (userProfile) {
          console.log('✅ User profile created/retrieved successfully');
          break;
        }
      } catch (profileError: any) {
        console.error(`⚠️ Failed to create user profile (${retries} retries left):`, profileError);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        } else {
          throw new Error('Failed to create user profile after multiple attempts');
        }
      }
    }

    // Initialize referral data for new Apple sign-ins
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
    try {
      await setDoc(
        doc(firestore, 'users', userCredential.user.uid),
        { lastActive: new Date().toISOString() },
        { merge: true }
      );
    } catch (updateError) {
      console.error('⚠️ Failed to update last active:', updateError);
      // Don't throw - this is not critical
    }

    console.log('✅ Apple Sign-In complete');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Apple Sign-In error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    if (error.code === 'ERR_CANCELED') {
      throw new Error('Sign-in was cancelled');
    }
    
    if (error.code === 'permission-denied') {
      throw new Error('Missing or insufficient permissions');
    }
    
    throw new Error(error.message || 'Failed to sign in with Apple');
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
