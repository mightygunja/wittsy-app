/**
 * Create Firestore Indexes Script
 * 
 * Note: Composite indexes can only be created via Firebase Console or by triggering
 * index creation through actual queries. This script generates the firestore.indexes.json
 * file that can be deployed with Firebase CLI.
 * 
 * Usage: node scripts/createIndexes.js
 */

const fs = require('fs');
const path = require('path');

const INDEXES_CONFIG = {
  "indexes": [
    {
      "collectionGroup": "leaderboards",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "rating",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "username",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "rooms",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "matches",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "players",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "difficulty",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
};

function createIndexes() {
  console.log('📊 Creating Firestore indexes configuration...\n');

  try {
    // Save to temporary location
    const indexFile = path.join(__dirname, '.rules-temp', 'firestore.indexes.json');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(indexFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(indexFile, JSON.stringify(INDEXES_CONFIG, null, 2));

    console.log('✓ Index configuration created: scripts/.rules-temp/firestore.indexes.json');
    console.log('\n📝 To deploy indexes:');
    console.log('\n1. Copy the file to your project root:');
    console.log('   copy scripts\\.rules-temp\\firestore.indexes.json firestore.indexes.json');
    console.log('\n2. Deploy with Firebase CLI:');
    console.log('   firebase deploy --only firestore:indexes');
    console.log('\n⏱️ Index creation can take several minutes.');
    console.log('   You can monitor progress in Firebase Console > Firestore > Indexes\n');

    console.log('\n🎯 Indexes to be created:');
    console.log('   1. Leaderboards: rating (desc) + username (asc)');
    console.log('   2. Rooms: status + createdAt (desc)');
    console.log('   3. Matches: players (array) + createdAt (desc)');
    console.log('   4. Prompts: category + difficulty + isActive\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

createIndexes();
