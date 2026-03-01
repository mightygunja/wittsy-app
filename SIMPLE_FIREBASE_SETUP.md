# Simple Firebase Setup (4 Steps)

Everything else is automated! You only need to do these 4 things in the Firebase Console.

---

## ⚡ Quick Start

### Step 1: Create Firebase Project (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it **"Wittsy"**
4. Disable Google Analytics (or enable if you want)
5. Click **"Create project"**

✅ **Done!** Your Firebase project is created.

---

### Step 2: Register Your Apps (2 minutes)

You'll see "Get started by adding Firebase to your app" with three icons.

**2.1 Web App:**
1. Click the **`</>`** icon (Web)
2. App nickname: **"Wittsy Web"**
3. ✅ Check "Also set up Firebase Hosting"
4. Click **"Register app"**
5. **COPY the firebaseConfig object** (you'll need this for .env file)
6. Click **"Continue to console"**

**2.2 iOS App:**
1. Click **"Add app"** → Apple icon
2. iOS bundle ID: **"com.wittsy.app"**
3. App nickname: **"Wittsy iOS"**
4. Click **"Register app"**
5. Download **GoogleService-Info.plist** (save for later)
6. Click through to **"Continue to console"**

**2.3 Android App:**
1. Click **"Add app"** → Android icon
2. Android package name: **"com.wittsy.app"**
3. App nickname: **"Wittsy Android"**
4. Click **"Register app"**
5. Download **google-services.json** (save for later)
6. Click through to **"Continue to console"**

✅ **Done!** You should see three apps: 🌐 Wittsy Web, 🍎 Wittsy iOS, 🤖 Wittsy Android

---

### Step 3: Enable Authentication (1 minute)

1. Left sidebar → **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click **"Sign-in method"** tab

**Enable Email/Password:**
- Click **"Email/Password"**
- Toggle **ON**
- Click **"Save"**

**Enable Google:**
- Click **"Google"**
- Toggle **ON**
- Select your support email
- Click **"Save"**

**Enable Apple (optional):**
- Click **"Apple"**
- Toggle **ON**
- Click **"Save"** (configure later for iOS deployment)

✅ **Done!** Authentication providers are enabled.

---

### Step 4: Enable Firestore & Realtime Database (2 minutes)

**4.1 Firestore:**
1. Left sidebar → **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose location (e.g., **us-central1**)
5. Click **"Enable"**

**4.2 Realtime Database:**
1. Left sidebar → **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose same location as Firestore
4. Select **"Start in locked mode"**
5. Click **"Enable"**

**4.3 Cloud Storage:**
1. Left sidebar → **"Build"** → **"Storage"**
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Choose same location
5. Click **"Done"**

✅ **Done!** All Firebase services are enabled.

---

## 🤖 Now Let the Scripts Do Everything Else!

### Step 5: Download Service Account Key

1. Click **⚙️ gear icon** → **"Project settings"**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"**
5. Save the file as **`serviceAccountKey.json`** in `c:\dev\Wittsy\wittsy-app\scripts\`

⚠️ **Keep this file secure!** Never commit it to git.

---

### Step 6: Run the Master Setup Script

Open PowerShell and run:

```powershell
cd c:\dev\Wittsy\wittsy-app
node scripts/masterSetup.js
```

This single command will:
- ✅ Create all 8 Firestore collections
- ✅ Add 15 sample game prompts
- ✅ Initialize Realtime Database structure
- ✅ Generate security rules
- ✅ Generate Firestore indexes

Then run:

```powershell
node scripts/setupFirebaseCLI.js
```

This will:
- ✅ Install Firebase CLI
- ✅ Login to Firebase
- ✅ Deploy security rules
- ✅ Deploy indexes

---

### Step 7: Create Your .env File

1. In Firebase Console, click **⚙️** → **"Project settings"**
2. Scroll to **"Your apps"** section
3. Click your **Web app**
4. Find the **firebaseConfig** object
5. Copy the values into `c:\dev\Wittsy\wittsy-app\.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

### Step 8: Start Building! 🚀

```powershell
cd c:\dev\Wittsy\wittsy-app
npm install
npm start
```

Press `w` for web, `i` for iOS simulator, or `a` for Android emulator.

---

## 🎉 You're Done!

**What you did manually:** 4 Firebase Console steps (7 minutes)  
**What the scripts did:** Collections, prompts, database setup, security rules, indexes

---

## 📞 Troubleshooting

### "serviceAccountKey.json not found"
- Download it from Firebase Console > Project Settings > Service Accounts

### "Permission denied" errors
- Make sure you're signed in with `firebase login`
- Check that security rules are deployed

### "Cannot find module 'firebase-admin'"
- Run `npm install` in the wittsy-app folder

---

**That's it! The confusing parts are automated. You only touch the Firebase Console for 4 simple tasks.**
