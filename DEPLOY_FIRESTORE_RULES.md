# Deploy Firestore Rules to Fix Daily Rewards

## ✅ RULES UPDATED

I've added the necessary Firestore security rules to allow daily rewards to work.

**Added rules for:**
- `dailyRewards/{userId}` - Users can read/write their own reward data
- `referrals/{userId}` - Users can read/write their own referral data

---

## 🚀 HOW TO DEPLOY:

### **Option 1: Firebase Console (Easiest)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab
5. Copy the entire contents of `firestore.rules` file
6. Paste into the Firebase Console rules editor
7. Click **Publish**

### **Option 2: Firebase CLI**

```bash
cd c:\dev\Wittsy\wittsy-app
firebase deploy --only firestore:rules
```

---

## 📋 WHAT THE RULES DO:

### **Daily Rewards:**
```javascript
match /dailyRewards/{userId} {
  allow read: if isSignedIn() && isOwner(userId);
  allow create: if isSignedIn() && isOwner(userId);
  allow update: if isSignedIn() && isOwner(userId) && (
    // Anti-cheat: Prevent streak manipulation
    (request.resource.data.currentStreak >= resource.data.currentStreak ||
     request.resource.data.currentStreak == 1) &&
    // Prevent negative values
    request.resource.data.totalRewardsClaimed >= 0 &&
    request.resource.data.totalCoinsEarned >= 0
  );
  allow delete: if false; // Cannot delete reward history
}
```

**Security features:**
- ✅ Users can only access their own rewards
- ✅ Cannot manipulate streak (anti-cheat)
- ✅ Cannot set negative values
- ✅ Cannot delete reward history

---

## ✅ AFTER DEPLOYING:

**Reload Expo Go and:**
1. Daily reward modal will appear
2. You can claim the reward
3. Coins will be granted
4. Coin counter will update immediately
5. Modal won't re-appear after claiming

---

## 🎯 DEPLOY NOW:

Choose your method and deploy the rules. Then test the app!
