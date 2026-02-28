# Expo Go Incompatible Features Analysis

## 🔍 IDENTIFIED INCOMPATIBLE FEATURES:

### 1. ✅ Google Sign-In (@react-native-google-signin/google-signin)
**Status:** ALREADY FIXED
- Requires native build
- Conditionally disabled on Expo Go
- Shows info message instead

### 2. ⚠️ In-App Purchases (react-native-iap)
**Status:** NEEDS FIX
- Used in: `src/services/monetization.ts`
- Used in: `src/screens/CoinShopScreen.tsx`
- Requires native build for App Store/Play Store IAP
- **Action:** Disable Coin Shop on Expo Go

### 3. ⚠️ Push Notifications (expo-notifications)
**Status:** NEEDS REVIEW
- Used in: `src/services/notifications.ts`
- Used in: `src/services/pushNotificationService.ts`
- **Expo Go Support:** ✅ SUPPORTED (with limitations)
- Can test basic notifications on Expo Go
- **Action:** Keep enabled, but add error handling

### 4. ⚠️ Store Review (expo-store-review)
**Status:** NEEDS FIX
- Used in: `src/services/reviewPromptService.ts`
- Requires native build to show App Store review prompt
- **Action:** Disable review prompts on Expo Go

### 5. ✅ Audio (expo-av)
**Status:** SHOULD WORK
- Expo Go supports expo-av
- **Action:** Keep enabled

### 6. ✅ Haptics (expo-haptics)
**Status:** SHOULD WORK
- Expo Go supports expo-haptics
- **Action:** Keep enabled

### 7. ✅ Firebase
**Status:** SHOULD WORK
- Expo Go supports Firebase
- **Action:** Keep enabled

---

## 🎯 FEATURES TO DISABLE ON EXPO GO:

1. **Coin Shop / In-App Purchases**
   - Hide Coin Shop navigation button
   - Show "Not available on Expo Go" message if accessed

2. **Store Review Prompts**
   - Skip review prompts on Expo Go
   - Only show on native builds

---

## ✅ FEATURES THAT WORK ON EXPO GO:

1. Email/Password Authentication
2. Guest Mode
3. Game functionality
4. QuickPlay matchmaking
5. Room creation
6. Daily rewards
7. Settings
8. Profile
9. Leaderboards
10. Battle Pass (UI only, no purchases)
11. Challenges
12. Audio
13. Haptics
14. Push Notifications (basic)
15. Firebase/Firestore

---

## 📝 IMPLEMENTATION PLAN:

### Phase 1: Disable Coin Shop
- Add conditional to hide Coin Shop button in HomeScreen
- Add conditional to CoinShopScreen to show "Not available" message
- Prevent navigation to Coin Shop on Expo Go

### Phase 2: Disable Store Review
- Add conditional in reviewPromptService to skip on Expo Go
- Prevent review prompts from showing

### Phase 3: Add Error Handling for IAP
- Wrap all IAP calls in try-catch
- Check if running on Expo Go before IAP operations
- Show user-friendly messages

---

## 🧪 TESTING STRATEGY:

1. Test on Expo Go with all features disabled
2. Verify no crashes from IAP or review prompts
3. Verify all other features work correctly
4. Build to TestFlight and verify all features enabled
