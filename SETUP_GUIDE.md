# Wittsy App - Setup Guide

## 🚀 Quick Start Guide

This guide will walk you through setting up the Wittsy app development environment from scratch.

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **React Native CLI** - Install globally: `npm install -g react-native-cli`
- **Expo CLI** (recommended for easier setup) - Install: `npm install -g expo-cli`

### For iOS Development (Mac only)
- **Xcode** (latest version from Mac App Store)
- **CocoaPods** - Install: `sudo gem install cocoapods`

### For Android Development
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (installed with Android Studio)
- **JDK 11** or higher

### Firebase Account
- Create a Firebase account at [firebase.google.com](https://firebase.google.com)
- You'll need this for backend services

---

## Step-by-Step Setup

### Step 1: Initialize React Native Project

We'll use Expo for easier cross-platform development:

```bash
# Navigate to your development directory
cd c:\dev\Wittsy

# Initialize Expo project
npx create-expo-app wittsy-app --template blank-typescript

# Navigate into the project
cd wittsy-app
```

### Step 2: Install Core Dependencies

```bash
# Install navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# Install Expo dependencies for navigation
npx expo install react-native-screens react-native-safe-area-context

# Install Firebase
npm install firebase

# Install state management
npm install @reduxjs/toolkit react-redux
# OR use Context API (already in React, no install needed)

# Install UI components
npm install react-native-paper
npm install react-native-vector-icons

# Install animations
npm install react-native-reanimated react-native-gesture-handler

# Install utilities
npm install @react-native-async-storage/async-storage
npm install expo-haptics
npm install expo-notifications
```

### Step 3: Set Up Firebase

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Name it "Wittsy" or "Wittsy-App"
   - Disable Google Analytics (optional for now)
   - Click "Create Project"

2. **Add Web App:**
   - In Firebase Console, click the web icon `</>`
   - Register app with nickname "Wittsy Web"
   - Copy the Firebase config object

3. **Add iOS App (later):**
   - Click iOS icon in Firebase Console
   - Follow the setup wizard

4. **Add Android App (later):**
   - Click Android icon in Firebase Console
   - Follow the setup wizard

5. **Enable Services in Firebase:**
   - **Authentication:** Enable Email/Password, Google, Apple
   - **Firestore Database:** Create database in production mode
   - **Realtime Database:** Create database
   - **Cloud Storage:** Set up storage bucket
   - **Hosting:** Initialize hosting for web deployment

### Step 4: Configure Environment Variables

Create `.env` file in the root directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Note:** Add `.env` to `.gitignore` to keep credentials private!

### Step 5: Project Structure

The project structure is being created for you with these directories:

```
wittsy-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/      # Buttons, inputs, cards, etc.
│   │   ├── game/        # Game-specific components
│   │   ├── lobby/       # Lobby components
│   │   └── profile/     # Profile components
│   ├── screens/         # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── GameRoomScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/      # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── services/        # Firebase and API services
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   └── notifications.ts
│   ├── hooks/          # Custom React hooks
│   │   ├── useGameRoom.ts
│   │   ├── useLeaderboard.ts
│   │   └── useAuth.ts
│   ├── utils/          # Helper functions
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── context/        # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── GameContext.tsx
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   └── assets/         # Images, fonts, sounds
│       ├── images/
│       ├── sounds/
│       └── fonts/
├── App.tsx             # Root component
├── app.json           # Expo configuration
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── .env              # Environment variables
```

### Step 6: Run the Development Server

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios        # iOS simulator (Mac only)
npm run android    # Android emulator
npm run web        # Web browser
```

---

## Development Workflow

### Daily Development Commands

```bash
# Start the app
npm start

# Clear cache and restart (if issues)
npm start -- --clear

# Run tests
npm test

# Type check
npm run tsc

# Lint code
npm run lint
```

### Git Workflow

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Project setup"

# Create feature branch
git checkout -b feature/authentication
# Make changes, commit, push
```

---

## Firebase Security Rules

### Firestore Rules (Initial Setup)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.hostId == request.auth.uid ||
        request.auth.uid in resource.data.players
      );
    }
    
    // Prompts collection (read-only for users)
    match /prompts/{promptId} {
      allow read: if request.auth != null;
    }
  }
}
```

### Realtime Database Rules

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---

## Testing Your Setup

### 1. Test Firebase Connection
- Create a simple test component that reads from Firebase
- Verify authentication works
- Test writing to Firestore

### 2. Test Navigation
- Verify screen transitions work
- Test back button functionality

### 3. Test on Multiple Platforms
- Run on iOS simulator
- Run on Android emulator
- Test in web browser

---

## Troubleshooting

### Common Issues

**Issue: "Metro bundler not starting"**
```bash
# Clear cache and restart
npx expo start --clear
```

**Issue: "Firebase not initialized"**
- Check that `.env` file exists
- Verify all Firebase config values are correct
- Ensure `.env` variables start with `EXPO_PUBLIC_`

**Issue: "iOS build fails"**
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

**Issue: "Android build fails"**
- Check that `ANDROID_HOME` environment variable is set
- Verify Android SDK is installed
- Try cleaning: `cd android && ./gradlew clean && cd ..`

---

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Configure authentication
3. ✅ Create basic navigation
4. 🔄 Build authentication screens
5. 🔄 Implement game room logic
6. 🔄 Create UI components
7. 🔄 Add real-time features
8. 🔄 Test and iterate

---

## Useful Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Support

If you encounter issues, check:
1. This setup guide
2. Official documentation
3. Stack Overflow
4. GitHub issues for specific packages

**Happy coding! Let's build something amazing! 🚀**
