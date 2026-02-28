# Quick Fix for Settings Consistency

## The Issue
NotificationSettingsScreen, AudioSettingsScreen, and other Settings screens are using bare `settingRow` without the `settingCard` wrapper, making them look different from PrivacySettingsScreen.

## The Pattern

Every setting toggle needs to be wrapped in `settingCard`:

```tsx
// WRAP EACH SETTING IN settingCard
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

## Quick Manual Fix

For each Settings screen:

1. Find all `<View style={styles.settingRow}>` 
2. Wrap each one with `<View style={styles.settingCard}>`
3. Close with `</View>` after the settingRow closes

## Example

**BEFORE:**
```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Title</Text>
  
  <View style={styles.settingRow}>
    ...content...
  </View>
  
  <View style={styles.settingRow}>
    ...content...
  </View>
</View>
```

**AFTER:**
```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Title</Text>
  
  <View style={styles.settingCard}>
    <View style={styles.settingRow}>
      ...content...
    </View>
  </View>
  
  <View style={styles.settingCard}>
    <View style={styles.settingRow}>
      ...content...
    </View>
  </View>
</View>
```

This will make all Settings screens have the same card-based design with consistent spacing, borders, and backgrounds.
