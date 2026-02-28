# Fix Google Sign-In Native Module Error

## Error:
```
TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found
```

## Root Cause:
The Google Sign-In native module needs to be properly linked in the iOS native project. This happens when:
1. New native dependencies are added
2. Native modules aren't properly installed
3. Pods need to be reinstalled

## Solution:

### Option 1: Rebuild iOS (Recommended)

```bash
cd wittsy-app

# Clean and rebuild
npx expo prebuild --clean

# When prompted "Continue with uncommitted changes?", type: Y

# Then rebuild iOS
npx expo run:ios
```

### Option 2: Manual Pod Install (If Option 1 doesn't work)

```bash
cd wittsy-app/ios

# Remove existing pods
rm -rf Pods
rm Podfile.lock

# Reinstall
pod install

# Go back and run
cd ..
npx expo run:ios
```

### Option 3: Clean Everything (Nuclear option)

```bash
cd wittsy-app

# Remove all native folders
rm -rf ios android

# Remove node modules
rm -rf node_modules

# Reinstall everything
npm install

# Rebuild native projects
npx expo prebuild

# Run iOS
npx expo run:ios
```

## Why This Happens:

When you run `npx expo start` (Expo Go), it uses the Expo Go app which has a limited set of native modules. Google Sign-In is NOT included in Expo Go.

You MUST use development builds:
- `npx expo run:ios` (creates development build with all native modules)
- `npx expo run:android` (same for Android)

## Important Notes:

1. **Never use `npx expo start` for testing Google Sign-In** - it won't work
2. **Always use `npx expo run:ios`** for development with native modules
3. **Commit your changes** before running prebuild (or accept uncommitted changes)
4. **This takes 5-10 minutes** the first time (compiling native code)

## Quick Fix Now:

```bash
# Stop the current server (Ctrl+C if running)

# Run this command and type Y when prompted:
npx expo prebuild --clean

# Then run:
npx expo run:ios
```

That's it! The app will build with Google Sign-In properly linked.
