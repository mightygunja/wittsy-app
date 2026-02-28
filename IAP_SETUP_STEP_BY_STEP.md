# App Store Connect IAP Setup - Step by Step Guide

## 🎯 Your Current Issue: "Missing Metadata"

This means you've created the products but haven't filled in all required fields. Follow these exact steps.

---

## 📱 PART 1: Complete IAP Product Metadata

### Step 1: Log into App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"**
3. Click on **"Wittsy"** (your app)
4. Click **"In-App Purchases"** in the left sidebar

### Step 2: Complete EACH Product (Do this 9 times)

You should see your 9 products listed. For EACH one, click on it and follow these steps:

---

#### **A. Product ID** (Should already be set)
- This should already match your code exactly
- **DO NOT CHANGE THIS**
- Example: `com.wittz.coins.500`

---

#### **B. Reference Name**
This is just for you to see in App Store Connect (users don't see this).

**Examples:**
- `500 Coins - Small Pack`
- `1500 Coins - Medium Pack`
- `Battle Pass Premium`
- `Skip 1 Level`

---

#### **C. Price**
1. Click **"Price Schedule"** or **"Pricing"**
2. Click **"Add Pricing"** or **"Edit"**
3. Select your price tier:
   - **$0.99** → Select "Tier 1"
   - **$2.99** → Select "Tier 3"
   - **$4.99** → Select "Tier 5"
   - **$6.99** → Select "Tier 7"
   - **$14.99** → Select "Tier 15"
4. Click **"Next"** or **"Save"**

**Your Products:**
- `com.wittz.coins.500` → **Tier 1** ($0.99)
- `com.wittz.coins.1500` → **Tier 3** ($2.99)
- `com.wittz.coins.3000` → **Tier 5** ($4.99)
- `com.wittz.coins.10000` → **Tier 15** ($14.99)
- `com.wittz.battlepass.premium` → **Your choice** (suggest Tier 5 = $4.99)
- `com.wittz.battlepass.skip.1` → **Tier 1** ($0.99)
- `com.wittz.battlepass.skip.5` → **Tier 4** ($3.99)
- `com.wittz.battlepass.skip.10` → **Tier 7** ($6.99)
- `com.wittz.battlepass.skip.25` → **Tier 15** ($14.99)

---

#### **D. Localization (Name & Description)**

This is what users see when purchasing.

1. Scroll to **"App Store Localization"** section
2. Click **"Add Localization"**
3. Select **"English (U.S.)"**
4. Fill in:

**Display Name** (Short, appears in purchase dialog):
```
500 Coins
1,500 Coins
3,000 Coins
10,000 Coins
Battle Pass Premium
Skip 1 Level
Skip 5 Levels
Skip 10 Levels
Skip 25 Levels
```

**Description** (Longer, explains what they get):
```
Get 500 coins to unlock avatar items and features

Get 1,500 coins to unlock avatar items and features

Get 3,000 coins to unlock avatar items and features

Get 10,000 coins to unlock avatar items and features

Unlock premium Battle Pass rewards and exclusive content

Skip 1 Battle Pass level instantly

Skip 5 Battle Pass levels instantly

Skip 10 Battle Pass levels instantly

Skip 25 Battle Pass levels instantly
```

5. Click **"Save"**

---

#### **E. Review Information (Screenshot)**

This is the **"Missing Metadata"** issue. Apple requires a screenshot showing what the user gets.

**Option 1: Create a Simple Screenshot (Easiest)**

1. Open any image editor (Paint, Preview, Photoshop, Canva)
2. Create an image **640x920 pixels** (or larger)
3. Add text showing what they get:
   ```
   500 Coins
   Use coins to unlock avatar items
   ```
4. Save as PNG or JPG
5. Upload to App Store Connect

**Option 2: Screenshot from Your App (Better)**

1. Open your app in simulator/TestFlight
2. Navigate to the coin shop or battle pass screen
3. Take a screenshot (Cmd+S in simulator)
4. Upload to App Store Connect

**How to Upload:**

1. Scroll to **"Review Information"** section
2. Click **"Choose File"** under "Screenshot"
3. Select your image
4. Click **"Upload"**

**⚠️ You need ONE screenshot per product (9 total)**

You can use the same screenshot for similar products (all coin packs can use the same screenshot).

---

#### **F. Save the Product**

1. Scroll to the top
2. Click **"Save"** in the top right
3. The status should change from "Missing Metadata" to "Ready to Submit"

---

### Step 3: Repeat for All 9 Products

Go back to the In-App Purchases list and repeat Step 2 for each product:
- [ ] com.wittz.coins.500
- [ ] com.wittz.coins.1500
- [ ] com.wittz.coins.3000
- [ ] com.wittz.coins.10000
- [ ] com.wittz.battlepass.premium
- [ ] com.wittz.battlepass.skip.1
- [ ] com.wittz.battlepass.skip.5
- [ ] com.wittz.battlepass.skip.10
- [ ] com.wittz.battlepass.skip.25

---

## 💰 PART 2: Banking & Tax Setup

This is separate from IAP products. You only do this ONCE for your entire account.

### Step 1: Go to Agreements, Tax, and Banking

1. In App Store Connect, click your name in the top right
2. Click **"Agreements, Tax, and Banking"**
3. You'll see three sections:
   - **Agreements**
   - **Banking**
   - **Tax Forms**

---

### Step 2: Accept Paid Applications Agreement

1. Under **"Agreements"**, find "Paid Applications"
2. Click **"Request"** or **"Review"**
3. Read the agreement
4. Check the box to accept
5. Click **"Submit"**

**Status should show:** "Active" or "Processing"

---

### Step 3: Add Banking Information

1. Click **"Banking"** section
2. Click **"Add Bank Account"**
3. Fill in:
   - **Bank Name:** Your bank's name
   - **Account Holder Name:** Your name or business name
   - **Account Number:** Your bank account number
   - **Routing Number:** Your bank's routing number (9 digits)
   - **Account Type:** Checking or Savings
   - **Bank Address:** Your bank's address

4. Click **"Save"**

**⚠️ Apple will verify this (takes 1-3 business days)**

---

### Step 4: Complete Tax Forms

#### **If you're in the United States:**

1. Click **"Tax Forms"** section
2. Click **"Add Tax Form"**
3. Select **"United States"**
4. Select **"W-9"** (for individuals) or **"W-8"** (for businesses)
5. Fill in:
   - **Legal Name:** Your full legal name
   - **Business Name:** (if applicable)
   - **Tax ID:** Your Social Security Number or EIN
   - **Address:** Your mailing address
   - **Signature:** Type your name
   - **Date:** Today's date
6. Click **"Submit"**

#### **If you're outside the United States:**

1. Click **"Tax Forms"** section
2. Click **"Add Tax Form"**
3. Select your country
4. Select **"W-8BEN"** (for individuals) or **"W-8BEN-E"** (for businesses)
5. Fill in all required fields
6. Click **"Submit"**

**Status should show:** "Submitted" or "Processing"

---

### Step 5: Wait for Approval

After completing all three sections:
- **Agreements:** Should be "Active" immediately
- **Banking:** Takes 1-3 business days to verify
- **Tax Forms:** Takes 1-3 business days to process

**You'll receive an email when everything is approved.**

---

## 🚀 PART 3: Submit Your App with IAP

### Step 1: Verify All Products are Ready

1. Go to **"In-App Purchases"** in your app
2. Check that all 9 products show **"Ready to Submit"**
3. If any still show "Missing Metadata", go back and complete them

---

### Step 2: Add IAP to Your App Submission

1. Go to your app's **"App Store"** tab
2. Scroll to **"In-App Purchases and Subscriptions"**
3. Click **"Add"** or **"+"**
4. Select all 9 of your IAP products
5. Click **"Done"**

---

### Step 3: Submit for Review

1. Fill in all other required app information
2. Click **"Save"**
3. Click **"Submit for Review"**

**Apple will review your app AND your IAP products together.**

---

## ✅ Verification Checklist

### Before Submitting:
- [ ] All 9 IAP products created
- [ ] Each product has a price set
- [ ] Each product has name and description (English)
- [ ] Each product has a screenshot uploaded
- [ ] All products show "Ready to Submit"
- [ ] Paid Applications Agreement accepted
- [ ] Bank account added
- [ ] Tax form submitted
- [ ] IAP products added to app submission

### After Submission:
- [ ] App status shows "Waiting for Review"
- [ ] Banking status shows "Active" (may take a few days)
- [ ] Tax form status shows "Active" (may take a few days)

---

## 🆘 Common Issues

### "Missing Metadata" Won't Go Away
**Solution:** Check that you have:
- ✅ Price set
- ✅ Display name filled in
- ✅ Description filled in
- ✅ Screenshot uploaded
- ✅ Clicked "Save"

### "Cannot Add Bank Account"
**Solution:** 
- Verify routing number is correct (9 digits)
- Verify account number is correct
- Try a different browser
- Contact Apple Support

### "Tax Form Rejected"
**Solution:**
- Verify your Tax ID is correct
- Verify your legal name matches your Tax ID
- Resubmit with correct information

### "IAP Not Working in TestFlight"
**Solution:**
- IAP products don't need to be approved for TestFlight
- They work in sandbox mode automatically
- Make sure you're using a sandbox test account

---

## 📞 Need Help?

### Apple Developer Support
- **Phone:** 1-800-633-2152 (US)
- **Email:** https://developer.apple.com/contact/
- **Hours:** Monday-Friday, 9am-5pm PT

### What to Say:
"I'm setting up In-App Purchases for my app and seeing 'Missing Metadata' errors. I need help completing the product information."

---

## 🎯 Quick Summary

**For EACH of your 9 products:**
1. Set price tier
2. Add English name and description
3. Upload a screenshot (640x920px minimum)
4. Click Save

**For your account (ONE TIME):**
1. Accept Paid Applications Agreement
2. Add bank account
3. Submit tax form (W-9 or W-8)

**Then:**
1. Add all 9 products to your app submission
2. Submit for review

**Timeline:**
- IAP metadata: 10-15 minutes per product
- Banking/tax approval: 1-3 business days
- App review: 1-3 days

---

## ✨ You're Almost There!

The hardest part is just filling in the forms. Once you complete the metadata for all 9 products and set up banking/tax, you're done. Apple handles the rest.

**Start with ONE product to get the hang of it, then do the other 8.**
