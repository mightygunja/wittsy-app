# App Store Connect In-App Purchase Setup Guide

## Required IAP Products for Wittz App

You need to create the following products in App Store Connect for all in-app purchases to work properly.

---

## 1. Coin Packages (Consumable)

These are the main monetization products. Users purchase coins to spend in the app.

### Product 1: Coin Pouch
- **Product ID:** `com.wittz.coins.500`
- **Type:** Consumable
- **Price:** $0.99 USD
- **Display Name:** Coin Pouch
- **Description:** 500 coins to spend in Wittz

### Product 2: Coin Bag
- **Product ID:** `com.wittz.coins.1500`
- **Type:** Consumable
- **Price:** $2.99 USD
- **Display Name:** Coin Bag
- **Description:** 1,500 coins to spend in Wittz

### Product 3: Coin Chest
- **Product ID:** `com.wittz.coins.3000`
- **Type:** Consumable
- **Price:** $4.99 USD
- **Display Name:** Coin Chest
- **Description:** 3,000 coins to spend in Wittz

### Product 4: Coin Vault
- **Product ID:** `com.wittz.coins.10000`
- **Type:** Consumable
- **Price:** $14.99 USD
- **Display Name:** Coin Vault
- **Description:** 10,000 coins to spend in Wittz

---

## 2. Battle Pass Premium (Non-Consumable or Auto-Renewable Subscription)

Users can upgrade their battle pass to unlock premium rewards.

### Option A: One-Time Purchase (Non-Consumable)
- **Product ID:** `com.wittz.battlepass.premium`
- **Type:** Non-Consumable
- **Price:** $4.99 USD
- **Display Name:** Battle Pass Premium
- **Description:** Unlock all premium rewards for this season

### Option B: Subscription (Auto-Renewable)
If you want battle pass to be a recurring subscription:
- **Product ID:** `com.wittz.battlepass.premium.monthly`
- **Type:** Auto-Renewable Subscription
- **Price:** $4.99 USD per month
- **Display Name:** Battle Pass Premium Monthly
- **Description:** Access premium rewards every season

**Recommendation:** Use Option A (Non-Consumable) for a per-season purchase model.

---

## 3. Battle Pass Level Skips (Consumable)

Users can purchase level skips to progress faster in the battle pass.

### Product 5: 1 Level Skip
- **Product ID:** `com.wittz.battlepass.skip.1`
- **Type:** Consumable
- **Price:** $0.99 USD
- **Display Name:** 1 Level Skip
- **Description:** Skip 1 battle pass level instantly

### Product 6: 5 Level Skip
- **Product ID:** `com.wittz.battlepass.skip.5`
- **Type:** Consumable
- **Price:** $3.99 USD
- **Display Name:** 5 Level Skip
- **Description:** Skip 5 battle pass levels instantly

### Product 7: 10 Level Skip
- **Product ID:** `com.wittz.battlepass.skip.10`
- **Type:** Consumable
- **Price:** $6.99 USD
- **Display Name:** 10 Level Skip
- **Description:** Skip 10 battle pass levels instantly

### Product 8: 25 Level Skip
- **Product ID:** `com.wittz.battlepass.skip.25`
- **Type:** Consumable
- **Price:** $14.99 USD
- **Display Name:** 25 Level Skip
- **Description:** Skip 25 battle pass levels instantly

---

## How to Create Products in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app (Wittz - com.wittsy.app)
3. Navigate to **Features** → **In-App Purchases**
4. Click the **"+"** button to add a new product
5. Select the product type (Consumable, Non-Consumable, or Auto-Renewable Subscription)
6. Enter the **Product ID** exactly as shown above
7. Set the **Reference Name** (internal use only)
8. Add **Display Name** and **Description** for each localization
9. Set the **Price** in USD (Apple will auto-convert to other currencies)
10. Add a **Screenshot** for review (can be a simple graphic)
11. Add **Review Notes** if needed
12. Click **Save**
13. Submit for review

---

## Important Notes

### Avatar Shop Items - NO IAP NEEDED
**Avatar shop items (skins, hairstyles, accessories) do NOT need App Store Connect products.**

These are virtual items purchased with in-game coins:
- Users buy coins via IAP (the 4 coin packages above)
- Users spend coins on avatar items in-app
- No direct real money → avatar item purchases
- This is allowed by Apple's guidelines

### Testing
- Use **Sandbox Test Accounts** to test purchases without real money
- Create sandbox accounts in App Store Connect → Users and Access → Sandbox Testers
- Test in TestFlight builds or development builds

### Product Status
- Products must be **"Ready to Submit"** status before they work in TestFlight
- You don't need to submit the entire app for review to test IAP in TestFlight
- Products can be tested as soon as they're created and approved

---

## Summary

**Total IAP Products Needed: 8**
- 4 Coin Packages (Consumable)
- 1 Battle Pass Premium (Non-Consumable)
- 4 Level Skip Packages (Consumable)

**NOT Needed in App Store Connect:**
- Avatar shop items (virtual goods purchased with coins)
- Any other in-game items purchased with coins

---

## Current Implementation Status

✅ **Coin Shop** - Uses direct `react-native-iap` (no RevenueCat)
⚠️ **Battle Pass Premium** - Currently tries to use RevenueCat subscription (needs update)
⚠️ **Level Skips** - Currently tries to use RevenueCat (needs update)

**Next Steps:**
1. Create all 8 products in App Store Connect
2. Update battle pass code to use direct IAP like coin shop
3. Test all purchases in TestFlight
