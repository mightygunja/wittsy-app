# RevenueCat Setup Guide

This guide will help you set up RevenueCat for in-app purchases in the Wittz app.

## Prerequisites

1. Apple Developer Account (for iOS)
2. Google Play Developer Account (for Android)
3. RevenueCat Account (free to start)

## Step 1: Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com/)
2. Sign up for a free account
3. Create a new project called "Wittz"

## Step 2: Configure iOS (App Store)

### 2.1 Create In-App Purchase Products in App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to your app > Features > In-App Purchases
3. Create the following products:

**Consumable Products (Coins):**
- Product ID: `com.Wittz.coins.500`
  - Display Name: Coin Pouch
  - Price: $0.99
  
- Product ID: `com.Wittz.coins.1500`
  - Display Name: Coin Bag
  - Price: $2.99
  
- Product ID: `com.Wittz.coins.3000`
  - Display Name: Coin Chest
  - Price: $4.99
  
- Product ID: `com.Wittz.coins.10000`
  - Display Name: Coin Vault
  - Price: $14.99

**Consumable Products (Premium Gems):**
- Product ID: `com.Wittz.premium.10`
  - Display Name: Gem Pouch
  - Price: $0.99
  
- Product ID: `com.Wittz.premium.50`
  - Display Name: Gem Bag
  - Price: $4.99
  
- Product ID: `com.Wittz.premium.100`
  - Display Name: Gem Chest
  - Price: $8.99
  
- Product ID: `com.Wittz.premium.500`
  - Display Name: Gem Vault
  - Price: $29.99

**Auto-Renewable Subscriptions:**
- Product ID: `com.Wittz.premium.monthly`
  - Display Name: Premium Monthly
  - Price: $4.99/month
  
- Product ID: `com.Wittz.premium.yearly`
  - Display Name: Premium Yearly
  - Price: $49.99/year

### 2.2 Connect App Store to RevenueCat

1. In RevenueCat Dashboard, go to Project Settings > Apps
2. Click "Add App" > iOS
3. Enter your Bundle ID (e.g., `com.Wittz.app`)
4. Upload your App Store Connect API Key:
   - In App Store Connect, go to Users and Access > Keys
   - Create a new key with "App Manager" access
   - Download the `.p8` file
   - Upload to RevenueCat

## Step 3: Configure Android (Google Play)

### 3.1 Create In-App Products in Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console/)
2. Go to your app > Monetize > Products > In-app products
3. Create the following products:

**Consumable Products (Coins):**
- Product ID: `coins_500` - $0.99
- Product ID: `coins_1500` - $2.99
- Product ID: `coins_3000` - $4.99
- Product ID: `coins_10000` - $14.99

**Consumable Products (Premium Gems):**
- Product ID: `premium_10` - $0.99
- Product ID: `premium_50` - $4.99
- Product ID: `premium_100` - $8.99
- Product ID: `premium_500` - $29.99

**Subscriptions:**
- Product ID: `premium_monthly` - $4.99/month
- Product ID: `premium_yearly` - $49.99/year

### 3.2 Connect Google Play to RevenueCat

1. In RevenueCat Dashboard, go to Project Settings > Apps
2. Click "Add App" > Android
3. Enter your Package Name (e.g., `com.Wittz.app`)
4. Upload your Google Play Service Account JSON:
   - In Google Play Console, go to Setup > API access
   - Create a new service account or use existing
   - Grant "View financial data" and "Manage orders" permissions
   - Download the JSON key file
   - Upload to RevenueCat

## Step 4: Configure Entitlements in RevenueCat

1. In RevenueCat Dashboard, go to Entitlements
2. Create the following entitlements:

**Premium Entitlement:**
- Entitlement ID: `premium`
- Attach products:
  - `com.Wittz.premium.monthly`
  - `premium_monthly`
  - `com.Wittz.premium.yearly`
  - `premium_yearly`

## Step 5: Get API Keys

1. In RevenueCat Dashboard, go to Project Settings > API Keys
2. Copy the following keys:
   - **iOS SDK Key** (starts with `appl_`)
   - **Android SDK Key** (starts with `goog_`)

## Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your RevenueCat API keys to `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxx
   ```

3. **IMPORTANT:** Never commit `.env` to git (it's already in `.gitignore`)

## Step 7: Test Purchases

### iOS Testing (Sandbox)
1. In App Store Connect, create a Sandbox Tester account
2. On your iOS device:
   - Settings > App Store > Sandbox Account
   - Sign in with your sandbox tester
3. Run the app and test purchases

### Android Testing
1. In Google Play Console, add your email to License Testing
2. Upload a test build to Internal Testing track
3. Install the test build and test purchases

## Step 8: Verify Integration

Run the app and check the logs for:
```
✅ RevenueCat initialized successfully
```

If you see this, RevenueCat is properly configured!

## Troubleshooting

### "RevenueCat API key not found"
- Make sure `.env` file exists and contains the API keys
- Restart the Metro bundler after adding environment variables

### "Product not found"
- Verify product IDs match exactly in App Store Connect/Google Play Console
- Wait 2-4 hours after creating products for them to be available
- Clear app data and reinstall

### "Purchase failed"
- Check that you're signed in with a sandbox/test account
- Verify the app's bundle ID matches in RevenueCat
- Check RevenueCat Dashboard > Customer History for error details

## Production Checklist

Before going live:
- [ ] All products created in App Store Connect
- [ ] All products created in Google Play Console
- [ ] Products linked to entitlements in RevenueCat
- [ ] API keys added to production environment
- [ ] Tested purchases on both iOS and Android
- [ ] Verified receipt validation is working
- [ ] Set up webhooks for server-side validation (optional)
- [ ] Configured refund handling
- [ ] Added restore purchases button in app

## Support

- RevenueCat Docs: https://docs.revenuecat.com/
- RevenueCat Support: support@revenuecat.com
- Community: https://community.revenuecat.com/
