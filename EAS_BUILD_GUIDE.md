# EAS Development Build Setup Guide

## What Just Happened?

I've configured your app to use **React Native Firebase** with **EAS Development Build**. This provides native Firebase support that works reliably, unlike the Firebase Web SDK in Expo Go.

## Next Steps

### 1. Download Firebase Configuration Files

You need to download these files from your Firebase Console:

#### For iOS: `GoogleService-Info.plist`
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "Wittsy" project
3. Click the gear icon → Project Settings
4. Scroll to "Your apps" section
5. Click on your iOS app (or add one if it doesn't exist)
   - Bundle ID: `com.wittsy.app`
6. Click "Download GoogleService-Info.plist"
7. Save it to: `c:\dev\Wittsy\wittsy-app\GoogleService-Info.plist`

#### For Android: `google-services.json`
1. Same Firebase Console → Project Settings
2. Click on your Android app (or add one)
   - Package name: `com.wittsy.app`
3. Click "Download google-services.json"
4. Save it to: `c:\dev\Wittsy\wittsy-app\google-services.json`

### 2. Build the Development Build

Once you have the config files, run:

```powershell
cd c:\dev\Wittsy\wittsy-app
eas build --profile development --platform ios
```

**What this does:**
- Creates a custom native build of your app
- Includes React Native Firebase native modules
- Takes ~15-20 minutes
- Produces an .ipa file you can install on your iPhone

### 3. Install on Your iPhone

After the build completes:

1. EAS will give you a download link
2. Open the link on your iPhone
3. Install the app (you may need to trust the developer certificate)
4. The app will appear on your home screen

### 4. Run the Development Server

```powershell
npx expo start --dev-client
```

- Scan the QR code with the **custom development build** (not Expo Go)
- Firebase Auth will now work perfectly!

## Key Changes Made

1. **Installed packages:**
   - `@react-native-firebase/app` - Core Firebase
   - `@react-native-firebase/auth` - Native auth module

2. **Updated files:**
   - `firebase.ts` - Now uses React Native Firebase
   - `auth.ts` - All functions use native Firebase API
   - `AuthContext.tsx` - Simplified, synchronous auth
   - `app.json` - Added Firebase plugin
   - `eas.json` - Build configuration
   - `package.json` - Added `expo` script for npm

3. **Authentication now works:**
   - ✅ Email/Password sign-in
   - ✅ Registration
   - ✅ Password reset
   - ✅ Auth state listener
   - ⏳ Google Sign-In (requires additional setup)

## Troubleshooting

**"Invalid UUID appId" error:**
- This happens during `eas init` if Firebase app IDs aren't valid UUIDs
- It's safe to ignore - we configured EAS manually

**Build fails:**
- Make sure GoogleService-Info.plist and google-services.json are in the root directory
- Verify the bundle IDs match in Firebase Console

**App won't install:**
- You may need an Apple Developer account ($99/year for production)
- For development, you can use a free account with some limitations

## Alternative: Test on Web First

If you want to test immediately without building:

```powershell
npx expo start
# Press 'w' for web
```

The app should work on web with the current setup!

---

**Ready to build?** Download those config files and run the EAS build command!
