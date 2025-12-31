# Wittsy Cloud Functions Deployment Guide

## Setup

1. **Install Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

2. **Deploy Functions**
   ```bash
   firebase deploy --only "functions"
   ```

## Deployed Functions

### Game Logic Functions

1. **onRoomStatusChange** - Triggers when room status changes to 'active'
   - Starts the game loop
   - Manages phase progression
   - Handles round timing

2. **updateLeaderboard** - Updates leaderboard when user stats change
   - Triggers on user document updates
   - Maintains leaderboard rankings

3. **cleanupOldRooms** - Scheduled function (runs daily)
   - Removes finished rooms older than 24 hours

## Game Flow

### Round Progression:
1. **Prompt Phase** (3s) - Display prompt
2. **Submission Phase** (25s) - Players submit phrases
3. **Waiting Phase** (5s) - Shuffle and prepare
4. **Voting Phase** (10s) - Players vote
5. **Results Phase** (8s) - Show winner and scores

### Automatic Features:
- ✅ Phase countdown timers
- ✅ Automatic phase transitions
- ✅ Vote counting and winner calculation
- ✅ Star detection (6+ votes)
- ✅ XP distribution
- ✅ Score updates
- ✅ Game winner detection
- ✅ Match history saving

## XP Rewards

- **Round Participation**: 10 XP
- **Round Win**: 25 XP
- **Game Win**: 100 XP
- **Star Achievement**: 50 XP bonus
- **Voting**: 5 XP

## Testing

1. Create a room with 3+ players
2. Host starts the game
3. Functions automatically handle:
   - Phase progression
   - Timer countdowns
   - Vote calculation
   - Score updates
   - Game end

## Troubleshooting

### View Function Logs
```bash
firebase functions:log
```

### Test Locally with Emulator
```bash
firebase emulators:start --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:onRoomStatusChange
```

## Next Steps

The functions are now deployed and will automatically:
1. Start games when host clicks "Start Game"
2. Progress through all 5 phases with timers
3. Calculate winners and update scores
4. Award XP and update leaderboards
5. End games and save match history

Players just need to:
- Submit phrases during submission phase
- Vote during voting phase
- Everything else is automated!
