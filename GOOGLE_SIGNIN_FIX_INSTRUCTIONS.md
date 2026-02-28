# Google Sign-In Fix Instructions

## Current Issue
Google Sign-In is crashing because the OAuth client IDs in `src/services/auth.ts` are incorrect. They're using the EAS project ID instead of actual Google OAuth client IDs.

## What I Need From You

### Option 1: Get Client IDs from Firebase Console (Recommended)

1. **Go to Firebase Console:**
   - URL: https://console.firebase.google.com/project/wittsy-51992/authentication/providers
   
2. **Get Web Client ID:**
   - Click on **Google** provider in the Sign-in method tab
   - Look for **Web SDK configuration** section
   - Copy the **Web client ID** (looks like: `757129696124-xxxxxxxxxxxxx.apps.googleusercontent.com`)

3. **Get iOS Client ID:**
   - Go to: https://console.firebase.google.com/project/wittsy-51992/settings/general/ios:com.wittsy.app
   - Scroll down to find **OAuth 2.0 Client ID**
   - Copy the iOS client ID (looks like: `757129696124-yyyyyyyyyyyy.apps.googleusercontent.com`)

### Option 2: Use Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials?project=wittsy-51992
2. Look for OAuth 2.0 Client IDs
3. Find:
   - **Web client** (for webClientId)
   - **iOS client** (for iosClientId)
4. Copy both client IDs

## What to Send Me

Send me these two values:
```
Web Client ID: 757129696124-xxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
iOS Client ID: 757129696124-yyyyyyyyyyyyyyyyyyyyyy.apps.googleusercontent.com
```

## What I'll Fix

Once you provide the client IDs, I will:

1. **Update `src/services/auth.ts`:**
   ```typescript
   GoogleSignin.configure({
     webClientId: 'YOUR_CORRECT_WEB_CLIENT_ID',
     iosClientId: 'YOUR_CORRECT_IOS_CLIENT_ID',
     offlineAccess: true,
   });
   ```

2. **Add Google Sign-In plugin to `app.json`:**
   ```json
   "@react-native-google-signin/google-signin"
   ```

3. **Update URL schemes if needed**

4. **Build new TestFlight**

## Why This is Crashing

The current code uses:
- `webClientId: '1836a769-48db-4dc3-bffb-6487530c5daa.apps.googleusercontent.com'`
- `iosClientId: 'com.googleusercontent.apps.1836a769-48db-4dc3-bffb-6487530c5daa'`

These are NOT valid Google OAuth client IDs - they're your EAS project ID. Google Sign-In SDK throws an NSException when it can't validate these IDs.

## From Your Crash Log

```
"exception" : {"codes":"0x0000000000000000, 0x0000000000000000","rawCodes":[0,0],"type":"EXC_CRASH","signal":"SIGABRT"}
"asi" : {"libsystem_c.dylib":["abort() called"]}
"lastExceptionBacktrace" : [{"imageOffset":1155612,"symbol":"__exceptionPreprocess"...
```

This shows an NSException being raised, which is exactly what happens when Google Sign-In SDK gets invalid credentials.

---

**Please provide the two client IDs from Firebase Console and I'll fix this immediately.**
