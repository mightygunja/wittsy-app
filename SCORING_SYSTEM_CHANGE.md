# WITTSY - Fundamental Scoring System Change

## 🎯 Overview
Complete architectural change from **round-based wins** to **total votes-based wins** across the entire application.

---

## 📋 Changes Summary

### **Old System (Round-Based)**
- Win condition: First to win X rounds (adjustable 5-25)
- Players could join anytime
- Game continued until round limit reached

### **New System (Vote-Based)**
- ✅ Win condition: First to **20 total votes** (FIXED, not adjustable)
- ✅ Join lock: No joins once any player reaches **8 votes**
- ✅ Early end: Game ends if less than **3 players** remain
- ✅ Winner: Player with most votes when game ends early

---

## 🔧 Technical Changes

### **1. Type Definitions** (`src/types/index.ts`)

#### RoomSettings
```typescript
// BEFORE
winningScore: number; // Adjustable

// AFTER
winningVotes: number; // FIXED at 20
joinLockVoteThreshold: number; // FIXED at 8
```

#### PlayerScore
```typescript
// BEFORE
roundWins: number; // Primary win condition
totalVotes: number; // Secondary stat

// AFTER
totalVotes: number; // PRIMARY win condition
roundWins: number; // Kept for stats only
```

---

### **2. Constants** (`src/utils/constants.ts`)

```typescript
// NEW CONSTANTS
export const WINNING_VOTES = 20; // FIXED - total votes to win
export const JOIN_LOCK_THRESHOLD = 8; // FIXED - votes at which joins lock
export const MIN_PLAYERS_ACTIVE = 3; // Minimum to continue game

// REMOVED
// export const DEFAULT_WINNING_SCORE = 10;
```

---

### **3. Database Service** (`src/services/database.ts`)

#### createRoom
- Uses `WINNING_VOTES` (20) instead of `winningScore`
- Adds `joinLockVoteThreshold` (8) to settings
- Score initialization: `{ totalVotes: 0, roundWins: 0, ... }`

#### joinRoom
- **NEW**: Checks if any player has ≥8 votes
- **NEW**: Blocks join if threshold reached
- Error message: `"Game is locked - a player has reached 8 votes"`

---

### **4. Cloud Functions** (`functions/index.js`)

#### startGameLoop
- Checks `maxVotes >= winningVotes` (20) instead of round count
- Checks if `activePlayers < 3`
- Calls `endGameEarly()` if insufficient players

#### progressPhases
- After each round, checks total votes
- Ends game when any player reaches 20 votes
- Checks player count and ends early if needed

#### handleVotingEnd
- Adds votes to `totalVotes` (primary)
- Still tracks `roundWins` for stats
- Logs: `"Player X - Total votes: Y, Round wins: Z"`

#### endGame
- Sorts by `totalVotes` instead of `roundWins`
- Winner = highest total votes

#### endGameEarly (NEW)
- Called when <3 players remain
- Winner = player with most votes
- Saves match with `earlyEnd: true` flag
- Awards win to highest vote holder

---

### **5. UI Components**

#### GameRoomScreen (`src/screens/GameRoomScreen.tsx`)
- In-game scoreboard displays `totalVotes`
- Shows "X votes" instead of just number
- Final scoreboard uses `totalVotes` for ranking

#### CreateRoomScreen (`src/screens/CreateRoomScreen.tsx`)
- **REMOVED**: Winning score input field
- **ADDED**: Fixed display showing "20 votes (Fixed)"
- No longer validates or accepts winning score input

#### ScoreBoard (`src/components/game/ScoreBoard.tsx`)
- Already displays scores correctly
- No changes needed (generic component)

---

## 🎮 Game Flow Changes

### **Starting a Game**
1. Host creates room → `winningVotes: 20` (fixed)
2. Players join → allowed until someone reaches 8 votes
3. Game starts → normal flow

### **During Game**
1. Each round, players vote
2. Votes accumulate in `totalVotes`
3. After each round:
   - Check if anyone has ≥20 votes → END GAME
   - Check if <3 players → END GAME EARLY
   - Otherwise → continue to next round

### **Join Lock Mechanism**
```javascript
// Before each join attempt
const maxVotes = Math.max(...scores.map(s => s.totalVotes));
if (maxVotes >= 8) {
  throw new Error("Game is locked - a player has reached 8 votes");
}
```

### **Early Game End**
```javascript
// After each round
const activePlayers = players.filter(p => p.isConnected).length;
if (activePlayers < 3) {
  await endGameEarly(roomId, 'Insufficient players');
  // Winner = player with most votes
}
```

---

## 📊 Scoring Display

### **In-Game Scoreboard**
```
👑 Player1    15 votes
🥈 Player2    12 votes
🥉 Player3     8 votes
   Player4     5 votes
```

### **Final Results**
```
GAME OVER!
Winner: Player1 with 20 votes

SCOREBOARD
👑 Player1 - 20 votes
🥈 Player2 - 15 votes
🥉 Player3 - 12 votes
```

---

## 🚨 Breaking Changes

### **For Existing Rooms**
- Old rooms with `winningScore` will need migration
- Or: Add fallback in Cloud Functions to use `winningVotes || winningScore`

### **For UI**
- Any hardcoded references to "rounds" or "score" need updating
- Leaderboards should use `totalVotes` for ranking

### **For Stats**
- User stats still track `roundsWon` for historical data
- New primary metric: `totalVotes`

---

## ✅ Testing Checklist

- [ ] Create new room → verify winningVotes = 20
- [ ] Join room → verify join allowed
- [ ] Play until someone reaches 8 votes
- [ ] Try to join → verify blocked with error message
- [ ] Continue playing until 20 votes
- [ ] Verify game ends correctly
- [ ] Have 2 players leave during game
- [ ] Verify early end with highest vote winner
- [ ] Check scoreboard displays votes correctly
- [ ] Verify Cloud Functions logs show correct logic

---

## 🔄 Migration Path

### **For Existing Data**
```javascript
// Add to Cloud Function or migration script
if (!room.settings.winningVotes) {
  room.settings.winningVotes = 20;
  room.settings.joinLockVoteThreshold = 8;
}
```

### **For Old Scores**
```javascript
// Ensure totalVotes is primary
if (score.roundWins && !score.totalVotes) {
  score.totalVotes = score.roundWins * 5; // Rough conversion
}
```

---

## 📝 Key Files Modified

1. ✅ `src/types/index.ts` - Type definitions
2. ✅ `src/utils/constants.ts` - Game constants
3. ✅ `src/services/database.ts` - Room creation & joining
4. ✅ `functions/index.js` - Game loop & win conditions
5. ✅ `src/screens/GameRoomScreen.tsx` - Score display
6. ✅ `src/screens/CreateRoomScreen.tsx` - Room settings UI

---

## 🎯 Summary

**The game now:**
- Wins are based on **total votes** (20 to win)
- Joins lock at **8 votes** to prevent late joiners
- Games end early if **<3 players** remain
- Winner is always **highest vote count**
- Settings are **fixed** (not adjustable by users)

**This ensures:**
- Fair gameplay (no late-game joins)
- Consistent experience (fixed targets)
- Quick resolution (early end if players leave)
- Clear win condition (total votes, not rounds)

---

## 🚀 Deployment

1. Deploy Cloud Functions: `firebase deploy --only functions`
2. Deploy Firestore rules (if needed)
3. Update app and test thoroughly
4. Monitor logs for any issues

**Status:** ✅ COMPLETE - Ready for testing
