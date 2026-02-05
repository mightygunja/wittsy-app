# Facebook Sign-In Setup Guide

## Step 1: Create Facebook App

1. **Go to Facebook Developers:**
   - URL: https://developers.facebook.com/apps
   - Log in with your Facebook account

2. **Create New App:**
   - Click **"Create App"**
   - Select **"Consumer"** as app type
   - Click **"Next"**

3. **App Details:**
   - **App Name:** `Wittz`
   - **App Contact Email:** Your email
   - Click **"Create App"**

---

## Step 2: Configure Facebook Login

1. **Add Facebook Login Product:**
   - In your app dashboard, find **"Add Products"**
   - Find **"Facebook Login"** and click **"Set Up"**

2. **Select Platform:**
   - Choose **iOS**
   - Click **"Next"**

3. **Configure iOS Settings:**
   - **Bundle ID:** `com.wittsy.app`
   - **Enable Single Sign On:** Yes
   - Click **"Save"**

---

## Step 3: Get Your App ID

1. **Go to Settings > Basic:**
   - Find **"App ID"** at the top
   - Copy this ID (looks like: `1234567890123456`)
   - Also copy **"App Secret"** (you'll need this for Firebase)

---

## Step 4: Configure Firebase

1. **Go to Firebase Console:**
   - URL: https://console.firebase.google.com/project/wittsy-51992/authentication/providers

2. **Enable Facebook Sign-In:**
   - Click **"Facebook"** in the Sign-in providers list
   - Toggle **"Enable"**
   - Paste your **App ID**
   - Paste your **App Secret**
   - Copy the **OAuth redirect URI** shown (looks like: `https://wittsy-51992.firebaseapp.com/__/auth/handler`)
   - Click **"Save"**

3. **Add OAuth Redirect URI to Facebook:**
   - Go back to Facebook App Dashboard
   - Go to **Facebook Login > Settings**
   - In **"Valid OAuth Redirect URIs"**, paste the Firebase redirect URI
   - Click **"Save Changes"**

---

## Step 5: Update Wittz App Configuration

Once you have your Facebook App ID, send it to me and I'll:

1. Add it to `app.json`:
   ```json
   "facebookScheme": "fb1234567890123456",
   "facebookAppId": "1234567890123456",
   "facebookDisplayName": "Wittz"
   ```

2. Implement Facebook Sign-In in `auth.ts`:
   ```typescript
   // Full implementation with expo-auth-session
   ```

3. Add Facebook button to WelcomeScreen

---

## Step 6: Test

After configuration:
1. Build new TestFlight
2. Test Facebook Sign-In on device
3. Verify user profile creation in Firebase

---

## What I Need From You

**Send me your Facebook App ID** (the 16-digit number) and I'll complete the implementation.

Example: `1234567890123456`
