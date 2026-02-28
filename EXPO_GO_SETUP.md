# 🚀 Expo Go Setup Guide for Wittsy

## ✅ Fixes Applied

I've fixed the following issues to make your app compatible with Expo Go:

### 1. **Package.json Dependencies Fixed**
- ✅ Downgraded `@react-native-async-storage/async-storage` from 1.23.1 to 2.2.0 (Expo SDK 54 compatible)
- ✅ Downgraded `react-native-worklets` from 0.7.1 to 0.5.1 (Expo SDK 54 compatible)
- ✅ Removed `@types/react-native` (types are included with react-native package)

### 2. **Package.json Scripts Fixed**
- ✅ Removed `"expo": "expo"` script (conflicts with Expo CLI)
- ✅ Renamed `"tsc"` to `"type-check"` (conflicts with TypeScript binary)

### 3. **Firebase Realtime Database Fixed**
- ✅ Added `getDatabase` import from `firebase/database`
- ✅ Initialized Realtime Database in `firebase.ts`
- ✅ Added `databaseURL` to Firebase config
- ✅ Exported `realtimeDb` for use in `realtime.ts`

### 4. **App Config Enhanced**
- ✅ Added icon and splash screen configuration
- ✅ Configured splash screen with brand color

---

## 📱 How to Launch on Expo Go

### Step 1: Make Sure You Have .env File
Ensure you have a `.env` file in the `wittsy-app` directory with your Firebase credentials:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Step 2: Start the Development Server
```bash
cd wittsy-app
npm start
```

### Step 3: Open in Expo Go
1. **Install Expo Go** on your iOS or Android device from the App Store/Play Store
2. **Scan the QR code** that appears in your terminal
3. The app will load in Expo Go!

---

## 🔍 Verification Commands

Run these to verify everything is working:

```bash
# Check for dependency issues
npx expo-doctor

# Check TypeScript
npm run type-check

# Start the app
npm start
```

---

## ⚠️ Known Limitations with Expo Go

Expo Go has some limitations compared to a development build:

### ❌ **Not Available in Expo Go:**
- Custom native modules
- Firebase Cloud Messaging (push notifications)
- Some advanced native features

### ✅ **Available in Expo Go:**
- All core React Native features
- Firebase Auth, Firestore, Realtime Database
- React Navigation
- Expo modules (notifications, haptics, etc.)
- All your UI components and game logic

---

## 🐛 Troubleshooting

### Issue: "Unable to resolve module"
**Solution:** Clear cache and restart
```bash
npm start -- --clear
```

### Issue: "Firebase not initialized"
**Solution:** Check your `.env` file has all required Firebase credentials

### Issue: "Network request failed"
**Solution:** 
1. Make sure your phone and computer are on the same WiFi network
2. Check your Firebase project settings
3. Verify Firestore and Realtime Database are enabled in Firebase Console

### Issue: App crashes on startup
**Solution:**
1. Check the error in the Expo Go app
2. Look at the terminal output for errors
3. Verify all dependencies are installed: `npm install`

---

## 🎯 Next Steps After Testing

Once you've tested in Expo Go and want more features:

### Option 1: Create Development Build (Recommended)
```bash
npx expo install expo-dev-client
npx eas build --profile development --platform ios
```

### Option 2: Build for Production
```bash
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

---

## 📊 What Works Now

✅ **Authentication**
- Email/Password login
- Google Sign-In (web-based)
- User registration

✅ **Game Rooms**
- Create rooms
- Browse rooms
- Join rooms
- Room settings

✅ **Profile & Stats**
- View profile
- Track statistics
- Achievement system
- XP and leveling

✅ **Leaderboards**
- Global rankings
- Sort by rating/wins/stars

✅ **UI/UX**
- All screens
- Navigation
- Animations
- Beautiful design

⚠️ **Partial Functionality**
- Game loop (UI works, backend integration incomplete)
- Real-time features (structure ready, needs testing)

---

## 🚀 Launch Command

**Quick Start:**
```bash
cd wittsy-app && npm start
```

Then scan the QR code with Expo Go!

---

**Happy Testing! 🎮**
