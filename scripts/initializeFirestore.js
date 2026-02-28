/**
 * Firestore Initialization Script
 * 
 * This script creates all required Firestore collections with placeholder documents.
 * Run this once after creating your Firebase project.
 * 
 * Prerequisites:
 * 1. Create a service account key in Firebase Console:
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate new private key"
 *    - Save as serviceAccountKey.json in this scripts/ folder
 * 
 * 2. Run: node scripts/initializeFirestore.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to create
const collections = [
  'users',
  'rooms',
  'prompts',
  'matches',
  'leaderboards',
  'achievements',
  'friendRequests',
  'chatMessages'
];

async function initializeCollections() {
  console.log('🚀 Starting Firestore initialization...\n');

  for (const collectionName of collections) {
    try {
      // Check if collection already has documents
      const snapshot = await db.collection(collectionName).limit(1).get();
      
      if (!snapshot.empty) {
        console.log(`✓ Collection "${collectionName}" already exists with documents`);
        continue;
      }

      // Create placeholder document
      const docRef = db.collection(collectionName).doc();
      await docRef.set({
        placeholder: 'delete this',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'initializeFirestore.js'
      });

      console.log(`✓ Created collection "${collectionName}" with placeholder document`);
    } catch (error) {
      console.error(`✗ Error creating collection "${collectionName}":`, error.message);
    }
  }

  console.log('\n🎉 Firestore initialization complete!');
  console.log('\nNext steps:');
  console.log('1. Check your Firebase Console to verify all 8 collections exist');
  console.log('2. Run: node scripts/addSamplePrompts.js (to add initial prompts)');
  console.log('3. You can now delete the placeholder documents if desired\n');

  process.exit(0);
}

// Run the initialization
initializeCollections().catch(error => {
  console.error('❌ Initialization failed:', error);
  process.exit(1);
});
