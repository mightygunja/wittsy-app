/**
 * Initialize Realtime Database Script
 * 
 * Creates the initial data structure in Firebase Realtime Database.
 * 
 * Usage: node scripts/initializeRealtimeDB.js
 */

const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const db = admin.database();

async function initializeDatabase() {
  console.log('💾 Initializing Realtime Database...\n');

  try {
    // Test connection first
    console.log('Testing connection to Realtime Database...');
    const testRef = db.ref('.info/connected');
    
    // Wait for connection with timeout
    const connected = await Promise.race([
      new Promise((resolve) => {
        testRef.once('value', (snapshot) => {
          resolve(snapshot.val());
        });
      }),
      new Promise((resolve) => setTimeout(() => resolve(false), 5000))
    ]);

    if (!connected) {
      throw new Error('DATABASE_NOT_CREATED');
    }

    console.log('✓ Connection successful\n');

    // Create initial structure
    const updates = {
      'rooms': {},
      'presence': {},
      'typing': {},
      '_initialized': {
        timestamp: admin.database.ServerValue.TIMESTAMP,
        by: 'initializeRealtimeDB.js'
      }
    };

    await db.ref().update(updates);

    console.log('✓ Realtime Database structure created');
    console.log('\nCreated nodes:');
    console.log('  - rooms/ (for real-time game state)');
    console.log('  - presence/ (for user online/offline status)');
    console.log('  - typing/ (for typing indicators in chat)');
    console.log('\n✅ Realtime Database initialization complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message === 'DATABASE_NOT_CREATED' || error.message.includes('databaseURL') || error.message.includes('FIREBASE WARNING')) {
      console.error('\n⚠️  REALTIME DATABASE NOT CREATED YET!\n');
      console.error('You need to create it in Firebase Console first:\n');
      console.error('1. Go to: https://console.firebase.google.com');
      console.error('2. Select your Wittsy project');
      console.error('3. Left sidebar → "Build" → "Realtime Database"');
      console.error('4. Click "Create Database"');
      console.error('5. Choose same location as Firestore (e.g., us-central1)');
      console.error('6. Select "Start in locked mode"');
      console.error('7. Click "Enable"');
      console.error('8. Run this script again\n');
      console.error('⏱️  This takes about 30 seconds in Firebase Console.\n');
    }
    
    process.exit(1);
  }

  process.exit(0);
}

initializeDatabase();
