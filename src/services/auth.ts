import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithPopup,
  linkWithPopup,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, Avatar } from '../types';
import { referralService } from './referralService';
// Dynamic imports for native modules (Expo Go compatibility)
// Google Sign-In is DISABLED in production - do not load the native module
let GoogleSignin: any = null;
let AppleAuthentication: any = null;

try {
  AppleAuthentication = require('expo-apple-authentication');
} catch (e) {
  console.log('⏭️ Skipping Apple Authentication import (Expo Go)');
}

// Generate a random fun username for new accounts that have no displayName
const ADJECTIVES = [
  'Witty', 'Clever', 'Sneaky', 'Zany', 'Sassy', 'Funky', 'Wacky', 'Spicy',
  'Cheeky', 'Goofy', 'Peppy', 'Snappy', 'Jazzy', 'Nifty', 'Quirky', 'Snarky',
  'Loopy', 'Zippy', 'Slick', 'Punchy', 'Jolly', 'Crafty', 'Feisty', 'Nerdy',
];
const NOUNS = [
  'Wizard', 'Penguin', 'Llama', 'Pickle', 'Goblin', 'Noodle', 'Raccoon', 'Walrus',
  'Platypus', 'Biscuit', 'Cactus', 'Muffin', 'Waffle', 'Burrito', 'Nugget', 'Taco',
  'Pigeon', 'Hamster', 'Otter', 'Gremlin', 'Panda', 'Sloth', 'Wombat', 'Quokka',
];
const generateRandomUsername = (): string => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100–999
  return `${adj}${noun}${num}`;
};

// Security rules require a username of 3–20 characters: letters, digits and
// underscores only. A provider's display name went straight into this field,
// so a real name ("Abbas Hiptullah Kisat", "José") was rejected and the
// account was left signed in with no profile at all.
export const sanitizeUsername = (raw?: string | null): string => {
  const cleaned = (raw || '')
    .normalize('NFD')                 // separate accents from their letters
    .replace(/[\u0300-\u036f]/g, '')  // drop the accent marks
    .replace(/[^a-zA-Z0-9_]/g, '')    // spaces, apostrophes, emoji, punctuation
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : generateRandomUsername();
};

export const PROFILE_SETUP_FAILED =
  "We couldn't finish setting up your account. Please check your connection and try again.";

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
export const getOrCreateUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
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
        username: sanitizeUsername(firebaseUser.displayName),
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
    // Rethrow: a caller that silently continues leaves the user in a phantom
    // session whose games, coins and purchases are never saved.
    console.error('Error getting/creating user profile:', error);
    throw error;
  }
};

/**
 * Create the profile, retrying a few times, and never leave an account signed
 * in without one — the Auth account exists the moment the credential lands,
 * so giving up quietly strands it with no profile.
 */
const ensureUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await getOrCreateUserProfile(firebaseUser);
    } catch (profileError) {
      lastError = profileError;
      console.error(`⚠️ Profile setup attempt ${attempt}/3 failed:`, profileError);
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  await firebaseSignOut(auth).catch(() => {});
  console.error('❌ Gave up on profile setup — signed the account out.', lastError);
  throw new Error(PROFILE_SETUP_FAILED);
};

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  username: string,
  referralCode?: string
): Promise<User> => {
  try {
    // Check username availability BEFORE creating the auth account — creating
    // it first would strand a half-registered account on a name collision.
    // Best-effort only: a signed-out registrant cannot read the users
    // collection (rules require auth), so a permission failure here must
    // NOT block the signup — skip the check rather than break registration.
    try {
      const nameTaken = await getDocs(
        query(collection(firestore, 'users'), where('username', '==', username), limit(1))
      );
      if (!nameTaken.empty) {
        throw new Error('That username is already taken. Try another one.');
      }
    } catch (checkError: any) {
      if (checkError.message === 'That username is already taken. Try another one.') {
        throw checkError;
      }
      console.warn('Username availability pre-check skipped:', checkError?.code || checkError?.message);
    }

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
    
    // Update last active - use merge to avoid overwriting other fields
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
  if (!GoogleSignin) {
    console.log('⏭️ Google Sign-In not available (Expo Go)');
    return;
  }
  try {
    GoogleSignin.configure({
      webClientId: '757129696124-0idv372oukrados213f4cuok31fvce4l.apps.googleusercontent.com',
      iosClientId: '757129696124-cildtmm00qi49redkpq5jtkvdaua02at.apps.googleusercontent.com',
      offlineAccess: false,
    });
    console.log('✅ Google Sign-In configured');
  } catch (error) {
    console.error('❌ Failed to configure Google Sign-In:', error);
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  // Web: the Firebase JS SDK handles Google natively via a popup — no native
  // module required. Guests are upgraded in place (linkWithPopup keeps their
  // uid, coins, stats, and starred phrases); if the Google account already
  // belongs to another profile, we sign into that profile instead.
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let firebaseUser: FirebaseUser;
    try {
      if (auth.currentUser?.isAnonymous) {
        const cred = await linkWithPopup(auth.currentUser, provider);
        firebaseUser = cred.user;
      } else {
        const cred = await signInWithPopup(auth, provider);
        firebaseUser = cred.user;
      }
    } catch (error: any) {
      if (
        error?.code === 'auth/credential-already-in-use' ||
        error?.code === 'auth/email-already-in-use'
      ) {
        // This Google account already owns a Wittz profile — sign into it.
        const cred = await signInWithPopup(auth, provider);
        firebaseUser = cred.user;
      } else if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        throw new Error('Sign in was cancelled');
      } else if (error?.code === 'auth/popup-blocked') {
        throw new Error('Your browser blocked the sign-in popup. Please allow popups for wittz.app and try again.');
      } else {
        throw error;
      }
    }

    await ensureUserProfile(firebaseUser);
    try {
      await setDoc(
        doc(firestore, 'users', firebaseUser.uid),
        { lastActive: new Date().toISOString() },
        { merge: true }
      );
    } catch {}
    return firebaseUser;
  }

  if (!GoogleSignin) {
    throw new Error('Google Sign-In is not available in Expo Go. Use a development build.');
  }
  try {
    console.log('🔵 Starting Google Sign-In...');
    
    // Check if device supports Google Play Services (Android only)
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Google Play Services available');
    } catch (playServicesError: any) {
      console.log('⚠️ Play Services check:', playServicesError.message);
      // Continue anyway - might be iOS
    }

    // Sign out first to ensure clean state
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      // Ignore signout errors
    }

    // Sign in with Google
    console.log('🔵 Calling GoogleSignin.signIn()...');
    const response = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In response received');

    // Get ID token from response
    const idToken = response.data?.idToken;
    if (!idToken) {
      console.error('❌ No ID token in response:', response);
      throw new Error('No ID token received from Google');
    }

    console.log('✅ Got Google ID token');

    // Create Firebase credential
    const googleCredential = GoogleAuthProvider.credential(idToken);
    console.log('✅ Google credential created for Firebase');

    // Sign in to Firebase
    const userCredential = await signInWithCredential(auth, googleCredential);
    console.log('✅ Signed in to Firebase with Google:', userCredential.user.email);

    // Create or update user profile
    await ensureUserProfile(userCredential.user);
    console.log('✅ User profile created/updated');

    // Update last active
    try {
      await setDoc(
        doc(firestore, 'users', userCredential.user.uid),
        { lastActive: new Date().toISOString() },
        { merge: true }
      );
    } catch (updateError) {
      console.error('⚠️ Failed to update last active:', updateError);
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    // Provide user-friendly error messages
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
      throw new Error('Sign in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign in already in progress');
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

    // The old loop only decremented `retries` inside its catch, so a null
    // return spun forever and froze the app mid sign-in.
    const userProfile = await ensureUserProfile(userCredential.user);
    console.log('✅ User profile created/retrieved successfully');

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

    // Re-throw the linking error UNCHANGED: it carries .email and
    // .pendingCredential, which the linking UI needs. Wrapping it in a fresh
    // Error strips those properties and breaks account linking entirely.
    if (error.message === 'ACCOUNT_LINKING_REQUIRED') {
      throw error;
    }

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

// Delete account permanently (required by Apple App Store guidelines)
//
// Ordering matters: Firebase rejects deleteUser with auth/requires-recent-login
// for sessions older than ~5 minutes. The old flow deleted all Firestore data
// FIRST, so that rejection left the account alive with every trace of progress
// already destroyed. Now we (1) pre-check session recency before touching
// anything, (2) require the core profile deletion to succeed before the auth
// account is removed, and (3) never report success when data survived.
const RECENT_LOGIN_WINDOW_MS = 4 * 60 * 1000;

export const deleteAccount = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently signed in');
  }

  const userId = currentUser.uid;

  // 0. Recency pre-check BEFORE deleting anything: if the session is too old,
  // deleteUser would fail after the data was already gone.
  const lastSignIn = currentUser.metadata.lastSignInTime
    ? new Date(currentUser.metadata.lastSignInTime).getTime()
    : 0;
  if (!currentUser.isAnonymous && Date.now() - lastSignIn > RECENT_LOGIN_WINDOW_MS) {
    throw new Error(
      'For security, please sign out, sign back in, and delete your account right away.'
    );
  }

  console.log('🗑️ Starting account deletion for user:', userId);

  try {
    // 1. Delete the user's core profile document. This one is NOT optional —
    // if it fails we abort before removing the auth account, so nothing is
    // orphaned and the user can retry.
    await deleteDoc(doc(firestore, 'users', userId));
    console.log('✅ Deleted user document');

    // 2. Best-effort cleanup of secondary per-user documents.
    const secondaryDocs = [
      doc(firestore, 'battlePasses', userId),
      doc(firestore, 'avatars', userId),
      doc(firestore, 'referrals', userId),
      doc(firestore, 'dailyRewards', userId),
    ];
    for (const ref of secondaryDocs) {
      try {
        await deleteDoc(ref);
      } catch (e) {
        console.error(`Failed to delete ${ref.path}:`, e);
      }
    }

    // 3. Delete user's friend requests
    try {
      const sentRequests = await getDocs(
        query(collection(firestore, 'friendRequests'), where('fromUserId', '==', userId))
      );
      const receivedRequests = await getDocs(
        query(collection(firestore, 'friendRequests'), where('toUserId', '==', userId))
      );
      for (const docSnap of [...sentRequests.docs, ...receivedRequests.docs]) {
        await deleteDoc(docSnap.ref);
      }
      console.log('✅ Deleted friend requests');
    } catch (e) {
      console.error('Failed to delete friend requests:', e);
    }

    // 4. Delete the Firebase Auth account last — the recency pre-check makes
    // a requires-recent-login rejection here very unlikely.
    await deleteUser(currentUser);
    console.log('✅ Firebase Auth account deleted');

    console.log('✅ Account deletion complete for user:', userId);
  } catch (error: any) {
    console.error('❌ Account deletion failed:', error);

    if (error.code === 'auth/requires-recent-login') {
      throw new Error(
        'For security, please sign out, sign back in, and delete your account right away.'
      );
    }
    if (error.code === 'permission-denied') {
      throw new Error('Account deletion failed. Please try again or contact support.');
    }

    throw new Error(error.message || 'Failed to delete account');
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
