# Expo Go Error Analysis - RNGoogleSignin Module

## 🔴 ERROR:
```
ERROR [runtime not ready]: Invariant Violation: TurboModuleRegistry.getEnforcing(...): 
'RNGoogleSignin' could not be found. Verify that a module by this name is registered 
in the native binary.
```

## 🔍 ROOT CAUSE:

The error occurs because **the import statement loads the native module at module parse time**, BEFORE any conditional logic can run.

### Current Code (BROKEN on Expo Go):
```typescript
// src/services/auth.ts line 13:
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Later in code:
if (!isExpoGo()) {
  configureGoogleSignIn(); // Too late - module already imported!
}
```

**The Problem:**
- JavaScript imports are executed when the module is loaded
- The `GoogleSignin` import tries to access the native module immediately
- Expo Go doesn't have the native module compiled in
- Error thrown before any conditional logic runs

## 💡 SOLUTION:

Use **dynamic imports** to load the Google Sign-In module only when needed (on native builds).

### Fixed Code:
```typescript
// Don't import at top level
// import { GoogleSignin } from '@react-native-google-signin/google-signin'; ❌

// Instead, use dynamic import inside function:
export const configureGoogleSignIn = async () => {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({...});
  } catch (error) {
    console.error('Failed to configure Google Sign-In:', error);
  }
};
```

## 📝 FILES TO FIX:

1. **src/services/auth.ts**
   - Remove top-level import of GoogleSignin
   - Use dynamic import in configureGoogleSignIn()
   - Use dynamic import in signInWithGoogle()

2. **App.tsx**
   - Make configureGoogleSignIn async
   - Await the call

## ✅ BENEFITS:

1. **No module loading on Expo Go** - Import only happens on native builds
2. **No runtime errors** - Module not accessed if not available
3. **Same functionality** - Works exactly the same on TestFlight
4. **Graceful degradation** - Catches errors if module unavailable

## 🎯 IMPLEMENTATION:

### Before (BROKEN):
```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({...});
};

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  // ...
};
```

### After (FIXED):
```typescript
// No top-level import

export const configureGoogleSignIn = async () => {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({...});
  } catch (error) {
    console.error('Google Sign-In not available:', error);
  }
};

export const signInWithGoogle = async () => {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    // ...
  } catch (error) {
    throw new Error('Google Sign-In not available');
  }
};
```

## 🔄 EXECUTION FLOW:

### On Expo Go:
1. auth.ts loads - NO import of GoogleSignin ✅
2. App.tsx calls configureGoogleSignIn() - skipped (isExpoGo check)
3. User clicks Google Sign-In button - button is hidden ✅
4. No errors!

### On TestFlight:
1. auth.ts loads - NO import of GoogleSignin ✅
2. App.tsx calls configureGoogleSignIn() - dynamic import loads module ✅
3. User clicks Google Sign-In button - dynamic import loads module ✅
4. Works perfectly!

## 📊 COMPARISON:

| Approach | Expo Go | TestFlight | Issue |
|----------|---------|------------|-------|
| Top-level import | ❌ Crashes | ✅ Works | Module loaded at parse time |
| Conditional import | ❌ Still crashes | ✅ Works | Import happens before conditional |
| Dynamic import | ✅ Works | ✅ Works | Module loaded only when called |

## ✅ FINAL SOLUTION:

**Use dynamic imports for ALL native modules that aren't available in Expo Go:**
- Google Sign-In ✅
- In-App Purchases (already handled - RNIap imported but wrapped in try-catch)
- Any other native-only modules

This is the standard React Native pattern for optional native modules.
