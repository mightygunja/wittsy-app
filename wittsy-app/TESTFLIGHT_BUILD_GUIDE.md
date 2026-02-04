# 🚀 TestFlight Build & Deployment Guide

## Complete Step-by-Step Instructions

---

## 📋 PREREQUISITES

Before building, ensure you have:

- [x] Apple Developer Account ($99/year)
- [x] App registered in App Store Connect
- [x] Bundle identifier configured
- [x] Expo account (free)
- [x] EAS CLI installed

---

## 🔧 SETUP (One-Time Only)

### **Step 1: Install EAS CLI**

```bash
npm install -g eas-cli
```

### **Step 2: Login to Expo**

```bash
eas login
```

Enter your Expo credentials.

### **Step 3: Configure EAS Build**

```bash
cd wittsy-app
eas build:configure
```

This creates `eas.json` with build profiles.

### **Step 4: Update eas.json (if needed)**

Check your `eas.json` file should look like this:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false,
        "bundleIdentifier": "com.yourcompany.wittsy"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

**Update these values:**
- `bundleIdentifier`: Your app's bundle ID
- `appleId`: Your Apple ID email
- `ascAppId`: Your App Store Connect app ID
- `appleTeamId`: Your Apple Developer Team ID

---

## 🚀 BUILD FOR TESTFLIGHT

### **Option 1: Build Only (Recommended First Time)**

```bash
# Navigate to your app directory
cd wittsy-app

# Build for iOS production
eas build --platform ios --profile production
```

**What happens:**
1. Code is uploaded to Expo servers
2. Build runs in the cloud (takes 10-20 minutes)
3. You get a download link for the `.ipa` file
4. You manually upload to App Store Connect

### **Option 2: Build + Auto-Submit to TestFlight**

```bash
# Build and automatically submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

**What happens:**
1. Code is uploaded to Expo servers
2. Build runs in the cloud
3. Automatically uploaded to App Store Connect
4. Available in TestFlight within 5-10 minutes

---

## 📱 FULL WORKFLOW

### **Step-by-Step Build Process:**

**1. Ensure code is ready:**
```bash
# Check for TypeScript errors (optional)
npx tsc --noEmit --skipLibCheck

# Clear cache (optional but recommended)
npx expo start --clear
# Press Ctrl+C to stop
```

**2. Start the build:**
```bash
# Production build for TestFlight
eas build --platform ios --profile production
```

**3. Follow prompts:**
```
? What would you like your iOS bundle identifier to be?
› com.yourcompany.wittsy

? Generate a new Apple Distribution Certificate?
› Yes

? Generate a new Apple Provisioning Profile?
› Yes
```

**4. Wait for build:**
- Build takes 10-20 minutes
- You'll see progress in terminal
- You can close terminal and check status later

**5. Check build status:**
```bash
eas build:list
```

Or visit: https://expo.dev/accounts/[your-account]/projects/wittsy/builds

---

## 📤 SUBMIT TO TESTFLIGHT

### **Option A: Auto-Submit (During Build)**

```bash
eas build --platform ios --profile production --auto-submit
```

### **Option B: Manual Submit (After Build)**

```bash
# Submit a completed build
eas submit --platform ios --latest
```

Or manually:
1. Download `.ipa` from build page
2. Go to https://appstoreconnect.apple.com
3. Navigate to your app → TestFlight
4. Click "+" to add build
5. Upload the `.ipa` file

---

## 🔑 CREDENTIALS MANAGEMENT

### **First Build - Credentials Setup:**

EAS will ask you to generate:
1. **Distribution Certificate** - For signing the app
2. **Provisioning Profile** - For TestFlight distribution

**Recommended:** Let EAS manage credentials automatically.

```bash
# View your credentials
eas credentials

# Or manage manually at:
# https://expo.dev/accounts/[your-account]/projects/wittsy/credentials
```

---

## 📋 COMPLETE COMMAND REFERENCE

### **Build Commands:**

```bash
# Production build (iOS)
eas build --platform ios --profile production

# Production build + auto-submit
eas build --platform ios --profile production --auto-submit

# Build without cache (if issues)
eas build --platform ios --profile production --clear-cache

# Build specific version
eas build --platform ios --profile production --message "v1.2.0 - Daily rewards"
```

### **Submit Commands:**

```bash
# Submit latest build
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id [build-id]

# Submit with custom options
eas submit --platform ios --latest --verbose
```

### **Status Commands:**

```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# Check credentials
eas credentials

# View project info
eas project:info
```

---

## 🎯 QUICK START (Copy-Paste Ready)

### **First Time Setup:**

```bash
# 1. Install EAS CLI (if not installed)
npm install -g eas-cli

# 2. Login
eas login

# 3. Navigate to project
cd wittsy-app

# 4. Configure EAS
eas build:configure

# 5. Build for TestFlight
eas build --platform ios --profile production --auto-submit
```

### **Subsequent Builds:**

```bash
# Navigate to project
cd wittsy-app

# Build and submit
eas build --platform ios --profile production --auto-submit
```

That's it! 🚀

---

## ⏱️ BUILD TIMES

**Expected durations:**

- **First build:** 15-25 minutes
  - Includes dependency installation
  - Credential generation
  - Full compilation

- **Subsequent builds:** 10-15 minutes
  - Cached dependencies
  - Faster compilation

- **TestFlight processing:** 5-10 minutes
  - After upload to App Store Connect
  - Automated testing by Apple

**Total time to TestFlight:** ~20-35 minutes

---

## 🔍 MONITORING BUILD PROGRESS

### **In Terminal:**
```
✔ Build started
✔ Uploading project
✔ Installing dependencies
✔ Running fastlane
✔ Building iOS app
✔ Uploading artifacts
✔ Build completed!
```

### **On Web:**
Visit: https://expo.dev/accounts/[your-account]/projects/wittsy/builds

You'll see:
- Build status (queued, building, completed)
- Build logs
- Download link for `.ipa`
- Submission status

---

## 🐛 TROUBLESHOOTING

### **Build Failed - Common Issues:**

**1. Bundle Identifier Mismatch:**
```bash
# Fix in app.json or app.config.js
"ios": {
  "bundleIdentifier": "com.yourcompany.wittsy"
}
```

**2. Credentials Issues:**
```bash
# Reset credentials
eas credentials --platform ios

# Or let EAS regenerate
eas build --platform ios --profile production --clear-credentials
```

**3. TypeScript Errors:**
```bash
# Build anyway (warnings only)
eas build --platform ios --profile production

# Or fix errors first
npx tsc --noEmit
```

**4. Dependency Issues:**
```bash
# Clear cache and rebuild
eas build --platform ios --profile production --clear-cache
```

**5. Out of Memory:**
```bash
# Use larger build instance (paid plans)
# Or reduce bundle size
```

### **Submit Failed - Common Issues:**

**1. Missing App Store Connect Info:**
- Ensure app is created in App Store Connect
- Get App ID from App Store Connect
- Update `eas.json` with correct IDs

**2. Certificate Expired:**
```bash
# Regenerate certificates
eas credentials --platform ios
```

**3. Version Already Exists:**
- Increment version in `app.json`
- Or increment build number

---

## 📝 VERSION MANAGEMENT

### **Update Version Before Build:**

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.2.0",
    "ios": {
      "buildNumber": "12"
    }
  }
}
```

**Version format:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes (1.0.0 → 2.0.0)
- **MINOR:** New features (1.0.0 → 1.1.0)
- **PATCH:** Bug fixes (1.0.0 → 1.0.1)

**Build number:** Increment for each build (1, 2, 3, ...)

---

## 🎯 BEST PRACTICES

### **Before Each Build:**

1. ✅ Test locally (if possible)
2. ✅ Commit all changes to git
3. ✅ Update version/build number
4. ✅ Clear cache if major changes
5. ✅ Add build message for tracking

### **Build Command Template:**

```bash
eas build \
  --platform ios \
  --profile production \
  --auto-submit \
  --message "v1.2.0 - Added daily rewards, review prompts, referral system" \
  --clear-cache
```

### **After Build:**

1. ✅ Test on TestFlight
2. ✅ Check crash reports
3. ✅ Monitor analytics
4. ✅ Gather feedback
5. ✅ Plan next iteration

---

## 📊 BUILD PROFILES EXPLAINED

### **Development:**
```json
"development": {
  "developmentClient": true,
  "distribution": "internal"
}
```
- For local testing
- Includes dev tools
- Larger bundle size

### **Preview:**
```json
"preview": {
  "distribution": "internal"
}
```
- For internal testing
- Production-like build
- Smaller bundle size

### **Production:**
```json
"production": {
  "ios": {
    "simulator": false
  }
}
```
- For TestFlight/App Store
- Optimized build
- No dev tools

---

## 🚀 YOUR FIRST BUILD (RIGHT NOW)

**Copy and paste these commands:**

```bash
# 1. Make sure you're in the right directory
cd c:\dev\Wittsy\wittsy-app

# 2. Login to EAS (if not already)
eas login

# 3. Build and submit to TestFlight
eas build --platform ios --profile production --auto-submit --message "Initial TestFlight build with daily rewards, review prompts, and referral system"
```

**Then wait 20-30 minutes and check TestFlight!**

---

## 📱 TESTING ON TESTFLIGHT

### **After Build Completes:**

1. **Open TestFlight app** on your iPhone
2. **Check for new build** (may take 5-10 min)
3. **Install the build**
4. **Test new features:**
   - Daily login rewards modal
   - Review prompt (after 3 wins)
   - Referral system (Profile → Referrals)
5. **Report any issues**

### **Invite Testers:**

1. Go to App Store Connect
2. Navigate to TestFlight
3. Click "Add Internal Testers" or "Add External Testers"
4. Enter email addresses
5. Testers receive invitation email

---

## ✅ CHECKLIST FOR TODAY'S BUILD

- [ ] Code is committed to git
- [ ] Version updated in `app.json`
- [ ] EAS CLI installed
- [ ] Logged into EAS
- [ ] Run build command
- [ ] Wait for build to complete
- [ ] Check TestFlight for new build
- [ ] Test daily rewards
- [ ] Test review prompt
- [ ] Test referral system
- [ ] Verify no crashes
- [ ] Celebrate! 🎉

---

## 🎉 YOU'RE READY!

**Run this now:**

```bash
cd c:\dev\Wittsy\wittsy-app
eas build --platform ios --profile production --auto-submit
```

**Your app will be on TestFlight in ~30 minutes!** 🚀

---

**Questions? Issues?**
- EAS Docs: https://docs.expo.dev/build/introduction/
- EAS Build Status: https://expo.dev
- App Store Connect: https://appstoreconnect.apple.com
