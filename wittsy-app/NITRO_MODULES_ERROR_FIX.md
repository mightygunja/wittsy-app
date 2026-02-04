# NitroModules Error Fix - Expo Go

## 🔴 NEW ERROR:
```
ERROR: NitroModules are not supported in Expo Go! 
Use EAS (`expo prebuild`) or eject to a bare workflow instead.
```

## 🔍 ROOT CAUSE:

**react-native-iap** uses NitroModules (new React Native architecture) which is NOT supported in Expo Go.

The same issue as Google Sign-In - the module is imported at the top level:

```typescript
// src/services/monetization.ts line 7:
import * as RNIap from 'react-native-iap'; // ❌ Loads immediately
```

Even though we added conditional logic to skip IAP initialization on Expo Go, the import statement runs first.

## ✅ SOLUTION:

Use **dynamic imports** for react-native-iap, just like we did for Google Sign-In.

### Changes Needed:

**File: `src/services/monetization.ts`**

1. Remove top-level import
2. Add dynamic imports in all methods that use RNIap
3. Wrap in try-catch for graceful fallback

## 📝 IMPLEMENTATION:

### Before (BROKEN):
```typescript
import * as RNIap from 'react-native-iap';

async initialize() {
  await RNIap.initConnection();
  const products = await RNIap.fetchProducts({...});
}
```

### After (FIXED):
```typescript
// No top-level import

async initialize() {
  try {
    const RNIap = await import('react-native-iap');
    await RNIap.initConnection();
    const products = await RNIap.fetchProducts({...});
  } catch (error) {
    console.error('IAP not available:', error);
  }
}
```

## 🎯 AFFECTED METHODS:

All methods in MonetizationService that use RNIap:
1. `initialize()` - Already has isIAPAvailable check, add dynamic import
2. `handlePurchaseUpdate()` - Add dynamic import for finishTransaction
3. `purchaseCoins()` - Add dynamic import for requestPurchase
4. `purchaseBattlePass()` - Add dynamic import
5. `restorePurchases()` - Add dynamic import
6. `cleanup()` - Add dynamic import

## ✅ BENEFITS:

1. No NitroModules error on Expo Go
2. IAP works on TestFlight
3. Graceful degradation
4. App doesn't crash
