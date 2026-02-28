# Settings Screens - Final Consistency Plan

## Current Problem
Privacy & Notifications look totally different from Audio, Theme, Gameplay, etc.
- Different spacing
- Different colors  
- Different shading
- Different card styles

## Root Cause
Only PrivacySettingsScreen was partially updated. All other screens still use:
- Old custom styles
- `Card` components with different variants
- Inconsistent spacing and colors

## Solution
Apply the unified `settingsStyles.ts` to ALL 7 Settings screens:

1. PrivacySettingsScreen ✅ (needs re-applying)
2. NotificationSettingsScreen ✅ (needs re-applying)
3. AudioSettingsScreen ❌
4. GameplaySettingsScreen ❌
5. ThemeSettingsScreen ❌
6. LanguageSettingsScreen ❌
7. AccessibilitySettingsScreen ❌

## Implementation Steps

For each screen:
1. Import `createSettingsStyles` from `../../styles/settingsStyles`
2. Import `SPACING` from `../../utils/constants`
3. Replace `createStyles` with `createSettingsStyles`
4. Replace all `<Card>` components with `<View style={styles.settingCard}>`
5. Ensure all settings use consistent structure:
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

## Expected Result
ALL Settings screens will have:
- Same card background (COLORS.surface)
- Same border radius (12px)
- Same border (1px COLORS.border)
- Same padding (SPACING.md)
- Same spacing between cards (SPACING.sm)
- Same typography
- **Consistent, professional appearance across all screens**
