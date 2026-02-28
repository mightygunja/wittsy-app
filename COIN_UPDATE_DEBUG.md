# Coin Counter Update Issue - Debug Summary

## Problem
Coin counter in top-right doesn't update immediately after claiming daily reward.

## What We Know (from console logs)
```
💰 CurrencyDisplay UPDATE: 0 → 100
```
This proves:
- ✅ Firestore IS updating correctly
- ✅ onSnapshot listener IS firing
- ✅ setCoins(100) IS being called
- ❌ UI is NOT reflecting the change

## What We've Tried
1. ❌ Adding 500ms delay before refresh
2. ❌ Using key prop on Text component
3. ❌ Using key prop on TouchableOpacity
4. ❌ Adding renderKey state to force re-render
5. ❌ Wrapping in extra View
6. ❌ Using String(coins) instead of coins.toLocaleString()

## Next Steps to Debug
1. Check if `🎨 RENDERING CurrencyDisplay with coins: X` appears in console
   - If YES: React IS re-rendering but UI not updating (React Native bug?)
   - If NO: React is NOT re-rendering (parent component issue?)

2. If rendering but not updating:
   - Try Animated.Text instead of Text
   - Try TextInput with editable=false
   - Check if there's a style issue hiding the update

3. If not rendering at all:
   - Check if HomeScreen is memoized
   - Check if CurrencyDisplay is wrapped in React.memo
   - Force parent to re-render when coins change

## User Should See in Console After Claiming Reward
```
💰 GRANTING X coins to user...
✅ GRANTED X coins - Firestore updated
💰 CurrencyDisplay UPDATE: 0 → X
🎨 RENDERING CurrencyDisplay with coins: X
```

If `🎨 RENDERING` doesn't appear, the component is NOT re-rendering despite state change.
