# Firestore Security Rules Update Required

## Issue
Season history cannot be read due to missing Firestore permissions.

Error: `[FirebaseError: Missing or insufficient permissions.]`

## Solution
Add the following rules to your Firestore Security Rules in Firebase Console.

## Where to Update
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Add the rules below

## Rules to Add

### Option 1: Specific Season History Rule
Add this inside your existing `match /databases/{database}/documents` block:

```javascript
match /users/{userId}/seasonHistory/{seasonId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### Option 2: Allow All User Subcollections (Recommended)
If you want to allow users to read all their subcollections:

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  // Allow reading all subcollections under user
  match /{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

## Complete Example Rules File

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow all subcollections (seasonHistory, matchHistory, etc.)
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Seasons collection (admin only for write, public read)
    match /seasons/{seasonId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Restrict to admin in production
    }
  }
}
```

## After Updating
1. Click **Publish** in Firebase Console
2. Wait 30-60 seconds for rules to propagate
3. Reload your app
4. Season history should now load without errors

## Verification
Check the logs - you should no longer see:
```
ERROR ❌ Error fetching season history: [FirebaseError: Missing or insufficient permissions.]
```
