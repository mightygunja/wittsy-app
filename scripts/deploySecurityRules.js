/**
 * Deploy Security Rules Script
 * 
 * Automatically deploys Firestore, Realtime Database, and Storage security rules.
 * 
 * Usage: node scripts/deploySecurityRules.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize if not already done
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    match /rooms/{roomId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        resource.data.hostId == request.auth.uid ||
        request.auth.uid in resource.data.players
      );
      allow delete: if isSignedIn() && resource.data.hostId == request.auth.uid;
    }
    
    match /prompts/{promptId} {
      allow read: if isSignedIn();
      allow write: if false;
    }
    
    match /matches/{matchId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    match /leaderboards/{leaderboardId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /achievements/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    match /friendRequests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (
        resource.data.fromUserId == request.auth.uid ||
        resource.data.toUserId == request.auth.uid
      );
    }
    
    match /chatMessages/{messageId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
  }
}`;

const STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /prompts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    match /logs/{allPaths=**} {
      allow read: if false;
      allow write: if request.auth != null;
    }
  }
}`;

const REALTIME_DB_RULES = {
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "typing": {
      "$roomId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
};

async function deployRules() {
  console.log('🔒 Deploying security rules...\n');

  try {
    // Save rules to temporary files
    const rulesDir = path.join(__dirname, '.rules-temp');
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir);
    }

    fs.writeFileSync(path.join(rulesDir, 'firestore.rules'), FIRESTORE_RULES);
    fs.writeFileSync(path.join(rulesDir, 'storage.rules'), STORAGE_RULES);
    fs.writeFileSync(path.join(rulesDir, 'database.rules.json'), JSON.stringify(REALTIME_DB_RULES, null, 2));

    console.log('✓ Security rules files created in scripts/.rules-temp/');
    console.log('\n📝 IMPORTANT: To deploy these rules, you need to use Firebase CLI:');
    console.log('\n1. Install Firebase CLI (if not installed):');
    console.log('   npm install -g firebase-tools');
    console.log('\n2. Login to Firebase:');
    console.log('   firebase login');
    console.log('\n3. Initialize Firebase in your project:');
    console.log('   firebase init');
    console.log('   - Select: Firestore, Realtime Database, Storage');
    console.log('   - Use existing project');
    console.log('   - Accept default file paths');
    console.log('\n4. Copy the rules to the correct files:');
    console.log('   - Copy scripts/.rules-temp/firestore.rules → firestore.rules');
    console.log('   - Copy scripts/.rules-temp/storage.rules → storage.rules');
    console.log('   - Copy scripts/.rules-temp/database.rules.json → database.rules.json');
    console.log('\n5. Deploy:');
    console.log('   firebase deploy --only firestore:rules,storage:rules,database:rules');
    console.log('\n💡 Or run: node scripts/setupFirebaseCLI.js (automated helper)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

deployRules();
