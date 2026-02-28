# Daily Reward Modal - Deep Debug Analysis

## 🔴 CRITICAL ISSUE:
Modal keeps appearing even after claiming and navigating away.

## 🔍 ROOT CAUSE ANALYSIS:

### Problem 1: useFocusEffect Dependency
```typescript
useFocusEffect(
  useCallback(() => {
    loadActiveRooms();
    checkDailyReward(); // ← Called EVERY time screen focuses
    // ...
  }, [selectedRoomType]) // ← Only depends on selectedRoomType
);
```

**Issue:** `checkDailyReward()` is called every time the screen focuses, but the callback doesn't depend on `dailyRewardClaimedThisSession`. This means even if we set the flag, the callback is using a stale closure.

### Problem 2: State Reset on Navigation
When you navigate away and back:
1. Component unmounts (state lost)
2. Component remounts (state reset to initial values)
3. `dailyRewardClaimedThisSession` = false again
4. `useFocusEffect` runs
5. `checkDailyReward()` is called with OLD closure that has `dailyRewardClaimedThisSession = false`

### Problem 3: AsyncStorage Race Condition
The check happens like this:
1. Read from AsyncStorage (async)
2. While waiting, component might re-render
3. Multiple checks might run simultaneously
4. Modal might show before AsyncStorage read completes

## ✅ SOLUTION:

**Use a ref to track if modal has been shown this session:**
- Refs persist across re-renders
- Refs don't cause re-renders when updated
- Refs are perfect for "has this happened" flags

**Add the ref to useFocusEffect dependencies:**
- Ensure callback uses latest state

**Add defensive check before showing modal:**
- Never show if already shown this session
- Never show if AsyncStorage says claimed today
