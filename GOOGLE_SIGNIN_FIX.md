# Google Sign-In TestFlight Fix

## Problem
Google Sign-In was failing on TestFlight builds with authentication errors.

## Root Cause
The iOS app was missing the required **URL scheme** for Google Sign-In OAuth callback. This URL scheme is CRITICAL for Google to redirect back to your app after authentication.

## Solution Applied

### 1. Added URL Scheme to app.json
Added the **REVERSED_CLIENT_ID** URL scheme to `ios.infoPlist.CFBundleURLTypes`:

```json
"CFBundleURLTypes": [
  {
    "CFBundleURLSchemes": [
      "com.googleusercontent.apps.757129696124-cildtmm00qi49redkpq5jtkvdaua02at"
    ]
  }
]
```

This URL scheme is derived from your iOS Client ID by reversing it:
- **iOS Client ID**: `757129696124-cildtmm00qi49redkpq5jtkvdaua02at.apps.googleusercontent.com`
- **URL Scheme**: `com.googleusercontent.apps.757129696124-cildtmm00qi49redkpq5jtkvdaua02at`

### 2. Incremented Build Number
Updated `buildNumber` from `3` to `4` for the new TestFlight build.

## Next Steps

### Build and Submit to TestFlight:

```bash
# 1. Create production build
eas build --platform ios --profile production

# 2. Wait for build to complete (check status at expo.dev)

# 3. Submit to TestFlight
eas submit --platform ios --latest
```

### Verify in Firebase Console:

1. Go to Firebase Console → Authentication → Sign-in method → Google
2. Verify these OAuth redirect URIs are listed:
   - `com.wittsy.app:/oauth2redirect`
   - `com.googleusercontent.apps.757129696124-cildtmm00qi49redkpq5jtkvdaua02at:/oauth2redirect`

If not listed, add them manually.

## Testing

After the new build is on TestFlight:

1. Install the TestFlight build
2. Tap "Sign In with Google"
3. Select a Google account
4. Should successfully redirect back to the app and complete sign-in

## Technical Details

**Why This Was Needed:**

Google Sign-In on iOS uses a **custom URL scheme** to handle OAuth callbacks. When you authenticate with Google:

1. App opens Safari/Google Sign-In page
2. User authenticates
3. Google redirects to: `YOUR_REVERSED_CLIENT_ID:/oauth2redirect`
4. iOS uses the URL scheme to open your app
5. App receives the auth token and completes sign-in

Without the URL scheme registered in `Info.plist`, iOS doesn't know to open your app, and the authentication fails.

**Configuration Summary:**

- **Web Client ID**: `757129696124-0idv372oukrados213f4cuok31fvce4l.apps.googleusercontent.com`
- **iOS Client ID**: `757129696124-cildtmm00qi49redkpq5jtkvdaua02at.apps.googleusercontent.com`
- **URL Scheme**: `com.googleusercontent.apps.757129696124-cildtmm00qi49redkpq5jtkvdaua02at`
- **Bundle ID**: `com.wittsy.app`
