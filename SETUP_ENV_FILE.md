# .env File Setup Instructions

## ⚠️ CRITICAL: You Must Create This File

The `.env` file is **gitignored** (for security), so I can't create it for you. You must create it manually.

---

## 📋 Step-by-Step Instructions

### 1. Copy the Template
In your terminal, run:
```bash
cp .env.example .env
```

Or manually:
1. Open `.env.example`
2. Copy all contents
3. Create new file named `.env` (no extension, just `.env`)
4. Paste contents

---

### 2. Get Your Firebase Credentials

#### Go to Firebase Console:
1. Visit: https://console.firebase.google.com
2. Select your project: **wittsy-51992** (or your project name)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. Find your web app or create one if needed
6. Click **Config** to see your credentials

#### You'll see something like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "wittsy-51992.firebaseapp.com",
  projectId: "wittsy-51992",
  storageBucket: "wittsy-51992.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

---

### 3. Fill In Your .env File

Replace the placeholder values with your actual Firebase credentials:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=wittsy-51992.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=wittsy-51992
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=wittsy-51992.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Google Analytics
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 4. Verify Your .env File

Your final `.env` file should look like this (with YOUR actual values):

```env
# Firebase Configuration Template
# Copy this file to .env and fill in your Firebase project details

# Get these values from Firebase Console > Project Settings > General
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC_your_actual_key_here_32_chars
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=wittsy-51992.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=wittsy-51992
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=wittsy-51992.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# Optional: Google Analytics
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

---

### 5. Important Notes

#### ✅ DO:
- Keep `.env` file in the root directory (same level as `package.json`)
- Use your **actual Firebase credentials** from Firebase Console
- Double-check there are no typos
- Make sure there are no quotes around the values
- Keep this file **secret** - never commit to git

#### ❌ DON'T:
- Don't use the example values (`your_api_key_here`, etc.)
- Don't add quotes around values
- Don't commit `.env` to git (it's already gitignored)
- Don't share your `.env` file publicly

---

### 6. Test It Works

After creating `.env`, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
```

The app should now connect to Firebase successfully.

---

## 🔍 Troubleshooting

### "Firebase not connecting"
- Check that `.env` file exists in root directory
- Verify all values are correct (no typos)
- Restart the dev server after creating `.env`

### "Environment variables undefined"
- Make sure variable names start with `EXPO_PUBLIC_`
- No quotes around values
- No spaces around `=` sign

### "Still seeing placeholder values"
- You didn't replace the example values
- Go back to Firebase Console and copy real values

---

## ✅ Once Complete

After creating `.env` with correct Firebase credentials:
1. Restart your dev server
2. The app will connect to Firebase
3. You can build for TestFlight
4. All features will work correctly

---

## 🚀 Ready to Build?

Once your `.env` file is set up, you're ready to build:

```bash
# Development build
eas build --platform ios --profile development

# Production build (when you have credits)
eas build --platform ios --profile production
```
