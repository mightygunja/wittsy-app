# Firebase Setup Scripts

**🎯 TL;DR:** Just run `node scripts/masterSetup.js` after getting your service account key!

---

## Quick Start

### One Command to Rule Them All

```bash
node scripts/masterSetup.js
```

This runs everything in the correct order:
1. ✅ Creates 8 Firestore collections
2. ✅ Adds 15 sample prompts
3. ✅ Initializes Realtime Database
4. ✅ Generates security rules
5. ✅ Creates index configurations

Then deploy rules:
```bash
node scripts/setupFirebaseCLI.js
```

---

## Prerequisites

### 1. Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Wittsy project
3. Click **⚙️** → **Project settings** → **Service accounts** tab
4. Click **"Generate new private key"**
5. Save as **`serviceAccountKey.json`** in this `scripts/` folder

⚠️ **Never commit this file to git!** (Already in .gitignore)

### 2. Install Dependencies

```bash
cd wittsy-app
npm install
```

---

## Individual Scripts

If you need to run scripts individually:

### 1. `masterSetup.js` - Run Everything
**The main script that orchestrates all other scripts.**

```bash
node scripts/masterSetup.js
```

---

### 2. `initializeFirestore.js` - Create Collections
**Creates all 8 Firestore collections:**
- users, rooms, prompts, matches, leaderboards, achievements, friendRequests, chatMessages

```bash
node scripts/initializeFirestore.js
```

---

### 3. `addSamplePrompts.js` - Add Test Data
**Adds 15 game prompts for testing.**

```bash
node scripts/addSamplePrompts.js
```

Sample prompts:
- "The worst thing to say on a first date is..."
- "If I was invisible for a day, I would..."
- "My superhero name would be..."

---

### 4. `initializeRealtimeDB.js` - Setup Realtime Database
**Creates structure for real-time features:**
- rooms/ (game state)
- presence/ (online/offline status)
- typing/ (typing indicators)

```bash
node scripts/initializeRealtimeDB.js
```

---

### 5. `deploySecurityRules.js` - Generate Security Rules
**Creates security rule files for:**
- Firestore (user data, rooms, prompts, etc.)
- Storage (avatars, uploads)
- Realtime Database (real-time game state)

```bash
node scripts/deploySecurityRules.js
```

Files created in `scripts/.rules-temp/`

---

### 6. `createIndexes.js` - Generate Indexes
**Creates index configuration for:**
- Leaderboards (by rating)
- Rooms (by status + creation)
- Matches (by players + date)
- Prompts (by category + difficulty)

```bash
node scripts/createIndexes.js
```

---

### 7. `setupFirebaseCLI.js` - Deploy Everything
**Automated deployment of rules and indexes using Firebase CLI.**

```bash
node scripts/setupFirebaseCLI.js
```

This will:
1. Install Firebase CLI (if needed)
2. Login to Firebase
3. Initialize Firebase project
4. Deploy all security rules
5. Deploy Firestore indexes

---

## Troubleshooting

### "serviceAccountKey.json not found"
Download from Firebase Console > Project Settings > Service Accounts

### "Permission denied"
- Ensure you're signed in: `firebase login`
- Check security rules are deployed
- Verify you have project owner/editor role

### "ENOENT: no such file or directory"
- Run from `wittsy-app` directory
- Make sure `npm install` was completed

### "databaseURL" error
- Enable Realtime Database in Firebase Console first
- Go to Build → Realtime Database → Create Database

### Firebase CLI issues
```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

---

## What Gets Automated vs Manual

### ✅ Fully Automated (Scripts Handle This)
- Firestore collection creation
- Sample data insertion
- Realtime Database structure
- Security rules generation
- Index configuration
- Rules deployment (with CLI script)

### ⚠️ Manual Firebase Console Steps (You Do This Once)
1. Create Firebase project
2. Register Web/iOS/Android apps
3. Enable Authentication providers
4. Enable Firestore/Realtime DB/Storage
5. Download service account key

See [SIMPLE_FIREBASE_SETUP.md](../../SIMPLE_FIREBASE_SETUP.md) for the 4-step manual process.

---

## Security Note

🔒 **`serviceAccountKey.json` = Full Admin Access**

If exposed:
1. Firebase Console → Project Settings → Service Accounts
2. Delete compromised key
3. Generate new key

---

## File Structure

```
scripts/
├── masterSetup.js              ⭐ Run this first
├── setupFirebaseCLI.js          ⭐ Then this
├── initializeFirestore.js
├── addSamplePrompts.js
├── initializeRealtimeDB.js
├── deploySecurityRules.js
├── createIndexes.js
├── serviceAccountKey.json      🔒 Your key goes here
├── .rules-temp/                 (generated files)
│   ├── firestore.rules
│   ├── storage.rules
│   ├── database.rules.json
│   └── firestore.indexes.json
└── README.md                    📖 You are here
```
