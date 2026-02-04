# Settings Screens Consistency Fix

## Problem
User reports that Settings subscreens look totally different from each other:
- Notifications screen looks different from Audio & Sound
- Privacy & Security looks different from both

## Root Cause
Each Settings screen was using different styling approaches:
- Some use bare `settingRow` with bottom borders
- Some use `Card` components
- Some use custom styling
- **None were using the unified `settingCard` wrapper consistently**

## Solution
Apply unified `settingsStyles.ts` to ALL Settings screens with consistent `settingCard` wrappers.

### Pattern to Apply

**BEFORE (Inconsistent):**
```tsx
<View style={styles.settingRow}>
  <View style={styles.settingInfo}>
    <Text style={styles.settingLabel}>Setting Name</Text>
    <Text style={styles.settingDescription}>Description</Text>
  </View>
  <Switch value={value} onValueChange={handler} />
</View>
```

**AFTER (Consistent with settingCard wrapper):**
```tsx
<View style={styles.settingCard}>
  <View style={styles.settingRow}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>Setting Name</Text>
      <Text style={styles.settingDescription}>Description</Text>
    </View>
    <Switch value={value} onValueChange={handler} />
  </View>
</View>
```

## Files to Update

1. ✅ **PrivacySettingsScreen.tsx** - DONE (using settingCard)
2. ⏳ **NotificationSettingsScreen.tsx** - Needs settingCard wrappers
3. ⏳ **AudioSettingsScreen.tsx** - Needs settingCard wrappers  
4. ⏳ **GameplaySettingsScreen.tsx** - Needs settingCard wrappers
5. ⏳ **ThemeSettingsScreen.tsx** - Needs settingCard wrappers
6. ⏳ **LanguageSettingsScreen.tsx** - Needs settingCard wrappers
7. ⏳ **AccessibilitySettingsScreen.tsx** - Needs settingCard wrappers

## Unified Design
All Settings screens will have:
- Same card background (COLORS.surface)
- Same border radius (12px)
- Same border (1px COLORS.border)
- Same padding (SPACING.md)
- Same spacing between cards (SPACING.sm)
- Same section titles
- Same typography
