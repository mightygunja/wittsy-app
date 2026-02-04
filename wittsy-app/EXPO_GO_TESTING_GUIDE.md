# Expo Go Testing Guide

## 🎯 Purpose
Test the app on Expo Go before building to TestFlight to catch issues early.

---

## 🚀 How to Test on Expo Go

### 1. Start the Development Server
```bash
cd c:\dev\Wittsy\wittsy-app
npm run start
```

### 2. Scan QR Code
- Open Expo Go app on your iPhone
- Scan the QR code from the terminal
- App will load on your device

---

## ⚙️ What's Different on Expo Go

### Features DISABLED on Expo Go:
- ❌ **Google Sign-In** - Requires native build
  - Button is hidden
  - Shows info message instead
  - Use email sign-up or guest mode for testing

### Features ENABLED on Expo Go:
- ✅ Email/Password Sign-Up
- ✅ Email/Password Sign-In
- ✅ Guest Mode (Play Now)
- ✅ All game functionality
- ✅ QuickPlay matchmaking
- ✅ Room creation
- ✅ Daily rewards
- ✅ Settings navigation
- ✅ Profile screens
- ✅ Leaderboards
- ✅ Battle Pass
- ✅ Challenges
- ✅ Everything except Google Sign-In

---

## 🧪 Testing Checklist

### Authentication:
- [ ] Click "Play Now" (Guest Mode) - Should work
- [ ] Click "Create Account" - Should work
- [ ] Sign up with email/password - Should work
- [ ] Sign in with email/password - Should work
- [ ] Google Sign-In button should be HIDDEN
- [ ] Should see info message about Expo Go

### QuickPlay:
- [ ] Click Quick Play
- [ ] Should create room if none exist
- [ ] Should join room successfully
- [ ] No "Room not found" error

### Daily Rewards:
- [ ] Daily reward modal appears on first launch
- [ ] Claim reward
- [ ] Navigate away and back
- [ ] Modal should NOT re-appear

### Settings:
- [ ] Open Settings
- [ ] Click each settings option
- [ ] Should navigate without crashes
- [ ] All screens should load

### General:
- [ ] No crashes during navigation
- [ ] All screens render correctly
- [ ] Buttons work as expected
- [ ] No console errors (check Metro bundler)

---

## 🔍 How to Check Console Logs

Watch the Metro bundler terminal for logs:
- ✅ Green logs = Success
- ⚠️ Yellow logs = Warnings (usually okay)
- ❌ Red logs = Errors (need to fix)

Look for:
```
✅ Google Sign-In configured (native build)  ← Won't see this on Expo Go
⏭️ Skipping Google Sign-In configuration (Expo Go)  ← Should see this
🔵 WelcomeScreen: Starting Google Sign-In...  ← Won't see this on Expo Go
```

---

## 🐛 Common Expo Go Issues

### Issue: "Unable to resolve module"
**Solution:** Run `npm install` and restart Metro bundler

### Issue: "Network error"
**Solution:** Make sure phone and computer are on same WiFi

### Issue: App crashes on startup
**Solution:** Check Metro bundler logs for errors

### Issue: White screen
**Solution:** Shake device → Reload

---

## 🎯 What to Test Before TestFlight

Focus on these areas that had issues:

1. **QuickPlay Room Creation**
   - Create room when none exist
   - Join room successfully
   - No "Room not found" errors

2. **Daily Rewards**
   - Claim reward
   - Navigate away/back
   - Modal doesn't re-appear

3. **Settings Navigation**
   - Click all settings buttons
   - No crashes

4. **General Stability**
   - Navigate between screens
   - No crashes
   - Smooth performance

---

## ✅ When to Build to TestFlight

Build to TestFlight when:
- ✅ All Expo Go tests pass
- ✅ No crashes during testing
- ✅ QuickPlay works correctly
- ✅ Daily rewards work correctly
- ✅ Settings navigation works
- ✅ No console errors

Then run:
```bash
eas build --platform ios --profile production --auto-submit
```

---

## 📝 Notes

- Expo Go is for TESTING ONLY
- Some features require native build (Google Sign-In)
- TestFlight build will have ALL features enabled
- Use Expo Go to catch bugs early before wasting a build

---

## 🔄 Switching Between Expo Go and TestFlight

The app automatically detects the environment:

**On Expo Go:**
- Google Sign-In: HIDDEN
- Shows info message
- All other features work

**On TestFlight:**
- Google Sign-In: ENABLED
- Full functionality
- All features work

No manual switching needed - it's automatic!
