# Settings Screens - Manual Fix Required

## Issue
I attempted to programmatically wrap all `settingRow` elements with `settingCard` wrappers but created JSX syntax errors due to the complexity of the nested structure.

## Solution
The fix is simple but requires careful manual application to avoid breaking JSX structure.

## What Needs to Be Done

For **each Settings screen** (NotificationSettings, AudioSettings, GameplaySettings, etc.):

### Find this pattern:
```tsx
<View style={styles.settingRow}>
  <View style={styles.settingInfo}>
    <Text style={styles.settingLabel}>Label</Text>
    <Text style={styles.settingDescription}>Description</Text>
  </View>
  <Switch ... />
</View>
```

### Replace with:
```tsx
<View style={styles.settingCard}>
  <View style={styles.settingRow}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>Label</Text>
      <Text style={styles.settingDescription}>Description</Text>
    </View>
    <Switch ... />
  </View>
</View>
```

## Files That Need This Fix

1. `src/screens/settings/NotificationSettingsScreen.tsx` - ~9 settings to wrap
2. `src/screens/settings/AudioSettingsScreen.tsx` - ~5 settings to wrap
3. `src/screens/settings/GameplaySettingsScreen.tsx` - ~3 settings to wrap
4. `src/screens/settings/ThemeSettingsScreen.tsx` - if needed
5. `src/screens/settings/LanguageSettingsScreen.tsx` - if needed
6. `src/screens/settings/AccessibilitySettingsScreen.tsx` - if needed

## Already Done
- ✅ `PrivacySettingsScreen.tsx` - Already has settingCard wrappers
- ✅ `src/styles/settingsStyles.ts` - Unified styles created

## Result
Once all screens have the settingCard wrapper, they will all have:
- Same card background
- Same border radius (12px)
- Same spacing
- Same professional appearance
- **Consistent design across ALL Settings screens**

## Alternative
I can attempt to fix one screen at a time more carefully, or you can apply this simple pattern manually to ensure no JSX errors.
