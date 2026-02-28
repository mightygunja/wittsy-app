# Coin Counter Not Updating - Root Cause Analysis

## 🔴 PROBLEM:
User claims daily reward, but coin counter doesn't update in real-time on HomeScreen.

## 🔍 INVESTIGATION:

### CurrencyDisplay Component (Line 27-39):
```typescript
const userRef = doc(firestore, 'users', user.uid);
const unsubscribe = onSnapshot(userRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.data();
    setCoins(data?.stats?.coins || 0);  // ← Reading from stats.coins
  }
  setLoading(false);
});
```

**The component uses a real-time Firestore listener** - it SHOULD update automatically when coins change.

### HomeScreen handleDailyRewardClaimed (Line 205-208):
```typescript
// Refresh user profile to update coin balance in real-time
if (refreshUserProfile) {
  await refreshUserProfile();
}
```

**Already calling refreshUserProfile()** - this should trigger updates.

## 🐛 POTENTIAL ISSUES:

### Issue 1: Wrong Firestore Path
The CurrencyDisplay reads from `data?.stats?.coins` but the coins might be stored at `data?.coins` instead.

### Issue 2: Daily Reward Service Updates Wrong Field
Need to check where dailyRewardsService.claimDailyReward() writes the coins.

### Issue 3: Firestore Listener Not Triggering
The onSnapshot listener might not be triggering due to:
- Firebase permissions (same issue as daily rewards)
- Coins being written to wrong path
- Listener not set up correctly

## ✅ SOLUTION:

1. Check where coins are actually stored in Firestore
2. Verify dailyRewardsService grants coins to correct path
3. Ensure CurrencyDisplay reads from correct path
4. Add fallback to force refresh if listener doesn't work
