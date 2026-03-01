# 🎯 Wittsy Challenges System

## Game Mechanics Reference
- **Single Round:** Max 11 points (if you're the only correct player in a 12-player room)
- **Game Win:** First player to reach 20 points wins
- **Typical Game:** 2-4 rounds to reach 20 points

---

## Challenge Types

### 📅 Daily Challenges (5 active)
Reset every 24 hours at midnight

| Challenge | Description | Goal | Rewards | Difficulty |
|-----------|-------------|------|---------|------------|
| Daily Player | Play 3 games today | 3 games | 50 coins, 25 XP | Easy |
| Daily Winner | Win 2 games today | 2 wins | 75 coins, 35 XP | Medium |
| Big Round | Score 8+ points in a single round | 8 points | 100 coins, 50 XP | Hard |
| Play with Friends | Play 2 games with friends | 2 games | 60 coins, 30 XP | Easy |
| Category Explorer | Play with 3 different categories | 3 categories | 80 coins, 40 XP | Medium |

### 📆 Weekly Challenges (6 active)
Reset every Monday at midnight

| Challenge | Description | Goal | Rewards | Difficulty |
|-----------|-------------|------|---------|------------|
| Weekly Warrior | Win 10 games this week | 10 wins | 200 coins, 100 XP, Badge | Medium |
| Marathon Player | Play 25 games this week | 25 games | 250 coins, 125 XP | Hard |
| Win Streak | Win 3 games in a row | 3 streak | 150 coins, 75 XP, Badge | Hard |
| Prompt Creator | Submit 3 prompts this week | 3 prompts | 100 coins, 50 XP, Badge | Easy |
| Social Butterfly | Play with 5 different friends | 5 friends | 175 coins, 85 XP | Medium |
| Dominant Player | Score 10+ in a round 5 times | 5 times | 300 coins, 150 XP, Badge | Hard |

### 🏆 Seasonal Challenges (4 active)
Tied to Battle Pass season (60 days)

| Challenge | Description | Goal | Rewards | Difficulty |
|-----------|-------------|------|---------|------------|
| Season Champion | Win 50 games this season | 50 wins | 500 coins, 250 XP, 50 gems, Title, Badge | Hard |
| Battle Pass Master | Reach Battle Pass level 25 | Level 25 | 300 coins, 150 XP, 25 gems | Medium |
| Completionist | Complete 20 daily challenges | 20 challenges | 400 coins, 200 XP, Title | Hard |
| Season Grinder | Play 100 games this season | 100 games | 600 coins, 300 XP, 75 gems | Hard |

### 🎓 Skill Challenges (5 permanent)
Test player abilities - no expiration

| Challenge | Description | Goal | Rewards | Difficulty |
|-----------|-------------|------|---------|------------|
| Speed Demon | Answer correctly in under 3 seconds | 1 time | 150 coins, 75 XP, Badge | Hard |
| Perfect Round | Score 11 points in a single round | 11 points | 200 coins, 100 XP, Badge | Hard |
| Flawless Victory | Win with all correct answers | 1 game | 250 coins, 125 XP, Badge | Hard |
| Comeback King | Win after being 10+ points behind | 1 game | 175 coins, 85 XP, Badge | Hard |
| Quick Win | Win in 2 rounds or less | 1 game | 200 coins, 100 XP, Badge | Hard |

### 👥 Social Challenges (3 active)
Encourage community engagement

| Challenge | Description | Goal | Rewards | Difficulty |
|-----------|-------------|------|---------|------------|
| Friend Finder | Add 3 new friends | 3 friends | 100 coins, 50 XP | Easy |
| Room Creator | Create 5 custom rooms | 5 rooms | 75 coins, 35 XP | Easy |
| Invite Master | Invite 3 players to Wittsy | 3 invites | 300 coins, 150 XP, 25 gems, Badge | Medium |

---

## Challenge Categories

Challenges track progress in these categories:
- `games` - Games played
- `wins` - Games won
- `round_score` - Points scored in a single round
- `streak` - Consecutive wins
- `prompts` - Prompts submitted
- `social` - Games with friends
- `variety` - Different categories played
- `battlepass` - Battle Pass level
- `challenges` - Challenges completed
- `speed` - Answer time
- `perfect_game` - All correct answers
- `comeback` - Win from behind
- `quick_win` - Win quickly
- `friends` - Friends added
- `rooms` - Rooms created
- `invites` - Players invited

---

## Initialization

Run this command to populate Firestore with default challenges:

```bash
node scripts/initChallenges.js
```

This will create all 23 challenges in your Firestore database.

---

## Admin Management

Use the admin panel to:
- Create new challenges
- Edit existing challenges
- Activate/deactivate challenges
- View challenge completion stats
- Manage rewards

---

## Automatic Progress Tracking

The game automatically tracks progress for:
- ✅ Games played
- ✅ Games won
- ✅ Round scores
- ✅ Win streaks
- ✅ Prompts submitted
- ✅ Social interactions
- ✅ Battle Pass progress

Progress is updated in real-time and rewards are granted automatically when goals are met.
