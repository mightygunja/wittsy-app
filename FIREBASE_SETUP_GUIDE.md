# Firebase Setup Guide for Wittsy

Complete step-by-step instructions to configure Firebase for your Wittsy app.

---

## 📋 Overview

You'll be setting up:
1. Firebase Project
2. Authentication (Email, Google, Apple)
3. Firestore Database
4. Realtime Database
5. Cloud Storage
6. Cloud Functions
7. Firebase Hosting (for web)
8. Security Rules

**Estimated Time:** 15-20 minutes

---

## STEP 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Open your browser and go to: [https://console.firebase.google.com](https://console.firebase.google.com)
- Sign in with your Google account

### 1.2 Create New Project
1. Click **"Add project"** or **"Create a project"**
2. **Project name:** Enter `Wittsy` (or `Wittsy-App`)
3. Click **"Continue"**

### 1.3 Google Analytics (Optional)
1. Toggle **"Enable Google Analytics"** - Choose **OFF** for now (you can enable later)
2. Click **"Create project"**
3. Wait for project creation (30-60 seconds)
4. Click **"Continue"** when ready

✅ **Checkpoint:** You should now see your Firebase project dashboard

---

## STEP 2: Register Your Apps

**Important:** Since you want Web + iOS + Android, you'll register all three platforms. Start with Web first.

### 2.1 Add Web App

Look for a section that says **"Get started by adding Firebase to your app"** with three icons below it. You should see:
- An iOS icon (looks like an Apple logo)
- An Android icon (looks like an Android robot)
- A Web icon (looks like angle brackets `</>` or says "Web")

1. Click the **Web icon** (the `</>` symbol or button that says "Web")
2. A popup window appears
3. **App nickname:** Enter `Wittsy Web`
4. ✅ **Check the box** for "Also set up Firebase Hosting for this app"
5. Click **"Register app"**
6. **IMPORTANT:** You'll see a code snippet with `firebaseConfig` - **COPY THIS ENTIRE OBJECT** and save it in a text file temporarily!

```javascript
// Example - yours will have different values
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "wittsy-xxxxx.firebaseapp.com",
  projectId: "wittsy-xxxxx",
  storageBucket: "wittsy-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

7. Click **"Continue to console"** when done

### 2.2 Add iOS App

1. You're back at the project overview page
2. Look for a button or link that says **"Add app"** or you'll see the platform icons again
3. Click the **iOS icon** (Apple logo)
4. A popup appears asking for iOS bundle ID
5. **iOS bundle ID:** Enter `com.wittsy.app`
6. **App nickname:** Enter `Wittsy iOS`
7. Click **"Register app"**
8. **Download `GoogleService-Info.plist`** - Save this file, you'll need it later for iOS deployment
9. Click **"Next"** through the remaining installation steps (we'll do these later)
10. Click **"Continue to console"**

### 2.3 Add Android App

1. Back at project overview, click **"Add app"** again or look for the platform icons
2. Click the **Android icon** (Android robot logo)
3. **Android package name:** Enter `com.wittsy.app`
4. **App nickname:** Enter `Wittsy Android`
5. Click **"Register app"**
6. **Download `google-services.json`** - Save this file, you'll need it later for Android deployment
7. Click **"Next"** through the remaining installation steps (we'll do these later)
8. Click **"Continue to console"**

✅ **Checkpoint:** On the project overview page, you should now see **THREE apps** listed:
- 🌐 Wittsy Web
- 🍎 Wittsy iOS  
- 🤖 Wittsy Android

---

## STEP 3: Set Up Authentication

### 3.1 Enable Authentication
1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**

### 3.2 Enable Email/Password Authentication
1. Click the **"Sign-in method"** tab
2. Click **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Click **"Save"**

### 3.3 Enable Google Sign-In
1. Still in **"Sign-in method"** tab
2. Click **"Google"**
3. Toggle **"Enable"** to ON
4. **Project support email:** Select your email from dropdown
5. Click **"Save"**

### 3.4 Enable Apple Sign-In (Optional - for iOS)
1. Click **"Apple"**
2. Toggle **"Enable"** to ON
3. You'll need:
   - Apple Developer account
   - Service ID from Apple Developer Console
   - Team ID and Key ID
4. (Can configure this later when you deploy iOS app)
5. For now, just enable it and click **"Save"**

### 3.5 Configure Authorized Domains
1. Click **"Settings"** tab (gear icon at top)
2. Scroll to **"Authorized domains"**
3. By default includes:
   - `localhost` (for local development) ✅
   - Your Firebase hosting domain ✅
4. Later, add your custom domain if you have one

✅ **Checkpoint:** Email, Google, and Apple auth should show "Enabled" status

---

## STEP 4: Create Firestore Database

### 4.1 Create Database
1. In left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**

### 4.2 Choose Security Rules
1. Select **"Start in production mode"** (we'll configure rules next)
2. Click **"Next"**

### 4.3 Choose Location
1. **Cloud Firestore location:** Choose closest to your target users:
   - `us-central1` (Iowa) - Good for North America
   - `europe-west1` (Belgium) - Good for Europe
   - `asia-southeast1` (Singapore) - Good for Asia
2. ⚠️ **Warning:** Location cannot be changed later!
3. Click **"Enable"**
4. Wait for database creation (30-60 seconds)

### 4.4 Create Collections (Do this now)
1. Click **"Start collection"**
2. **Collection ID:** Enter `users`
3. Click **"Next"**
4. **Document ID:** Click "Auto-ID"
5. Add a placeholder field:
   - **Field:** `placeholder`
   - **Type:** `string`
   - **Value:** `delete this`
6. Click **"Save"**

Repeat for these collections:
- `rooms`
- `prompts`
- `matches`
- `leaderboards`
- `achievements`
- `friendRequests`
- `chatMessages`

✅ **Checkpoint:** You should see 8 collections in your Firestore Database

---

## STEP 5: Create Realtime Database

### 5.1 Create Realtime Database
1. In left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**

### 5.2 Choose Location
1. **Location:** Should match your Firestore location
2. Click **"Next"**

### 5.3 Choose Security Rules
1. Select **"Start in locked mode"** (we'll configure rules next)
2. Click **"Enable"**

### 5.4 Create Data Structure
1. Click the **"Data"** tab
2. Hover over database name and click **"+"**
3. **Name:** Enter `rooms`
4. **Value:** Enter `{}`
5. Click **"Add"**

✅ **Checkpoint:** You should see an empty `rooms` node in Realtime Database

---

## STEP 6: Set Up Cloud Storage

### 6.1 Create Storage Bucket
1. In left sidebar, click **"Build"** → **"Storage"**
2. Click **"Get started"**

### 6.2 Choose Security Rules
1. Select **"Start in production mode"**
2. Click **"Next"**

### 6.3 Choose Location
1. **Location:** Should match your Firestore location
2. Click **"Done"**

### 6.4 Create Folders
1. Click **"Create folder"**
2. Create these folders:
   - `avatars/` (for user avatar images)
   - `prompts/` (for custom prompt images if needed)
   - `logs/` (for debugging logs)

✅ **Checkpoint:** Storage bucket created with 3 folders

---

## STEP 7: Configure Security Rules

### 7.1 Firestore Security Rules
1. Go to **"Firestore Database"**
2. Click **"Rules"** tab
3. Replace the entire content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        resource.data.hostId == request.auth.uid ||
        request.auth.uid in resource.data.players
      );
      allow delete: if isSignedIn() && resource.data.hostId == request.auth.uid;
    }
    
    // Prompts collection (read-only for users)
    match /prompts/{promptId} {
      allow read: if isSignedIn();
      allow write: if false; // Only admins via Cloud Functions
    }
    
    // Matches collection (game history)
    match /matches/{matchId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Leaderboards collection (read-only, updated by Cloud Functions)
    match /leaderboards/{leaderboardId} {
      allow read: if true; // Public
      allow write: if false; // Only Cloud Functions
    }
    
    // Achievements collection
    match /achievements/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (
        resource.data.fromUserId == request.auth.uid ||
        resource.data.toUserId == request.auth.uid
      );
    }
    
    // Chat messages
    match /chatMessages/{messageId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
      allow delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        // Room host can delete messages (check in Cloud Function)
        true
      );
    }
  }
}
```

4. Click **"Publish"**

### 7.2 Realtime Database Security Rules
1. Go to **"Realtime Database"**
2. Click **"Rules"** tab
3. Replace content with:

```json
{
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
}
```

4. Click **"Publish"**

### 7.3 Storage Security Rules
1. Go to **"Storage"**
2. Click **"Rules"** tab
3. Replace content with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Avatars - users can read all, write their own
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prompts - read only
    match /prompts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Logs - write only by authenticated users
    match /logs/{allPaths=**} {
      allow read: if false;
      allow write: if request.auth != null;
    }
  }
}
```

4. Click **"Publish"**

✅ **Checkpoint:** All three sets of security rules should be published

---

## STEP 8: Set Up Cloud Functions (Optional - for later)

### 8.1 Enable Cloud Functions
1. In left sidebar, click **"Build"** → **"Functions"**
2. Click **"Get started"**
3. Click **"Upgrade project"** (requires Blaze plan - pay as you go)
   - Don't worry - free tier is generous, and you won't be charged initially
   - Free tier includes: 2M invocations/month, 400K GB-seconds
4. If you don't want to upgrade now, skip this step - you can do it later

### 8.2 Note for Later
When you're ready to deploy Cloud Functions:
```bash
cd wittsy-app
npm install -g firebase-tools
firebase login
firebase init functions
```

---

## STEP 9: Get Your Configuration

### 9.1 Find Your Firebase Config
1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web app** you created
5. Scroll to **"SDK setup and configuration"**
6. Select **"Config"** radio button
7. Copy the `firebaseConfig` object

### 9.2 Create .env File
1. Open your code editor
2. Navigate to `c:\dev\Wittsy\wittsy-app\`
3. Create a new file called `.env`
4. Copy this template and fill in your values:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Save the file

### 9.3 Verify .env is in .gitignore
1. Open `.gitignore` file
2. Verify it contains:
```
.env
.env.local
.env*.local
```

✅ **Checkpoint:** Your `.env` file is created with all Firebase config values

---

## STEP 10: Add Sample Prompts to Firestore

### 10.1 Add Initial Prompts
1. Go to **"Firestore Database"**
2. Click on **"prompts"** collection
3. Click **"Add document"**
4. **Document ID:** Click "Auto-ID"
5. Add these fields:

**Prompt 1:**
```
id: (auto-generated)
text: "The worst thing to say on a first date is..."
category: "Funny"
difficulty: "easy"
pack: "default"
```

6. Click **"Save"**
7. Click **"Add document"** again

**Prompt 2:**
```
text: "If I was invisible for a day, I would..."
category: "Situations"
difficulty: "easy"
pack: "default"
```

**Prompt 3:**
```
text: "My superhero name would be..."
category: "Funny"
difficulty: "easy"
pack: "default"
```

**Prompt 4:**
```
text: "The best excuse for being late is..."
category: "Clever"
difficulty: "medium"
pack: "default"
```

**Prompt 5:**
```
text: "If animals could talk, the first thing my pet would say is..."
category: "Animals"
difficulty: "easy"
pack: "default"
```

Add at least 10-20 prompts for testing. You can add more later!

✅ **Checkpoint:** You should have at least 5-10 prompts in your database

---

## STEP 11: Enable Firebase Hosting (For Web Deployment)

### 11.1 Enable Hosting
1. In left sidebar, click **"Build"** → **"Hosting"**
2. Click **"Get started"**
3. You'll see instructions for Firebase CLI (you'll do this later)
4. Click through to finish setup

### 11.2 Note Your Hosting URL
Your app will be hosted at: `https://your-project-id.web.app`

---

## STEP 12: Configure Firestore Indexes

### 12.1 Add Composite Indexes
1. Go to **"Firestore Database"**
2. Click **"Indexes"** tab
3. Click **"Create index"**

**Index 1 - Leaderboards by rating:**
- Collection ID: `leaderboards`
- Fields:
  - `rating` - Descending
  - `username` - Ascending
- Query scope: Collection
- Click **"Create"**

**Index 2 - Rooms by status and creation:**
- Collection ID: `rooms`
- Fields:
  - `status` - Ascending
  - `createdAt` - Descending
- Click **"Create"**

**Index 3 - Matches by user:**
- Collection ID: `matches`
- Fields:
  - `players` - Array contains
  - `createdAt` - Descending
- Click **"Create"**

Wait for indexes to build (shown with green checkmark when ready)

✅ **Checkpoint:** All indexes show "Enabled" status

---

## 🎉 SETUP COMPLETE!

### Summary of What You've Configured:

✅ Firebase project created  
✅ Web app registered (and optionally iOS/Android)  
✅ Authentication enabled (Email, Google, Apple)  
✅ Firestore Database created with collections  
✅ Realtime Database created  
✅ Cloud Storage set up  
✅ Security rules configured for all services  
✅ Sample prompts added  
✅ Indexes created  
✅ Configuration saved to .env file  

---

## 📝 Next Steps:

### 1. Install Dependencies
```bash
cd c:\dev\Wittsy\wittsy-app
npm install
```

### 2. Run the App
```bash
npm start
```

### 3. Test Firebase Connection
The app should now be able to:
- Register new users
- Sign in with email/password or Google
- Read/write to Firestore
- Upload to Storage

---

## 🔧 Troubleshooting

### Issue: "Firebase config not found"
- Make sure `.env` file exists in `wittsy-app/` directory
- Verify all `EXPO_PUBLIC_` prefixes are correct
- Restart the dev server after creating `.env`

### Issue: "Permission denied"
- Check that you're signed in (auth != null)
- Verify security rules are published
- Check that userId matches auth.uid

### Issue: "Collection doesn't exist"
- Go to Firestore and verify collection was created
- Add at least one placeholder document

---

## 📞 Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)

---

**You're all set! Firebase is ready for your Wittsy app! 🚀**
