# 🚨 CRITICAL: Deploy Firestore Rules Immediately

## Issue
Daily rewards claiming is failing with permission error:
```
❌ Failed to initialize daily rewards: [FirebaseError: Missing or insufficient permissions.]
```

## What Changed
Added rules for `dailyRewards` collection to allow users to create and manage their own daily rewards documents.

## How to Deploy

### Option 1: Firebase Console (Recommended)
1. Go to https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste into the editor
6. Click **Publish**

### Option 2: Firebase CLI
```bash
firebase deploy --only firestore:rules
```

## New Rules Added
```
// Daily Rewards - users can read and write their own daily rewards
match /dailyRewards/{userId} {
  allow read: if isSignedIn() && isOwner(userId);
  allow create: if isSignedIn() && isOwner(userId);
  allow update: if isSignedIn() && isOwner(userId);
  allow delete: if false;
}
```

## After Deployment
User should reload the app and claim the daily reward. It will:
1. Initialize the daily rewards document
2. Grant the coins
3. Update the coin counter immediately

## Verification
After deploying, check the console logs when claiming:
```
✅ Daily rewards initialized during claim
💰 GRANTING X coins...
✅ GRANTED X coins
💰 CurrencyDisplay UPDATE: 100 → 150
```
