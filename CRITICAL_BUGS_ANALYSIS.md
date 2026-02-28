# Critical Bugs Analysis - TestFlight Issues

## 🔴 ISSUE 1: QuickPlay "Room Not Found" Error
**Status:** INVESTIGATING
**Severity:** CRITICAL

### Problem:
- User clicks QuickPlay when no rooms exist
- Gets "Room not found" error
- Cannot join room, forced to exit

### Code Analysis:
**File:** `src/screens/QuickPlayScreen.tsx` (lines 113-181)
- ✅ Has auto-create logic at lines 150-162
- ✅ Calls `createRankedRoom()` when no room found
- ✅ Then calls `joinRoom()` to join the created room

**File:** `src/services/matchmaking.ts` (lines 103-161)
- ✅ `createRankedRoom()` creates room with proper settings
- ✅ Returns roomId successfully

**File:** `src/services/database.ts` (lines 142-229)
- ⚠️ `joinRoom()` throws "Room not found" error at line 153
- **ROOT CAUSE:** Race condition - room created but not yet available in Firestore when joinRoom is called

### Solution:
Add retry logic or delay after room creation before joining.

---

## 🔴 ISSUE 2: Daily Reward Modal Keeps Re-Appearing
**Status:** FIX APPLIED BUT NOT WORKING
**Severity:** HIGH

### Problem:
- User claims daily reward
- Navigates away from HomeScreen
- Returns to HomeScreen
- Modal appears again

### Code Analysis:
**File:** `src/screens/HomeScreen.tsx`
- ✅ Line 39: `dailyRewardClaimedThisSession` state added
- ✅ Lines 126-129: Check added to skip if already claimed
- ✅ Line 146: Flag set when reward claimed

**BUT:** State is lost when component unmounts!

### Root Cause:
React state is reset when navigating away. Need persistent storage.

### Solution:
Use AsyncStorage or add timestamp check in dailyRewardsService.

---

## 🔴 ISSUE 3: Google Sign-In Crashes
**Status:** INVESTIGATING
**Severity:** CRITICAL

### Problem:
- User clicks "Sign In with Google" button
- App crashes

### Code Analysis:
**File:** `src/screens/WelcomeScreen.tsx` (lines 154-169)
- Button calls `signInWithGoogle()` with try-catch
- Should show error alert, not crash

**File:** `src/services/auth.ts` (lines 209-274)
- Uses `@react-native-google-signin/google-signin`
- Proper error handling present

### Possible Causes:
1. Google Sign-In not configured in App.tsx
2. Missing GoogleService-Info.plist or google-services.json
3. WebClientId incorrect
4. Package not properly installed

### Solution:
1. Verify Google Sign-In configuration called on app startup
2. Check if package is in dependencies
3. Add better error logging

---

## 🔴 ISSUE 4: Settings Navigation Crashes
**Status:** INVESTIGATING
**Severity:** HIGH

### Problem:
- User clicks any button in Settings
- App crashes

### Code Analysis:
**File:** `src/screens/SettingsScreen.tsx` (lines 19-41)
- All buttons navigate to 'EnhancedSettings'

**File:** `src/navigation/MainNavigator.tsx`
- ✅ Line 127-129: EnhancedSettings route exists
- ✅ All sub-routes exist (ThemeSettings, AudioSettings, etc.)

### Possible Causes:
1. EnhancedSettingsScreen has runtime error
2. Missing dependencies in EnhancedSettingsScreen
3. Context provider not wrapping navigation

### Solution:
Check EnhancedSettingsScreen for errors, verify all imports exist.

---

## 🎯 FIX PRIORITY:

1. **QuickPlay room creation** - Add retry/delay logic
2. **Daily reward persistence** - Use AsyncStorage
3. **Google Sign-In crash** - Verify configuration
4. **Settings crash** - Debug EnhancedSettingsScreen

---

## 📝 NEXT STEPS:

1. Fix QuickPlay race condition with retry logic
2. Add AsyncStorage to daily reward check
3. Wrap Google Sign-In in better error boundary
4. Add error logging to Settings navigation
5. Test all fixes locally before pushing
