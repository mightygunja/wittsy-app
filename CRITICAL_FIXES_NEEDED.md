# Critical Fixes Needed - User Report

## Issues Reported:

### 1. ❌ Google Sign-In Not Visible on Welcome Screen
**Status:** INVESTIGATING
- Google sign-in button exists in code (line 154-169 in WelcomeScreen.tsx)
- Button uses `variant="outline"` and has proper styling
- Need to verify if button is rendering or hidden by layout

### 2. ❌ Daily Reward Prompt Issues
**Status:** INVESTIGATING
- Coins not updating in real-time after claim
- Modal keeps re-appearing when navigating away and back to HomeScreen
- Current implementation:
  - `handleDailyRewardClaimed` calls `refreshUserProfile()` (line 142)
  - `checkDailyReward` runs on `useFocusEffect` (line 121-135)
  - Need to add flag to prevent re-checking after claim

### 3. ✅ Quick Play Auto-Create Logic
**Status:** ALREADY IMPLEMENTED
- QuickPlayScreen.tsx lines 150-162 has auto-create logic
- If no room found, creates new ranked room automatically
- This should be working correctly

### 4. ❌ Settings Screen Crashes
**Status:** INVESTIGATING
- SettingsScreen navigates to 'EnhancedSettings' (line 21, 29, 37)
- EnhancedSettingsScreen has navigation to sub-screens
- Need to verify all navigation targets exist and are registered

### 5. ❌ Create Game Button Text Not Centered
**Status:** INVESTIGATING
- WelcomeScreen "Create Account" button (line 146-151)
- Uses Button component with `variant="outline"` and `style={styles.createButton}`
- createButton style has `justifyContent: 'center'` and `alignItems: 'center'`
- Need to check if text is vertically centered

## Action Plan:

1. Fix WelcomeScreen Google button visibility
2. Fix DailyRewardModal to prevent re-appearing
3. Verify QuickPlay works (already has logic)
4. Fix Settings navigation crashes
5. Fix Create Account button text centering
6. Test all fixes thoroughly before user builds
