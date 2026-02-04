# Coin Counter Immediate Update - Final Fix

## 🔴 PROBLEM:
Coin counter doesn't update immediately when user claims daily reward.

## 🔍 ROOT CAUSE:

The CurrencyDisplay component uses a Firestore listener (onSnapshot) which should update automatically, BUT:

1. **Firestore propagation delay** - Takes time for write to propagate to listener
2. **Firebase permissions on Expo Go** - Listener might not work properly
3. **No immediate local update** - Relying 100% on Firestore listener

## ✅ SOLUTION:

**Add IMMEDIATE local state update in CurrencyDisplay when coins change, PLUS keep Firestore listener as backup.**

### Implementation:

1. **Create a context/event system** to notify CurrencyDisplay of coin changes
2. **OR** Pass coins as prop and update immediately
3. **OR** Use a global state manager (like Zustand/Context)

### Best Approach for Quick Fix:

**Add an event emitter or use React Context to immediately update coins locally, then let Firestore sync in background.**

## 🎯 IMPLEMENTATION:

Create a simple event system:
1. When daily reward claimed → Emit "coinsUpdated" event with new amount
2. CurrencyDisplay listens for event → Updates immediately
3. Firestore listener continues to work as backup/sync

This gives INSTANT UI feedback while maintaining data consistency.
