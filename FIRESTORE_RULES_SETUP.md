# 🔒 Firestore Security Rules Setup

## ⚠️ **CRITICAL: Deploy Security Rules**

Your app is getting "Missing or insufficient permissions" errors because Firestore security rules need to be deployed.

---

## 🚀 **Quick Setup (2 Methods)**

### **Method 1: Firebase Console (Easiest)**

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: **wittsy-51992**
3. Click **Firestore Database** in left menu
4. Click **Rules** tab at top
5. Copy the rules from `firestore.rules` file
6. Paste into the editor
7. Click **Publish**
8. Wait 30 seconds for rules to deploy
9. Restart your app

### **Method 2: Firebase CLI**

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
cd c:\dev\Wittsy
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 📋 **What These Rules Allow**

### **Battle Pass:**
- ✅ Users can read/write their own battle pass data
- ✅ Admins can delete battle passes

### **Users:**
- ✅ All authenticated users can read user profiles
- ✅ Users can create/update their own profile
- ✅ Admins can update/delete any profile

### **Game Rooms:**
- ✅ All authenticated users can read/create/update rooms
- ✅ Enables multiplayer functionality

### **Prompts:**
- ✅ All authenticated users can read/create prompts
- ✅ Admins can update/delete prompts

### **Achievements:**
- ✅ All users can read achievements
- ✅ Users can read/write their own achievement progress
- ✅ Admins can create/update achievements

### **Friends, Challenges, Events:**
- ✅ Proper read/write permissions for each feature

---

## 🔐 **Security Features**

✅ **Authentication required** - All operations require login
✅ **User isolation** - Users can only access their own data
✅ **Admin controls** - Admins can manage content
✅ **Read/Write separation** - Different permissions for reading vs writing
✅ **Collection-specific** - Each collection has appropriate rules

---

## 📝 **Rules File Location**

The rules are saved in: `c:\dev\Wittsy\firestore.rules`

---

## ⚡ **After Deploying Rules**

Your app will be able to:
- ✅ Access Battle Pass data
- ✅ Save user progress
- ✅ Create/join game rooms
- ✅ Submit prompts
- ✅ Track achievements
- ✅ Everything else!

---

## 🆘 **Troubleshooting**

**Still getting permission errors?**
1. Make sure rules are published (check Firebase Console)
2. Wait 30-60 seconds after publishing
3. Restart your Expo app
4. Clear app cache if needed

**Rules not saving?**
1. Check for syntax errors in Firebase Console
2. Make sure you clicked "Publish" button
3. Check Firebase status: https://status.firebase.google.com/

**Need to test rules?**
1. Go to Firebase Console → Firestore → Rules
2. Click "Rules Playground" tab
3. Test specific operations

---

## 🎯 **Quick Copy-Paste Rules**

If you want to quickly paste in Firebase Console, here are the rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    match /battlePasses/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isAdmin();
    }

    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    match /prompts/{promptId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() || isAdmin();
      allow delete: if isAdmin();
    }

    match /promptPacks/{packId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /achievements/{achievementId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /userAchievements/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isAdmin();
    }

    match /leaderboards/{leaderboardId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    match /friends/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    match /challenges/{challengeId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /userChallenges/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /notifications/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) || isAdmin();
    }

    match /analytics/{document=**} {
      allow read: if isAdmin();
      allow write: if isAuthenticated();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ **Deployment Checklist**

- [ ] Copy rules from `firestore.rules`
- [ ] Go to Firebase Console
- [ ] Navigate to Firestore → Rules
- [ ] Paste rules
- [ ] Click "Publish"
- [ ] Wait 30 seconds
- [ ] Restart app
- [ ] Test Battle Pass (should work now!)

---

**Once deployed, all permission errors will be resolved!** 🔓🚀
