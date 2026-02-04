# 🔧 Settings Navigation Crash - Analysis & Fix

## Crash Log Analysis

### **Crash Details:**
- **Exception:** `EXC_BAD_ACCESS (SIGSEGV)`
- **Signal:** Segmentation fault: 11
- **Faulting Thread:** Thread 3 (com.meta.react.turbomodulemanager.queue)
- **Location:** React Native TurboModule system

### **Stack Trace (Key Frames):**
```
hermes::vm::HiddenClass::findProperty
hermes::vm::JSObject::getComputedPrimitiveDescriptor
hermes::vm::JSObject::getComputedWithReceiver_RJS
hermes::vm::getMethod
hermes::vm::toPrimitive_RJS
hermes::vm::toPropertyKey
hermes::vm::JSObject::putComputedWithReceiver_RJS
facebook::hermes::HermesRuntimeImpl::setPropertyValue
facebook::jsi::Object::setProperty
facebook::react::TurboModuleConvertUtils::convertNSExceptionToJSError
facebook::react::ObjCTurboModule::performVoidMethodInvocation
```

### **Root Cause:**
The crash occurs when React Native's TurboModule system tries to:
1. Convert an NSException to a JavaScript error
2. Set a property on a JavaScript object
3. Access a property that doesn't exist (null pointer at address 0x15)

This happens when:
- A native module throws an exception
- The exception handler tries to create a JS error object
- The error object creation fails because a required property is missing

### **Likely Trigger:**
Settings screens are trying to use a native module (likely `@react-native-async-storage/async-storage` or a settings-related module) that either:
1. Isn't properly linked in the build
2. Throws an exception that can't be properly converted to JS
3. Has a corrupted state

---

## 🔍 Investigation

### **Settings Screens Using Native Modules:**

All settings screens use:
- `useSettings()` hook → `SettingsContext`
- `AsyncStorage` for persistence
- `Appearance` API for system theme

### **Potential Issues:**

1. **AsyncStorage Not Properly Initialized**
   - Settings try to load from AsyncStorage on mount
   - If AsyncStorage throws exception, crash occurs

2. **Appearance API Issue**
   - ThemeSettingsScreen listens to system theme changes
   - Appearance.addChangeListener might fail

3. **Settings Context State Corruption**
   - If default settings have undefined values
   - Native modules can't handle undefined properly

---

## ✅ Fix Applied

### **1. Add Error Boundaries to Settings Screens**

The crash happens because there's no error boundary catching the native module exception.

**File:** `src/contexts/SettingsContext.tsx`

**Changes:**
- Wrap AsyncStorage calls in try-catch
- Provide fallback default settings
- Add error logging
- Prevent crash propagation

### **2. Defensive Programming in Settings Context**

**Problem:** If AsyncStorage fails to load, settings become undefined

**Fix:** Always return valid default settings

---

## 🛠️ Implementation

### **Fix 1: Wrap AsyncStorage Calls**

```typescript
// In SettingsContext.tsx
const loadSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings({ ...DEFAULT_USER_SETTINGS, ...parsed });
    } else {
      setSettings(DEFAULT_USER_SETTINGS);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Use defaults on error
    setSettings(DEFAULT_USER_SETTINGS);
  } finally {
    setIsLoading(false);
  }
};
```

### **Fix 2: Safe Appearance Listener**

```typescript
// In SettingsContext.tsx
useEffect(() => {
  if (settings.theme.useSystemTheme) {
    try {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // Handle theme change
      });
      return () => subscription?.remove();
    } catch (error) {
      console.error('Failed to add appearance listener:', error);
    }
  }
}, [settings.theme.useSystemTheme]);
```

### **Fix 3: Validate Settings Before Save**

```typescript
const saveSettings = async (newSettings: UserSettings) => {
  try {
    // Validate settings object
    if (!newSettings || typeof newSettings !== 'object') {
      throw new Error('Invalid settings object');
    }
    
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    // Don't crash, just log error
  }
};
```

---

## 📝 Actual Fix Needed

Based on the crash log, the issue is in the TurboModule error conversion. This suggests:

**The real problem:** A native module is throwing an exception that can't be properly serialized to JavaScript.

**Most likely culprit:** AsyncStorage or Appearance API

**Solution:** Add error boundaries and safe defaults

---

## 🔧 Code Changes Required

### **File: `src/contexts/SettingsContext.tsx`**

Need to add:
1. Try-catch around all AsyncStorage calls
2. Try-catch around Appearance listener
3. Fallback to defaults on any error
4. Error logging for debugging

### **File: Settings screens**

Need to add:
1. Error boundary component
2. Loading states
3. Fallback UI if settings fail to load

---

## ⚠️ Why This Crash Happens

1. **User navigates to Settings**
2. **Settings screen mounts**
3. **useSettings() hook called**
4. **SettingsContext tries to load from AsyncStorage**
5. **AsyncStorage throws native exception** (maybe permission issue, corrupted data, etc.)
6. **React Native tries to convert exception to JS error**
7. **Error conversion fails** (missing property in error object)
8. **Segmentation fault** (null pointer dereference at 0x15)

---

## 🚀 Immediate Action Required

The crash is in native code (Hermes VM / TurboModule), so we need to:

1. **Add defensive error handling** in SettingsContext
2. **Add error boundaries** around settings screens
3. **Validate all AsyncStorage operations**
4. **Provide safe defaults** if anything fails

---

## 📋 Files to Modify

1. `src/contexts/SettingsContext.tsx` - Add error handling
2. `src/screens/EnhancedSettingsScreen.tsx` - Add error boundary
3. All settings sub-screens - Add error boundaries

---

## Status

⚠️ **CRITICAL BUG** - App crashes on settings navigation

**Cause:** Native module exception in TurboModule system  
**Location:** AsyncStorage or Appearance API  
**Impact:** App unusable for settings  
**Priority:** HIGH  

**Fix Required:** Error handling in SettingsContext

---

**Date:** February 2, 2026  
**Severity:** CRITICAL  
**Status:** Fix in progress
