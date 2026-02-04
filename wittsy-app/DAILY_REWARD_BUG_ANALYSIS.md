# Daily Reward Bug - Root Cause Analysis

## 🔴 PROBLEM:
User claims daily reward, navigates away, comes back → Modal appears again

## 🔍 ROOT CAUSE:

The Firebase permission error is causing `dailyRewardsService.canClaimToday()` to fail:
```
ERROR ❌ Failed to get daily rewards data: [FirebaseError: Missing or insufficient permissions.]
```

### Current Flow (BROKEN):
1. User opens HomeScreen
2. `checkDailyReward()` runs
3. Checks AsyncStorage - finds today's date ✅
4. Sets `dailyRewardClaimedThisSession = true` ✅
5. Returns early ✅
6. **BUT** when user navigates away and back:
7. `dailyRewardClaimedThisSession` is reset to `false` (component remounts)
8. Checks AsyncStorage - finds today's date ✅
9. Sets `dailyRewardClaimedThisSession = true` ✅
10. **THEN** calls `dailyRewardsService.canClaimToday(user.uid)` at line 143
11. **Firebase permission error** → Catch block at line 150
12. Error is caught and logged, but **modal might still show**

## 🐛 THE BUG:

**Line 143-149:**
```typescript
const status = await dailyRewardsService.canClaimToday(user.uid);
if (status.canClaim && !status.alreadyClaimed) {
  // Show modal after a short delay for better UX
  setTimeout(() => {
    setShowDailyReward(true);
  }, 1000);
}
```

**The problem:**
- Even though we check AsyncStorage first and return early if claimed
- The code STILL calls `dailyRewardsService.canClaimToday()` 
- When Firebase fails, it throws an error
- Error is caught, but the modal state might already be set

**Wait, looking closer:**
- Lines 137-141: If AsyncStorage has today's date, we RETURN early
- So line 143 should never be reached if already claimed today
- **BUT** the error logs show it IS being called!

## 🔍 DEEPER INVESTIGATION:

The error happens AFTER the AsyncStorage check returns. This means:
1. Either AsyncStorage isn't saving properly
2. Or the date comparison is failing
3. Or there's a race condition

**Most likely:** The `toDateString()` format might not be consistent or AsyncStorage save is failing.

## ✅ SOLUTION:

**Option 1: Don't call Firebase at all if AsyncStorage says claimed**
- Already implemented, but need to verify it's working

**Option 2: Use a more reliable date format**
- Use ISO date string (YYYY-MM-DD) instead of `toDateString()`
- `toDateString()` returns "Mon Feb 03 2026" which is locale-dependent

**Option 3: Add error handling to prevent modal from showing on error**
- Wrap the Firebase call in try-catch
- On error, assume already claimed

## 🎯 BEST FIX:

Use ISO date format (YYYY-MM-DD) for consistency with dailyRewardsService.
