/**
 * Create Demo Account for Apple App Review
 * 
 * Run this script ONCE to create the demo account that Apple reviewers
 * will use to test the app during the review process.
 * 
 * Usage:
 *   node scripts/createDemoAccount.js
 * 
 * Prerequisites:
 *   - Firebase Admin SDK service account key at ./serviceAccountKey.json
 *   - Or set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 
 * Demo credentials (provide these to Apple in App Review Information):
 *   Email:    demo@wittz.app
 *   Password: DemoWittz2026!
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Option 1: Use service account key file
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Option 2: Use default credentials (if running on GCP or with GOOGLE_APPLICATION_CREDENTIALS set)
admin.initializeApp({
  projectId: 'wittsy-51992',
});

const auth = admin.auth();
const db = admin.firestore();

const DEMO_EMAIL = 'demo@wittz.app';
const DEMO_PASSWORD = 'DemoWittz2026!';
const DEMO_USERNAME = 'DemoPlayer';

async function createDemoAccount() {
  console.log('🎮 Creating demo account for Apple App Review...\n');

  try {
    // Check if account already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(DEMO_EMAIL);
      console.log('⚠️  Demo account already exists:', userRecord.uid);
      console.log('   Updating password and profile...');
      
      // Update password in case it changed
      await auth.updateUser(userRecord.uid, {
        password: DEMO_PASSWORD,
        displayName: DEMO_USERNAME,
        emailVerified: true,
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new account
        userRecord = await auth.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          displayName: DEMO_USERNAME,
          emailVerified: true,
        });
        console.log('✅ Created new demo account:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Create/update Firestore user document
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      uid: userRecord.uid,
      email: DEMO_EMAIL,
      username: DEMO_USERNAME,
      displayName: DEMO_USERNAME,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      coins: 1000,
      xp: 500,
      level: 3,
      gamesPlayed: 10,
      gamesWon: 5,
      totalVotesReceived: 25,
      starsEarned: 3,
      rating: 1200,
      rankedRating: 1200,
      rankedGamesPlayed: 5,
      winStreak: 0,
      lossStreak: 0,
      tutorialCompleted: true,
      gameplayTutorialCompleted: true,
      hasFirstTimePurchase: false,
      avatarConfig: {
        skinTone: '#F5D0A9',
        hairStyle: 'short',
        hairColor: '#4A3728',
        eyeColor: '#5B8C5A',
        outfit: 'casual',
        accessory: 'none',
        background: 'default',
      },
    }, { merge: true });

    console.log('✅ Firestore user document created/updated');

    console.log('\n========================================');
    console.log('  DEMO ACCOUNT READY FOR APPLE REVIEW');
    console.log('========================================');
    console.log(`  Email:    ${DEMO_EMAIL}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    console.log(`  UID:      ${userRecord.uid}`);
    console.log('========================================\n');
    console.log('Add these credentials to App Store Connect:');
    console.log('  App Review Information → Sign-in Required → Yes');
    console.log(`  Demo Account Username: ${DEMO_EMAIL}`);
    console.log(`  Demo Account Password: ${DEMO_PASSWORD}`);
    console.log('');

  } catch (error) {
    console.error('❌ Failed to create demo account:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have Firebase Admin SDK credentials configured');
    console.error('2. Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path');
    console.error('3. Or uncomment the serviceAccountKey.json import above');
    process.exit(1);
  }

  process.exit(0);
}

createDemoAccount();
