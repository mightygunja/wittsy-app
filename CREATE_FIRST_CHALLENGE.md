# CREATE FIRST CHALLENGE - DO THIS NOW

The seeding won't work until the collection exists. You need to manually create ONE challenge first.

## Go to Firebase Console:
https://console.firebase.google.com/project/wittsy-51992/firestore/data/~2Fchallenges

## Click "Start collection"
Collection ID: `challenges`

## Add first document:
Document ID: (Auto-ID)

**Fields:**
```
title (string): Daily Player
description (string): Play 3 games today
type (string): daily
category (string): games
goal (number): 3
difficulty (string): easy
startDate (string): 2025-12-23T00:00:00.000Z
endDate (string): 2025-12-24T00:00:00.000Z
active (boolean): true
rewards (map):
  coins (number): 50
  xp (number): 25
```

## After you create this ONE document:
1. The collection will exist
2. Reload the app
3. The seed function will add the remaining 7 challenges automatically

This is the ONLY manual step needed. After this, everything is automatic.
