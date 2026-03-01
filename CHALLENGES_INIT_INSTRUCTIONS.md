# 🎯 Initialize Challenges in Firestore

## Option 1: Using Firebase Console (Recommended for now)

Since the service account key isn't set up yet, you can manually add a few test challenges:

1. Go to [Firebase Console](https://console.firebase.google.com/project/wittsy-51992/firestore)
2. Navigate to Firestore Database
3. Create a new collection called `challenges`
4. Add these test documents:

### Daily Challenge Example:
```json
{
  "title": "Daily Player",
  "description": "Play 3 games today",
  "type": "daily",
  "category": "games",
  "goal": 3,
  "startDate": "2025-12-23T00:00:00.000Z",
  "endDate": "2025-12-24T00:00:00.000Z",
  "rewards": {
    "coins": 50,
    "xp": 25
  },
  "difficulty": "easy",
  "active": true
}
```

### Weekly Challenge Example:
```json
{
  "title": "Weekly Warrior",
  "description": "Win 10 games this week",
  "type": "weekly",
  "category": "wins",
  "goal": 10,
  "startDate": "2025-12-23T00:00:00.000Z",
  "endDate": "2025-12-30T00:00:00.000Z",
  "rewards": {
    "coins": 200,
    "xp": 100,
    "items": ["badge_weekly_warrior"]
  },
  "difficulty": "medium",
  "active": true
}
```

## Option 2: Using Admin SDK (When Ready)

1. Download your Firebase service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in the root directory

2. Run the initialization script:
```bash
cd wittsy-app
node scripts/initChallenges.js
```

This will create all 23 challenges automatically.

## What Gets Created

- **5 Daily Challenges** - Reset every 24 hours
- **6 Weekly Challenges** - Reset every Monday
- **4 Seasonal Challenges** - Tied to Battle Pass (60 days)
- **5 Skill Challenges** - Permanent, test player abilities
- **3 Social Challenges** - Encourage community engagement

**Total: 23 Challenges**

## Testing

After adding challenges, test in the app:
1. Navigate to Challenges screen from home
2. Switch between tabs (Daily, Weekly, Seasonal, Skill, Social)
3. Check that challenges load correctly
4. Progress tracking will be implemented when game tracking is added
