# 🚀 COMPLETE PUBLISHING GUIDE - WITTZ APP

**Last Updated:** February 5, 2026  
**App Version:** 1.0.1  
**Bundle ID:** com.wittsy.app

---

## 📋 **OVERVIEW**

This guide covers everything you need to publish Wittz to both the Apple App Store and Google Play Store, including in-app purchase configuration.

**Estimated Total Time:** 4-6 hours (spread over 3-5 days for reviews)

---

## 🍎 **PART 1: APPLE APP STORE PUBLISHING**

### **Phase 1: App Store Connect Setup (30 minutes)**

#### **Step 1.1: Create App Listing**
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Wittz
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.wittsy.app
   - **SKU:** wittz-app-001
   - **User Access:** Full Access

#### **Step 1.2: App Information**
1. Go to **"App Information"** section
2. Fill in:
   - **Subtitle:** "Hilarious Word Game Battles"
   - **Category:** Primary: Games, Secondary: Word
   - **Content Rights:** Check "Contains third-party content"
   - **Age Rating:** Complete questionnaire (likely 12+)
   - **Privacy Policy URL:** https://wittz-support.netlify.app/privacy.html
   - **Terms of Service URL:** https://wittz-support.netlify.app/terms.html

#### **Step 1.3: Pricing and Availability**
1. Go to **"Pricing and Availability"**
2. Set:
   - **Price:** Free
   - **Availability:** All countries
   - **Pre-orders:** No

---

### **Phase 2: In-App Purchases Setup (60 minutes)**

#### **Step 2.1: Configure Paid Applications Agreement**
⚠️ **CRITICAL - Do this first!**

1. Go to **"Agreements, Tax, and Banking"**
2. Click **"Request"** next to "Paid Applications"
3. Complete all sections:
   - ✅ Contact Information
   - ✅ Bank Account Information
   - ✅ Tax Forms (W-9 for US, W-8BEN for international)
4. Submit and wait for processing (1-2 business days)

#### **Step 2.2: Create All 10 IAP Products**
Go to your app → **"Features"** → **"In-App Purchases"** → **"+"**

**Create these products in order:**

##### **Product 1: First-Time Mega Deal**
- Type: Consumable
- Reference Name: `First-Time Mega Deal`
- Product ID: `com.wittz.coins.starter`
- Price: $0.99 USD (Tier 1)
- Display Name: `🎁 First-Time Mega Deal`
- Description: `3,000 coins + exclusive item. One-time offer!`
- Screenshot: Upload coin shop screenshot
- Review Notes: `"One-time special offer for new users"`

##### **Product 2: Coin Pouch**
- Type: Consumable
- Reference Name: `Coin Pouch`
- Product ID: `com.wittz.coins.500`
- Price: $0.99 USD
- Display Name: `Coin Pouch`
- Description: `500 coins for avatar customization`

##### **Product 3: Coin Bag**
- Type: Consumable
- Reference Name: `Coin Bag`
- Product ID: `com.wittz.coins.1500`
- Price: $2.99 USD
- Display Name: `Coin Bag`
- Description: `1,500 coins - most popular package!`

##### **Product 4: Coin Chest**
- Type: Consumable
- Reference Name: `Coin Chest`
- Product ID: `com.wittz.coins.3000`
- Price: $4.99 USD
- Display Name: `Coin Chest`
- Description: `3,000 coins with 20% bonus value`

##### **Product 5: Coin Vault**
- Type: Consumable
- Reference Name: `Coin Vault`
- Product ID: `com.wittz.coins.10000`
- Price: $14.99 USD
- Display Name: `Coin Vault`
- Description: `10,000 coins - best value with 25% bonus!`

##### **Product 6: Battle Pass Premium**
- Type: Consumable
- Reference Name: `Battle Pass Premium`
- Product ID: `com.wittz.battlepass.premium`
- Price: $9.99 USD
- Display Name: `Battle Pass Premium`
- Description: `Unlock premium rewards and exclusive items!`

##### **Product 7: Skip 1 Level**
- Type: Consumable
- Reference Name: `Battle Pass Skip 1 Level`
- Product ID: `com.wittz.battlepass.skip.1`
- Price: $0.99 USD
- Display Name: `Skip 1 Level`
- Description: `Instantly advance 1 level in Battle Pass`

##### **Product 8: Skip 5 Levels**
- Type: Consumable
- Reference Name: `Battle Pass Skip 5 Levels`
- Product ID: `com.wittz.battlepass.skip.5`
- Price: $3.99 USD
- Display Name: `Skip 5 Levels`
- Description: `Instantly advance 5 levels in Battle Pass`

##### **Product 9: Skip 10 Levels**
- Type: Consumable
- Reference Name: `Battle Pass Skip 10 Levels`
- Product ID: `com.wittz.battlepass.skip.10`
- Price: $6.99 USD
- Display Name: `Skip 10 Levels`
- Description: `Instantly advance 10 levels in Battle Pass`

##### **Product 10: Skip 25 Levels**
- Type: Consumable
- Reference Name: `Battle Pass Skip 25 Levels`
- Product ID: `com.wittz.battlepass.skip.25`
- Price: $14.99 USD
- Display Name: `Skip 25 Levels`
- Description: `Instantly advance 25 levels - fastest way!`

#### **Step 2.3: Submit IAPs for Review**
1. For each product, click **"Submit for Review"**
2. Upload required screenshots
3. Add review notes
4. Wait 24-48 hours for approval

---

### **Phase 3: App Store Listing Content (45 minutes)**

#### **Step 3.1: Screenshots**
Prepare screenshots for:
- **6.7" Display (iPhone 15 Pro Max)** - Required
- **6.5" Display (iPhone 14 Plus)** - Required
- **5.5" Display (iPhone 8 Plus)** - Optional

**Required Screenshots (6-10 images):**
1. Game lobby with players
2. Submission phase with prompt
3. Voting phase with phrases
4. Results/winner screen
5. Battle Pass screen
6. Avatar creator
7. Leaderboard
8. Profile/achievements

#### **Step 3.2: App Preview Video (Optional)**
- 15-30 second gameplay video
- Show full game round
- Highlight key features

#### **Step 3.3: Description**
```
WITTZ - The Ultimate Word Game Battle!

🎮 COMPETE IN HILARIOUS WORD BATTLES
Create the funniest, wittiest responses to creative prompts and compete against friends and players worldwide!

⚡ FAST-PACED GAMEPLAY
• 20-second submission phase
• Vote for the best responses
• Win rounds and climb the leaderboard

🎨 CUSTOMIZE YOUR AVATAR
• 130+ unique avatar items
• Legendary and exclusive items
• Show off your style in victory screens

🏆 BATTLE PASS & PROGRESSION
• Seasonal Battle Pass with exclusive rewards
• Daily and weekly challenges
• Ranked mode with ELO ratings
• Achievements and titles

💰 EARN & SPEND COINS
• Unlock avatar items
• Daily deals and special offers
• First-time mega deal available

🌟 SOCIAL FEATURES
• Play with friends
• Chat and messaging
• Friend leaderboards
• Events and tournaments

Download Wittz now and show everyone your wit!
```

#### **Step 3.4: Keywords**
```
word game, party game, funny, wit, humor, multiplayer, battle, compete, friends, social, creative, voting, phrases, prompts, comedy
```

#### **Step 3.5: Promotional Text**
```
🎉 Season 1 Battle Pass now live! Unlock exclusive avatar items and rewards!
```

#### **Step 3.6: Support URL**
```
https://wittz-support.netlify.app/support.html
```

#### **Step 3.7: Marketing URL (Optional)**
```
https://wittsy.app
```

---

### **Phase 4: Build and Submit (90 minutes)**

#### **Step 4.1: Prepare Build**
```bash
cd wittsy-app

# Ensure you're logged in to EAS
eas login

# Verify configuration
eas build:configure

# Create production iOS build
eas build --platform ios --profile production
```

**Wait 30-60 minutes for build to complete**

#### **Step 4.2: Submit to App Store Connect**
```bash
# Submit the build
eas submit --platform ios --latest
```

Or manually:
1. Go to App Store Connect
2. Go to your app → **"TestFlight"** tab
3. Wait for build to appear (5-10 minutes)
4. Once processed, go to **"App Store"** tab
5. Click **"+"** next to "Build"
6. Select your build

#### **Step 4.3: Complete App Review Information**
1. Go to **"App Review Information"**
2. Fill in:
   - **Sign-in required:** Yes
   - **Demo Account:**
     - Username: `demo@wittz.app`
     - Password: `DemoWittz2026!`
   - **Contact Information:** Your email and phone
   - **Notes:** 
     ```
     To test the app:
     1. Sign in with demo account
     2. Tap "Quick Play" to join a game
     3. Test submission, voting, and results phases
     4. Check Battle Pass and Avatar Creator
     5. Test in-app purchases in sandbox mode
     
     All IAP products have been submitted for review separately.
     ```

#### **Step 4.4: Version Information**
1. Go to version section
2. Fill in:
   - **Version:** 1.0.1
   - **Copyright:** 2026 Wittz
   - **What's New in This Version:**
     ```
     Welcome to Wittz - The Ultimate Word Game Battle!
     
     • Fast-paced multiplayer word battles
     • 130+ avatar customization items
     • Battle Pass with exclusive rewards
     • Ranked mode with ELO ratings
     • Daily challenges and achievements
     • Social features and leaderboards
     ```

#### **Step 4.5: Submit for Review**
1. Click **"Add for Review"**
2. Review all information
3. Click **"Submit to App Review"**
4. Wait 2-7 days for review

---

## 🤖 **PART 2: GOOGLE PLAY STORE PUBLISHING**

### **Phase 5: Google Play Console Setup (30 minutes)**

#### **Step 5.1: Create App**
1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Wittz
   - **Default language:** English (United States)
   - **App or game:** Game
   - **Free or paid:** Free
   - **Declarations:** Check all required boxes

#### **Step 5.2: Set Up App**
Complete all required sections in the dashboard:

##### **Store Presence → Main Store Listing**
- **App name:** Wittz
- **Short description:** 
  ```
  Create hilarious responses, vote for the best, and battle friends in this fast-paced word game!
  ```
- **Full description:**
  ```
  WITTZ - The Ultimate Word Game Battle!
  
  🎮 COMPETE IN HILARIOUS WORD BATTLES
  Create the funniest, wittiest responses to creative prompts and compete against friends and players worldwide!
  
  ⚡ FAST-PACED GAMEPLAY
  • 20-second submission phase
  • Vote for the best responses
  • Win rounds and climb the leaderboard
  
  🎨 CUSTOMIZE YOUR AVATAR
  • 130+ unique avatar items
  • Legendary and exclusive items
  • Show off your style in victory screens
  
  🏆 BATTLE PASS & PROGRESSION
  • Seasonal Battle Pass with exclusive rewards
  • Daily and weekly challenges
  • Ranked mode with ELO ratings
  • Achievements and titles
  
  💰 EARN & SPEND COINS
  • Unlock avatar items
  • Daily deals and special offers
  • First-time mega deal available
  
  🌟 SOCIAL FEATURES
  • Play with friends
  • Chat and messaging
  • Friend leaderboards
  • Events and tournaments
  
  Download Wittz now and show everyone your wit!
  ```

##### **Graphics Assets**
- **App icon:** 512x512 PNG
- **Feature graphic:** 1024x500 PNG
- **Phone screenshots:** 2-8 images (minimum 2)
- **7-inch tablet screenshots:** Optional
- **10-inch tablet screenshots:** Optional

##### **Categorization**
- **App category:** Games → Word
- **Tags:** word game, party game, multiplayer, social
- **Content rating:** Complete questionnaire (likely ESRB: Everyone 12+)

##### **Contact Details**
- **Email:** your-email@example.com
- **Phone:** Your phone number
- **Website:** https://wittsy.app
- **Privacy policy:** https://wittz-support.netlify.app/privacy.html

---

### **Phase 6: Google Play In-App Products (30 minutes)**

#### **Step 6.1: Set Up Merchant Account**
⚠️ **CRITICAL - Do this first!**

1. Go to **"Monetize"** → **"Monetization setup"**
2. Link or create Google Merchant Account
3. Complete payment profile
4. Verify bank account

#### **Step 6.2: Create All 10 IAP Products**
Go to **"Monetize"** → **"Products"** → **"In-app products"**

Create these products:

1. **coins_starter** - $0.99 - "First-Time Mega Deal"
2. **coins_500** - $0.99 - "Coin Pouch"
3. **coins_1500** - $2.99 - "Coin Bag"
4. **coins_3000** - $4.99 - "Coin Chest"
5. **coins_10000** - $14.99 - "Coin Vault"
6. **battlepass_premium** - $9.99 - "Battle Pass Premium"
7. **battlepass_skip_1** - $0.99 - "Skip 1 Level"
8. **battlepass_skip_5** - $3.99 - "Skip 5 Levels"
9. **battlepass_skip_10** - $6.99 - "Skip 10 Levels"
10. **battlepass_skip_25** - $14.99 - "Skip 25 Levels"

For each product:
- Set status to **"Active"**
- Add description (under 55 chars)
- Set default price

---

### **Phase 7: Build and Release (60 minutes)**

#### **Step 7.1: Create Android Build**
```bash
cd wittsy-app

# Create production Android build
eas build --platform android --profile production
```

**Wait 20-40 minutes for build to complete**

#### **Step 7.2: Create Release**
1. In Google Play Console, go to **"Release"** → **"Production"**
2. Click **"Create new release"**
3. Upload your AAB file (from EAS build)
4. Fill in release notes:
   ```
   Welcome to Wittz v1.0.1!
   
   • Fast-paced multiplayer word battles
   • 130+ avatar customization items
   • Battle Pass with exclusive rewards
   • Ranked mode with ELO ratings
   • Daily challenges and achievements
   ```

#### **Step 7.3: Review and Rollout**
1. Review all sections (must be 100% complete)
2. Click **"Review release"**
3. Click **"Start rollout to Production"**
4. Confirm rollout
5. Wait 1-3 days for review

---

## 🧪 **PART 3: PRE-LAUNCH TESTING**

### **Phase 8: Sandbox Testing (60 minutes)**

#### **Step 8.1: iOS Sandbox Testing**
1. Create sandbox tester accounts in App Store Connect
2. On test device: Settings → App Store → Sandbox Account
3. Sign in with sandbox account
4. Test each IAP product:
   - ✅ First-time offer appears
   - ✅ Coins granted after purchase
   - ✅ Battle Pass unlocks
   - ✅ Level skips work
   - ✅ No real charges

#### **Step 8.2: Android Testing**
1. Add test accounts in Google Play Console
2. Install via internal testing track
3. Test all IAP products
4. Verify no real charges

#### **Step 8.3: Full Game Testing**
- ✅ Create account
- ✅ Join/create game
- ✅ Complete full round
- ✅ Test voting
- ✅ Check leaderboards
- ✅ Test Battle Pass
- ✅ Test avatar creator
- ✅ Test friend system
- ✅ Test notifications

---

## 📋 **COMPLETE CHECKLIST**

### **Apple App Store**
- [ ] App Store Connect account active
- [ ] Paid Applications Agreement signed
- [ ] Bank account verified
- [ ] Tax forms completed
- [ ] All 10 IAP products created
- [ ] IAP products submitted for review
- [ ] App listing created
- [ ] Screenshots uploaded (6-10)
- [ ] Description written
- [ ] Keywords added
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] iOS build created
- [ ] Build submitted to App Store Connect
- [ ] Demo account created
- [ ] App submitted for review
- [ ] Sandbox testing completed

### **Google Play Store**
- [ ] Google Play Console account active
- [ ] Merchant account linked
- [ ] Payment profile completed
- [ ] All 10 IAP products created
- [ ] IAP products activated
- [ ] App listing created
- [ ] Screenshots uploaded (2-8)
- [ ] Description written
- [ ] Content rating completed
- [ ] Privacy policy live
- [ ] Android build created
- [ ] Release created
- [ ] Release submitted
- [ ] Internal testing completed

### **Code & Backend**
- [ ] Firebase configured
- [ ] Firestore security rules deployed
- [ ] All IAP product IDs match
- [ ] Purchase flow tested
- [ ] Receipt validation working
- [ ] Analytics tracking purchases
- [ ] Error handling implemented
- [ ] First-time offer logic working

---

## ⏰ **TIMELINE**

### **Day 1 (Today)**
- ✅ Set up App Store Connect (30 min)
- ✅ Create all IAP products (60 min)
- ✅ Submit IAPs for review (10 min)
- ✅ Prepare app listing content (45 min)
- ✅ Create iOS build (60 min)
- **Total: ~3 hours**

### **Day 2**
- ✅ Set up Google Play Console (30 min)
- ✅ Create Android IAP products (30 min)
- ✅ Create Android build (40 min)
- ✅ Complete app listings (30 min)
- **Total: ~2 hours**

### **Day 3**
- ⏳ Wait for IAP approval (Apple)
- ✅ Sandbox testing (60 min)
- ✅ Submit iOS app for review
- ✅ Submit Android app for review

### **Day 4-7**
- ⏳ Wait for app review (Apple: 2-7 days)
- ⏳ Wait for app review (Google: 1-3 days)

### **Day 8+**
- 🎉 **GO LIVE!**
- Monitor first purchases
- Respond to reviews
- Track analytics

---

## 🚨 **COMMON ISSUES & SOLUTIONS**

### **Issue: "Paid Applications Agreement not signed"**
**Solution:** Complete all sections in Agreements, Tax, and Banking. Wait 1-2 business days for processing.

### **Issue: "Product IDs not found"**
**Solution:** 
- Verify exact match between code and store
- Wait 2-4 hours after creating products
- Clear app cache and reinstall

### **Issue: "Build failed"**
**Solution:**
- Check EAS build logs
- Verify Firebase config files present
- Ensure all dependencies installed
- Check Apple Developer account active

### **Issue: "App rejected"**
**Solution:**
- Read rejection reason carefully
- Fix issues mentioned
- Resubmit with explanation
- Common issues: privacy policy, demo account, IAP testing

---

## 📞 **SUPPORT RESOURCES**

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **App Store Connect Help:** https://developer.apple.com/help/app-store-connect/
- **Google Play Console Help:** https://support.google.com/googleplay/android-developer/
- **IAP Testing:** https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases

---

## 🎯 **NEXT STEPS**

**Start now:**
1. Open App Store Connect
2. Create Paid Applications Agreement
3. Create all 10 IAP products
4. Start iOS build with `eas build --platform ios --profile production`

**You've got this!** 🚀

Your app is ready, the code is solid, and the monetization is configured. Just follow this guide step by step and you'll be live within a week!
