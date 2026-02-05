# Step-by-Step: Get iOS OAuth Client ID from Firebase

## Method 1: Firebase Console (Easiest)

### Step 1: Open Firebase Project Settings
1. Go to: **https://console.firebase.google.com/project/wittsy-51992/settings/general**
2. You should see the "Project settings" page

### Step 2: Find Your iOS App
1. Scroll down to **"Your apps"** section
2. Look for the iOS app with bundle ID: **com.wittsy.app**
3. You'll see a card that says **"Wittsy iOS"** or similar

### Step 3: Get the iOS Client ID
1. In the iOS app card, click **"See SDK instructions"** button
2. A modal will pop up with setup instructions
3. Look for a section that shows OAuth client IDs
4. Copy the **iOS OAuth 2.0 Client ID**
5. It will look like: `757129696124-xxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`

**Alternative in same page:**
- Sometimes the iOS client ID is shown directly in the app card
- Look for "OAuth 2.0 Client ID" field

---

## Method 2: Google Cloud Console (More Direct)

### Step 1: Open Google Cloud Credentials
1. Go to: **https://console.cloud.google.com/apis/credentials?project=wittsy-51992**
2. This shows all OAuth 2.0 Client IDs for your project

### Step 2: Find iOS Client
1. Look in the **"OAuth 2.0 Client IDs"** section
2. Find the one with Type: **"iOS"**
3. The name might be something like:
   - "iOS client (auto created by Google Service)"
   - "com.wittsy.app"
   - Or just "iOS client"

### Step 3: Copy the Client ID
1. Click on the iOS client name
2. Copy the **"Client ID"** value
3. It starts with: `757129696124-`

---

## Method 3: Download GoogleService-Info.plist (If Methods 1 & 2 Don't Work)

### Step 1: Download Config File
1. Go to: **https://console.firebase.google.com/project/wittsy-51992/settings/general**
2. Scroll to iOS app: **com.wittsy.app**
3. Click **"Download GoogleService-Info.plist"** button

### Step 2: Open the File
1. Open the downloaded `.plist` file in a text editor
2. Look for the key: `CLIENT_ID`
3. The value is your iOS OAuth client ID

---

## What You're Looking For

The iOS OAuth Client ID should look like:
```
757129696124-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
```

Where:
- `757129696124` = Your Firebase project number (we already know this)
- `XXXXXXXXXXXXXXXXXXXXXXXX` = Random string of letters/numbers
- `.apps.googleusercontent.com` = Standard suffix

---

## Once You Have It

Send me the full iOS client ID and I'll update the code if it's different from what I already configured.

**Current configuration uses:**
```
757129696124-0idv372oukrados213f4cuok31fvce4l.apps.googleusercontent.com
```

If the iOS client ID is different, I'll update it immediately.
