# App Renaming Summary: Wittsy → Wittz

## ✅ Completed Changes

### 1. Package Configuration
- **package.json**
  - Name: `wittsy-app` → `wittz-app`
  - Description: Updated to "Wittz"

### 2. Product IDs (RevenueCat/IAP)
- **iOS Products**: `com.wittsy.*` → `com.wittz.*`
  - `com.wittz.coins.500`
  - `com.wittz.coins.1500`
  - `com.wittz.coins.3000`
  - `com.wittz.coins.10000`
  - `com.wittz.premium.10`
  - `com.wittz.premium.50`
  - `com.wittz.premium.100`
  - `com.wittz.premium.500`
  - `com.wittz.premium.monthly`
  - `com.wittz.premium.yearly`

### 3. Code References
- **App Name**: `APP_NAME = 'Wittz'` (utils/constants.ts)
- **Storage Keys**:
  - `@wittsy_settings` → `@wittz_settings`
  - `@wittsy_experiments` → `@wittz_experiments`
- **Deep Links**:
  - `wittsy://` → `wittz://`
  - `wittsy-dev://` → `wittz-dev://`
  - `https://wittsy.app` → `https://wittz.app`

### 4. UI Text Updates
- **HomeScreen**: "WITTSY" → "WITTZ"
- **LoginScreen**: "🎮 Wittsy" → "🎮 Wittz"
- **RegisterScreen**: "🎮 Wittsy" → "🎮 Wittz"
- **SettingsScreen**: "WITTSY v1.0.0" → "WITTZ v1.0.0"
- **AccessibilityScreen**: Updated help text
- **PrivacyScreen**: Updated legal URLs

### 5. Documentation
- **README.md**: All references updated
- **REVENUECAT_SETUP.md**: All references updated
- **IAP_INTEGRATION_SUMMARY.md**: All references updated

### 6. Season Descriptions
- Updated season descriptions from "WITTSY" to "WITTZ"

## ⚠️ Manual Steps Required

### 1. Firebase Project
**Current**: `wittsy-51992.cloudfunctions.net`
**Action Needed**: 
- Create new Firebase project with "wittz" name
- Update Firebase config in `.env`
- Deploy Cloud Functions to new project
- Update function URL in `GameRoomScreen.tsx` (line 41)

### 2. App Store / Google Play
**Bundle IDs to Update**:
- iOS: `com.wittz.app` (or your chosen bundle ID)
- Android: `com.wittz.app` (or your chosen package name)

**Action Needed**:
- Create new app listings with "Wittz" name
- Update bundle IDs in Expo configuration
- Create new provisioning profiles (iOS)
- Update signing certificates

### 3. RevenueCat Configuration
**Action Needed**:
- Create new RevenueCat project for "Wittz"
- Create all products with new `com.wittz.*` IDs
- Update API keys in `.env`:
  ```
  EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx
  ```

### 4. Domain & URLs
**Current References**: `wittz.app`
**Action Needed**:
- Purchase domain (wittz.app, wittz.io, or alternative)
- Set up hosting for legal pages:
  - `https://wittz.app/privacy`
  - `https://wittz.app/terms`
  - `https://wittz.app/cookies`
- Configure deep linking

### 5. Expo Configuration
**Action Needed**:
- Create/update `app.json` or `app.config.js` with:
  ```json
  {
    "expo": {
      "name": "Wittz",
      "slug": "wittz",
      "scheme": "wittz",
      "ios": {
        "bundleIdentifier": "com.wittz.app"
      },
      "android": {
        "package": "com.wittz.app"
      }
    }
  }
  ```

### 6. Social Media & Branding
**Action Needed**:
- Register social media handles (@wittz)
- Update app icons/splash screens
- Update marketing materials
- Update screenshots for stores

## 🔄 Migration Checklist

- [ ] Create new Firebase project
- [ ] Update Firebase config in `.env`
- [ ] Deploy Cloud Functions
- [ ] Update function URLs in code
- [ ] Create Expo app configuration
- [ ] Update bundle IDs
- [ ] Create new app store listings
- [ ] Set up RevenueCat with new products
- [ ] Purchase/configure domain
- [ ] Set up legal pages
- [ ] Test deep linking
- [ ] Update app icons
- [ ] Test IAP with new product IDs
- [ ] Update marketing materials

## 📝 Notes

### Backward Compatibility
- Old storage keys (`@wittsy_*`) will NOT migrate automatically
- Users will need to log in again
- Settings will reset to defaults
- Consider adding migration logic if needed

### Testing
- Test all IAP products with new IDs
- Verify deep links work
- Test Firebase Cloud Functions
- Verify all UI text displays correctly

### Deployment
- Update CI/CD pipelines with new bundle IDs
- Update environment variables in deployment
- Test on both iOS and Android before release

## 🎯 Recommended Next Steps

1. **Create Expo configuration** (`app.json`)
2. **Set up new Firebase project**
3. **Configure RevenueCat** with new products
4. **Test locally** with new configuration
5. **Deploy to TestFlight/Internal Testing**
6. **Full QA pass** before production

---

**Status**: ✅ Code renaming complete, configuration updates needed
**Last Updated**: December 26, 2025
