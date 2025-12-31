# 🔥 Firestore Indexes Required

## ⚠️ **ACTION REQUIRED**

Your app needs Firestore composite indexes to run queries. Follow these steps:

---

## 📋 **Required Indexes**

### **1. Prompts Collection Index**

**Fields:**
- `category` (Ascending)
- `status` (Ascending)
- `timesUsed` (Ascending)
- `__name__` (Ascending)

**Create here:**
https://console.firebase.google.com/v1/r/project/wittsy-51992/firestore/indexes?create_composite=Ckxwcm9qZWN0cy93aXR0c3ktNTE5OTIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb21wdHMvaW5kZXhlcy9fEAEaDAoIY2F0ZWdvcnkQARoKCgZzdGF0dXMQARoNCgl0aW1lc1VzZWQQAhoMCghfX25hbWVfXxAC

---

### **2. Prompt Packs Collection Index**

**Fields:**
- `downloadCount` (Ascending)
- `availableUntil` (Ascending)
- `__name__` (Ascending)

**Create here:**
https://console.firebase.google.com/v1/r/project/wittsy-51992/firestore/indexes?create_composite=ClBwcm9qZWN0cy93aXR0c3ktNTE5OTIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb21wdFBhY2tzL2luZGV4ZXMvXxABGhEKDWRvd25sb2FkQ291bnQQAhoSCg5hdmFpbGFibGVVbnRpbBACGgwKCF9fbmFtZV9fEAI

---

## 🚀 **Quick Setup Steps**

### **Option 1: Click the Links (Easiest)**

1. Click the first link above
2. Click "Create Index" button
3. Wait 2-5 minutes for index to build
4. Click the second link
5. Click "Create Index" button
6. Wait 2-5 minutes for index to build
7. Restart your app

### **Option 2: Manual Creation**

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **wittsy-51992**
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**

**For Prompts Index:**
- Collection ID: `prompts`
- Add fields:
  - `category` → Ascending
  - `status` → Ascending
  - `timesUsed` → Ascending
  - `__name__` → Ascending
- Click **Create**

**For Prompt Packs Index:**
- Collection ID: `promptPacks`
- Add fields:
  - `downloadCount` → Ascending
  - `availableUntil` → Ascending
  - `__name__` → Ascending
- Click **Create**

---

## ⏱️ **Build Time**

- Small collections: 2-5 minutes
- Large collections: 5-15 minutes
- You'll get an email when indexes are ready

---

## 🔍 **Why Are These Needed?**

Firestore requires composite indexes when you:
- Query with multiple `where()` clauses
- Combine `where()` with `orderBy()`
- Use inequality operators on multiple fields

Your app queries prompts by:
- Category + Status + TimesUsed (for sorting)
- DownloadCount + AvailableUntil (for prompt packs)

---

## ✅ **Verification**

After indexes are built:
1. Restart your Expo app
2. Navigate to Prompt Library
3. Errors should be gone
4. Prompts should load properly

---

## 📝 **For Future Reference**

If you add more complex queries, Firebase will tell you:
- What index is needed
- Provide a direct link to create it
- Just click the link and create the index

---

## 🆘 **Troubleshooting**

**Index still building?**
- Wait a few more minutes
- Check Firebase Console → Firestore → Indexes
- Look for "Building" status

**Still getting errors?**
- Clear app cache
- Restart Expo server
- Check Firebase Console for index status

**Need more indexes?**
- Firebase will provide the exact link in error messages
- Click the link and create the index

---

## 🎯 **Current Status**

- ⏳ **Prompts Index**: Not created yet
- ⏳ **Prompt Packs Index**: Not created yet

**Action:** Click the links above to create them now!

---

**Once indexes are created, your app will work perfectly!** 🚀
