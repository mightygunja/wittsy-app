# **WITTSY - Complete Feature Specification**
## **Modern Real-Time Witty Phrase Battle Game**

---

## **📋 EXECUTIVE SUMMARY**

**Platform:** Cross-platform (Web, iOS, Android)  
**Tech Stack:** React Native + Firebase  
**Core Gameplay:** Real-time phrase creativity competition with anonymous voting  
**Target:** 12 players max per room, fast-paced rounds, global rankings  

**Development Order:** This document is organized by implementation phases, from MVP foundation to post-launch enhancements.

---

## **🛠️ PHASE 1: FOUNDATION & TECHNICAL SETUP**

### **1.1 React Native Project Setup**

#### **Project Structure**
```
/wittsy-app
  /src
    /components
      /common (Button, Input, Card, Modal)
      /game (Timer, PhraseCard, VoteButton)
      /lobby (PlayerAvatar, RoomCard)
      /profile (StatCard, AchievementBadge)
    /screens
      AuthScreen.js
      HomeScreen.js
      BrowseRoomsScreen.js
      CreateRoomScreen.js
      GameRoomScreen.js
      ProfileScreen.js
      LeaderboardScreen.js
      SettingsScreen.js
    /navigation
      AppNavigator.js
      AuthNavigator.js
      MainNavigator.js
    /services
      firebase.js ✅ (DONE)
      auth.js ✅ (DONE)
      database.js
      realtime.js
      storage.js
      notifications.js
    /hooks
      useAuth.js
      useGameRoom.js
      useLeaderboard.js
      useRealtime.js
    /utils
      helpers.js
      constants.js
      validation.js
    /context
      AuthContext.js
      GameContext.js
    /types
      index.ts ✅ (DONE)
    /assets
      /images
      /sounds
      /fonts
```

#### **Key Dependencies**
- ✅ React Native 0.73.2
- ✅ Expo ~50.0.0
- ✅ React Navigation 6.x
- ✅ Firebase SDK 10.7.1
- ✅ Redux Toolkit 2.0.1 or Context API
- ✅ React Native Paper 5.11.3 (UI components)
- ✅ React Native Reanimated 3.6.1
- ✅ React Native Gesture Handler 2.14.1
- TypeScript 5.3.3 ✅

---

### **1.2 Firebase Infrastructure** ✅ **COMPLETE**

#### **Firebase Services Enabled**
- ✅ Authentication (Email, Google, Apple)
- ✅ Firestore Database (8 collections created)
- ✅ Realtime Database (for live game state)
- ✅ Cloud Storage (for avatars)
- ✅ Security Rules (deployed)
- ✅ Firestore Indexes (deployed)
- ✅ 15 Sample Prompts (added)

#### **Collections Created**
- ✅ users
- ✅ rooms
- ✅ prompts
- ✅ matches
- ✅ leaderboards
- ✅ achievements
- ✅ friendRequests
- ✅ chatMessages

---

### **1.3 Authentication System** ✅ **COMPLETE**

#### **Auth Service** (src/services/auth.ts)
- ✅ Email/Password registration
- ✅ Email/Password sign-in
- ✅ Google Sign-In
- ✅ Password reset
- ✅ Sign out
- ✅ Auth state listener
- ✅ Auto-create user profile on registration

**Status:** Backend complete, UI screens needed.

---

## **🎮 PHASE 2: CORE GAMEPLAY MVP**

### **2.1 Game Room Mechanics**

#### **Room Creation & Management**
- **Create Room**
  - Custom room name (2-30 characters)
  - Room privacy settings (Public/Private/Friends-Only)
  - Password protection option
  - Max players: 12
  - Round timer configuration (default: 25s phrase submission, 10s voting)
  - Winning score configuration (default: 10 wins)
  - Custom prompt pack selection
  - Host controls (kick, ban, start/pause game)

#### **Room Discovery & Joining**
- **Browse Rooms List**
  - Active rooms with player count (e.g., "7/12")
  - Room status indicators (Waiting, In Progress, Final Round)
  - Filter by: Public/Friends/Featured
  - Sort by: Most players, Newest, Skill level
  - Quick join button
  - Room preview (current prompt visible for spectators)
  
- **Join Options**
  - Join as Player (if space available)
  - Join as Spectator (unlimited)
  - Quick Match (auto-join best available room)
  - Rejoin previous room (if disconnected)

#### **Spectator Mode**
- Live view of current prompt
- Real-time phrase submissions counter (not content)
- Live voting phase with anonymized phrases
- Winner reveals with animations
- Running scoreboard
- Chat participation
- Option to queue as player when slot opens

---

### **2.2 Game Flow & Round Structure**

#### **Pre-Game Lobby**
- Player avatars in grid/circle layout
- Ready status indicators
- Room settings display
- Host start button (min 3 players required)
- Countdown timer (10 seconds before start)
- Quick chat (pre-game banter)

#### **Round Phases**

**Phase 1: Prompt Display (3 seconds)**
- Full-screen prompt with animation
- Category indicator (if applicable)
- Sound effect
- Countdown begins

**Phase 2: Phrase Submission (25 seconds)**
- Prompt remains visible at top
- Large, focused text input field
- Character limit: 200 characters
- Real-time character counter
- Submit button (enabled when text entered)
- Auto-submit when timer expires
- Typing indicators for other players (to build tension)
- Edit until submitted or timer expires
- Visual timer (progress bar + numeric countdown)

**Phase 3: Waiting Room (0-5 seconds)**
- "Waiting for other players..." if finished early
- Fun animations/facts/quotes
- Players still writing get extra few seconds (grace period)
- Shuffling animation (anonymizing phrases)

**Phase 4: Voting (10 seconds)**
- All phrases displayed anonymously
- Numbered list (1-12)
- Large tap targets for mobile
- Keyboard shortcuts for web (1-9, 0, -, =)
- Cannot vote for own phrase (auto-hidden or grayed)
- Single vote per player
- Vote confirmed with visual feedback
- Visual timer countdown
- Show vote count in real-time (optional setting)

**Phase 5: Results (8 seconds)**
- Winning phrase highlighted with animation
- Author reveal with avatar explosion
- Points awarded animation
- "Star" badge if 6+ votes achieved
- Mini scoreboard update
- Reaction emojis from players
- Next round countdown

#### **Game End**
- Winner celebration screen (confetti, sounds)
- Final scoreboard with all stars earned
- Match summary statistics
- XP/ranking points awarded
- Save favorite phrases option
- Rematch button
- Return to lobby/Browse rooms

---

### **1.3 Voting & Scoring System**

#### **Vote Mechanics**
- 1 vote per player per round
- Cannot vote for self
- Voting is anonymous during voting phase
- Vote locked once submitted (no changes)
- AFK players don't vote (doesn't affect round)

#### **Scoring System**
- **1 point** per vote received
- **Round winner:** Highest vote count
- **Ties:** Both players get the win toward goal
- **Star Achievement:** 6+ votes in single round
  - Special badge/icon on scoreboard
  - Extra 2 bonus points
  - Tracked in profile stats
  - Hall of Fame eligible

#### **Progression**
- First to 10 round wins = Game winner
- XP awarded based on performance
- Ranking points (Elo-style system)
- Achievement unlocks

---

## **🎨 PHASE 3: UI/UX DESIGN & SCREENS**

### **2.1 Design Philosophy**
- **Fast & Fluid:** Instant feedback, smooth animations
- **Mobile-First:** Large tap targets, thumb-friendly zones
- **Clarity:** Zero confusion about current phase
- **Excitement:** Playful but polished, competitive energy
- **Accessibility:** High contrast, readable fonts, color-blind modes

### **2.2 Key Screens & Interfaces**

#### **Landing Page / Home Screen**
- Eye-catching hero section with game preview
- **Primary Actions** (large, prominent buttons):
  - QUICK PLAY (largest, most obvious)
  - BROWSE ROOMS
  - CREATE ROOM
  - PROFILE / AVATAR
- **Secondary Elements:**
  - Global leaderboard preview (Top 10)
  - Featured/Hot rooms carousel
  - Recent achievements ticker
  - Friend activity feed
  - Notifications badge

#### **Game Room UI**

**During Phrase Submission:**
```
┌─────────────────────────────────────┐
│  ROUND 5/∞           ⏱️ 00:18       │
├─────────────────────────────────────┤
│                                     │
│  📝 Prompt: [Large, centered text]  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Your witty phrase here...     │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                         175/200    │
│                                     │
│     [  SUBMIT PHRASE  ]  ← Big!   │
│                                     │
├─────────────────────────────────────┤
│ SCOREBOARD (minimized sidebar)     │
│ 👤 Player1  ★★★  7pts              │
│ 👤 Player2  ★    5pts              │
│ 👤 YOU      ★    4pts              │
└─────────────────────────────────────┘
```

**During Voting:**
```
┌─────────────────────────────────────┐
│  VOTE!              ⏱️ 00:08       │
├─────────────────────────────────────┤
│  📝 Prompt: [Smaller, at top]       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐  │
│  │  1  "Phrase one here..."    │  │ ← Large
│  └─────────────────────────────┘  │   tap zones
│  ┌─────────────────────────────┐  │
│  │  2  "Phrase two here..."    │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │  3  "Your phrase" [DIMMED]  │  │
│  └─────────────────────────────┘  │
│  [... more phrases ...]           │
│                                     │
└─────────────────────────────────────┘
```

**Scoreboard (Always Visible)**
- Collapsible sidebar or bottom drawer
- Player avatars + current score
- Star badges inline
- Current round wins toward goal (e.g., 7/10)
- Visual leader indicator (crown icon)

---

### **2.3 Visual Design Elements**

#### **Color Palette**
- Primary: Vibrant, energetic (Purple/Electric Blue/Coral)
- Secondary: Complementary accents
- Neutral: Clean backgrounds (dark mode + light mode)
- Success: Green for correct submissions
- Alert: Yellow for timers, Red for warnings
- Star: Gold/Shimmering effect

#### **Typography**
- Prompts: Large, bold, serif or display font
- Phrases: Clean, readable sans-serif (18-20px mobile)
- UI: Modern sans-serif (14-16px)
- Timers: Bold, monospace

#### **Animations & Effects**
- **Micro-interactions:**
  - Button press feedback (scale, ripple)
  - Submission success (checkmark animation)
  - Vote selection (glow effect)
  
- **Transitions:**
  - Phase changes (smooth fade/slide)
  - Scoreboard updates (number roll-up)
  - Winner reveal (spotlight effect)
  
- **Celebrations:**
  - Star achievement (particle burst)
  - Game win (confetti, avatar bounce)
  - Personal best (badge unlock animation)

#### **Sound Design**
- Prompt reveal: Anticipatory chime
- Tick-tock: Last 5 seconds of timer
- Submission: Satisfying "send" sound
- Voting: Soft click
- Winner reveal: Triumphant fanfare
- Star achievement: Special jingle
- Mute toggle easily accessible

---

## **👤 PHASE 4: USER PROFILE & IDENTITY**

### **3.1 Avatar System**

#### **Avatar Creator**
- **Component-based customization:**
  - Face shape (8 options)
  - Skin tone (12 options)
  - Hairstyle (20+ options)
  - Hair color (full spectrum)
  - Eyes (15 styles)
  - Mouth/expression (10 options)
  - Accessories (hats, glasses, etc.)
  - Background shape/color
  
- **Unlockable Items:**
  - Earn through gameplay
  - Achievement rewards
  - Seasonal/event items
  - Premium items (optional monetization)

#### **Profile Display**
- Avatar prominently displayed
- Username (unique, 3-20 chars)
- Title/Badge (earned through achievements)
- Level indicator
- Join date
- Home region (optional)

---

### **3.2 Statistics & Achievements**

#### **Core Stats**
- **Games Played:** Total matches
- **Win Rate:** % of games won
- **Total Wins:** Number of game victories
- **Total Rounds Won:** Individual round victories
- **Stars Earned:** Total 6+ vote rounds
- **Average Votes:** Per phrase
- **Voting Accuracy:** % aligned with winner
- **Submission Rate:** % of rounds participated
- **Favorite Categories:** Most successful prompt types

#### **Advanced Stats**
- **Best Winning Streak:** Consecutive game wins
- **Longest Phrase:** Character count
- **Shortest Winning Phrase:** Character count
- **Comeback King:** Wins from behind
- **Close Calls:** Narrow victories (1-2 vote margin)

#### **Achievement System**
- **Starter Achievements:**
  - First Game
  - First Win
  - First Star
  - Voter's Badge (100 votes cast)
  
- **Skill Achievements:**
  - Superstar (10 stars earned)
  - Unanimous (all votes in a round)
  - Perfectionist (win without losing a round)
  - Speed Demon (submit in <5 seconds)
  
- **Social Achievements:**
  - Host with the Most (host 25 games)
  - Friend Maker (play with 10 friends)
  - Crowd Pleaser (spectator favorite)
  
- **Milestone Achievements:**
  - 100 / 500 / 1000 games played
  - 50 / 100 / 250 total wins
  - Level 10 / 25 / 50 / 100

---

### **3.3 Leveling & Progression**

#### **XP System**
- **XP Sources:**
  - Round participation: 10 XP
  - Round win: 25 XP
  - Game win: 100 XP
  - Star achievement: 50 XP bonus
  - First game of day: 20 XP bonus
  - Voting participation: 5 XP
  
- **Level Curve:**
  - Level 1-10: 100 XP per level
  - Level 11-25: 250 XP per level
  - Level 26-50: 500 XP per level
  - Level 51+: 1000 XP per level

#### **Level Rewards**
- Avatar items unlock
- Title unlocks
- Special room themes
- Prompt pack access
- Profile customization options

---

## **🏆 PHASE 5: RANKINGS & LEADERBOARDS**

### **4.1 Ranking System**

#### **Elo-Style Rating**
- Starting rating: 1200
- Win/Loss affects rating
- Opponent rating considered
- Decay for inactivity (optional)
- Separate ratings by game mode (future)

#### **Rank Tiers**
- **Bronze:** 0-999
- **Silver:** 1000-1399
- **Gold:** 1400-1799
- **Platinum:** 1800-2199
- **Diamond:** 2200-2599
- **Master:** 2600-2999
- **Legend:** 3000+

Each tier has 5 divisions (e.g., Silver III, Silver II, Silver I)

---

### **4.2 Leaderboard Types**

#### **Global Leaderboard**
- Top 100 players worldwide
- Sortable by:
  - Highest rating
  - Most wins
  - Most stars
  - Win rate (min 50 games)
- Updated real-time

#### **Regional Leaderboards**
- Country-specific rankings
- State/Province rankings (for major regions)
- City rankings (for large metro areas)
- User can set home region in profile

#### **Friend Leaderboard**
- Compare stats with friends only
- Private competition
- Weekly/Monthly resets option

#### **Specialized Leaderboards**
- **Hall of Fame:** Best single phrases (by votes)
- **Star Leaders:** Most stars earned all-time
- **Streak Masters:** Longest win streaks
- **Weekly Champions:** Top performers this week
- **Rising Stars:** Biggest rating gains (last 30 days)

#### **Season Leaderboards**
- 3-month seasons
- Special rewards for top finishers
- Season badges/titles
- Rating soft reset between seasons

---

## **🎯 PHASE 6: PROMPT SYSTEM EXPANSION**

### **5.1 Prompt Management**

#### **Prompt Database**
- 1000+ launch prompts minimum
- Categorized for variety
- Rated for difficulty
- Flagging system for inappropriate prompts
- Community submission system (moderated)

#### **Prompt Categories**
- **Funny:** Comedy-focused setups
- **Clever:** Wordplay and wit
- **Pop Culture:** References and parodies
- **Situations:** Hypothetical scenarios
- **Comparisons:** "X is like Y because..."
- **Definitions:** "Define: [unusual word]"
- **Roasts:** Playful insults (age-gated)
- **Wholesome:** Positive/uplifting
- **Weird:** Absurd and random
- **Seasonal:** Holiday/event-specific

#### **Prompt Packs**
- **Default Pack:** Curated balanced mix
- **Themed Packs:** 
  - Movies & TV
  - Gaming
  - Internet Culture
  - Science & Tech
  - Food & Drink
  - Animals
  - 90s/2000s Nostalgia
  
- **Custom Packs:**
  - Users create private packs
  - Shareable via code
  - Featured community packs

#### **Prompt Selection Logic**
- Random from selected pack(s)
- No repeat within game session
- Difficulty balancing (optional)
- Category rotation guarantee

---

### **5.2 Content Moderation**

#### **Profanity Filter**
- Configurable room setting (Off/Medium/Strict)
- Smart filtering (context-aware)
- Masked display option (e.g., "f***")

#### **Phrase Reporting**
- Report button during/after round
- Reasons: Offensive, Spam, Gibberish, Other
- Auto-review for multiple reports
- Moderator queue
- User penalties for violations

#### **Community Guidelines**
- Clear terms of service
- Zero tolerance for hate speech
- Strike system (3 strikes = temp ban)
- Appeal process

---

## **👥 PHASE 7: SOCIAL & COMMUNITY FEATURES**

### **6.1 Friends System**

#### **Friend Management**
- Add friends by username
- Friend requests with accept/decline
- Friends list with online status
- Recent players list
- Block/unfriend options

#### **Friend Features**
- Invite to room (push notification)
- Private rooms for friends only
- Friend leaderboards
- See friend activity (games, achievements)
- Friend match history

---

### **6.2 In-Game Communication**

#### **Chat System**
- **Lobby Chat:** Pre-game and between rounds
- **Spectator Chat:** For viewers
- **Post-Game Chat:** After match
- **Emoji Reactions:** Quick responses
- **Mute Options:** Individual or all
- **Chat Filters:** Profanity blocking

#### **Quick Chat**
- Pre-written phrases
- "Nice one!"
- "LOL"
- "That was clever!"
- "Time's almost up!"
- "Good game!"
- Accessible via button grid

#### **Emotes & Reactions**
- Avatar animations (thumbs up, laugh, clap)
- Timed appropriately (don't distract during submission)
- Can be disabled in settings

---

### **6.3 Community Features**

#### **Featured Content**
- Daily/Weekly challenges
- Prompt of the day
- Player spotlights
- Best phrase showcase
- Trending rooms

#### **Events & Tournaments**
- Scheduled tournaments
- Bracket system
- Prize pools (XP, exclusive items)
- Spectator mode for finals
- Tournament history

#### **User-Generated Content**
- Submit prompts for approval
- Create custom prompt packs
- Share room recordings (opt-in)
- Community voting on best prompts

---

## **⚙️ PHASE 8: SETTINGS & CUSTOMIZATION**

### **7.1 Game Settings**

#### **Room Host Settings**
- Max players (3-12)
- Round timer (15-60 seconds)
- Voting timer (5-30 seconds)
- Winning score (5-25 rounds)
- Prompt packs selection
- Profanity filter level
- Spectator chat enabled
- Allow join mid-game

#### **Personal Settings**
- **Display:**
  - Theme (Dark/Light/Auto)
  - Color blind mode
  - Reduced animations
  - Font size adjustment
  
- **Audio:**
  - Master volume
  - Music volume
  - SFX volume
  - Voice chat (future)
  - Individual mute controls
  
- **Gameplay:**
  - Auto-submit on timer
  - Show real-time vote counts
  - Keyboard shortcuts
  - Haptic feedback (mobile)
  
- **Privacy:**
  - Profile visibility (Public/Friends/Private)
  - Show online status
  - Allow friend requests
  - Show region
  - Allow spectators in my games
  
- **Notifications:**
  - Friend invites
  - Game starting
  - Your turn
  - Achievement unlocks
  - Friend activity

---

### **7.2 Accessibility Features**

- Screen reader support
- High contrast mode
- Colorblind modes (Protanopia, Deuteranopia, Tritanopia)
- Text-to-speech for prompts
- Large text options
- Reduced motion
- One-handed mode optimization
- Adjustable timer warnings

---

## **📱 PHASE 9: PLATFORM-SPECIFIC FEATURES**

### **8.1 Mobile (iOS & Android)**

#### **Native Features**
- Push notifications
- Haptic feedback
- Native share sheet
- Deep linking (join room via link)
- Quick actions (3D Touch / Long press)
- Widget (current rank, friend activity)
- Apple Watch companion (notifications)
- Background music handling

#### **Optimization**
- Thumb-zone friendly buttons
- Swipe gestures for navigation
- Pull-to-refresh
- Adaptive keyboard
- Portrait + landscape support
- Offline mode (view stats, edit profile)

---

### **8.2 Web**

#### **Desktop Features**
- Keyboard shortcuts
- Multi-monitor support
- Browser notifications
- Fullscreen mode
- Native feel (PWA)

#### **Browser Support**
- Chrome, Firefox, Safari, Edge
- Progressive Web App (PWA) installable
- Responsive design (mobile browser)

---

## **✨ PHASE 10: POLISH & OPTIMIZATION**

### **9.1 Firebase Services**

#### **Authentication**
- Email/password
- Google Sign-In
- Apple Sign-In
- Facebook Login
- Anonymous play (guest mode)
- Account linking
- Password reset
- Email verification

#### **Firestore Database**
- **Collections:**
  - Users (profiles, stats, settings)
  - Rooms (active game states)
  - Prompts (prompt library)
  - Matches (completed game history)
  - Leaderboards (cached rankings)
  - Achievements (user progress)
  - Reports (moderation queue)
  - FriendRequests
  - ChatMessages

#### **Realtime Database**
- Active room presence
- Live player status
- Real-time voting counts
- Typing indicators

#### **Cloud Functions**
- Room lifecycle management
- Score calculation
- Leaderboard updates
- Achievement checks
- Moderation automation
- Matchmaking logic
- Daily rewards
- Notification triggers

#### **Cloud Storage**
- Avatar images (if custom uploads)
- User content
- Logs and analytics

#### **Firebase Hosting**
- Web app deployment
- CDN for assets

#### **Firebase Analytics**
- User behavior tracking
- Retention metrics
- Funnel analysis
- Custom events

#### **Cloud Messaging (FCM)**
- Push notifications
- Cross-platform messaging

---

### **9.2 Data Models**

#### **User Document**
```json
{
  "uid": "string",
  "username": "string",
  "email": "string",
  "avatar": {...},
  "stats": {
    "gamesPlayed": 0,
    "gamesWon": 0,
    "roundsWon": 0,
    "starsEarned": 0,
    "totalVotes": 0
  },
  "rating": 1200,
  "rank": "Silver III",
  "level": 1,
  "xp": 0,
  "achievements": [],
  "settings": {...},
  "friends": [],
  "createdAt": "timestamp",
  "lastActive": "timestamp"
}
```

#### **Room Document**
```json
{
  "roomId": "string",
  "name": "string",
  "hostId": "string",
  "status": "waiting|active|finished",
  "settings": {
    "maxPlayers": 12,
    "submissionTime": 25,
    "votingTime": 10,
    "winningScore": 10,
    "promptPacks": [],
    "isPrivate": false
  },
  "players": [],
  "spectators": [],
  "currentRound": 0,
  "currentPrompt": "string",
  "scores": {},
  "gameState": "submission|voting|results",
  "createdAt": "timestamp"
}
```

---

### **9.3 Security & Performance**

#### **Security Rules**
- User can only edit own profile
- Room host has elevated permissions
- Vote validation (one per user, not own phrase)
- Rate limiting on submissions
- Authenticated read for public data
- Private data restricted

#### **Performance Optimization**
- Indexed queries for leaderboards
- Pagination for room lists
- Caching strategies
- Connection state management
- Offline capability
- Lazy loading of assets
- Image optimization

#### **Scalability**
- Auto-scaling cloud functions
- Connection pooling
- Database sharding strategy (future)
- CDN for static assets
- Load balancing

---

## **🧪 PHASE 11: TESTING & QA**

### **10.1 Revenue Streams**

#### **Freemium Model**
- **Free:**
  - Unlimited gameplay
  - Basic avatars
  - Standard prompt packs
  - Ads between games (non-intrusive)
  
- **Premium Subscription ($4.99/month or $39.99/year):**
  - Ad-free experience
  - Exclusive avatar items
  - Premium prompt packs
  - Custom room themes
  - Priority matchmaking
  - Extended stats & analytics
  - Special badge/title
  
#### **In-App Purchases**
- Avatar item bundles ($0.99-$4.99)
- Seasonal cosmetic packs
- XP boosts (controversial, consider carefully)
- Custom emoji packs

#### **Ads (Free Users)**
- Interstitial ads (between games, not during)
- Banner ads on lobby screen (non-intrusive)
- Rewarded video ads (watch for bonus XP)
- No ads during active gameplay

---

## **📊 PHASE 12: ANALYTICS & KPIs**

### **11.1 Key Metrics**

#### **Engagement**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio
- Session length
- Sessions per user per day
- Retention (D1, D7, D30)

#### **Gameplay**
- Games started vs. completed
- Average game duration
- Average votes per phrase
- Phrase submission rate
- Voting participation rate
- Room creation rate

#### **Monetization**
- Conversion rate (free to premium)
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV)
- Ad impressions & revenue

#### **Social**
- Friend adds per user
- Friend game participation
- User-generated content submission
- Report frequency

---

### **11.2 A/B Testing**

- UI layout variations
- Timer durations
- Scoring algorithms
- Onboarding flows
- Notification timing
- Monetization strategies

---

## **🚀 PHASE 13: LAUNCH STRATEGY**

### **12.1 Development Roadmap**

#### **Phase 1: MVP (Months 1-3)**
- Core gameplay loop
- Basic UI/UX
- Room creation/joining
- Firebase integration
- Single platform (Web or iOS)

#### **Phase 2: Beta (Months 4-5)**
- All three platforms
- Friends system
- Basic leaderboards
- Avatar creator
- Expanded prompt library
- Closed beta testing

#### **Phase 3: Soft Launch (Month 6)**
- Limited geographic release
- Community building
- Feedback iteration
- Performance optimization
- Analytics implementation

#### **Phase 4: Full Launch (Month 7)**
- Global release
- Marketing campaign
- App Store optimization
- Press outreach
- Influencer partnerships

#### **Phase 5: Post-Launch (Ongoing)**
- Events & tournaments
- Content updates
- New features
- Community engagement

---

### **12.2 Marketing & Growth**

#### **Pre-Launch**
- Social media teasers
- Landing page with email signup
- Discord community
- Beta tester recruitment
- Press kit preparation

#### **Launch**
- App Store featuring (pitch to Apple/Google)
- Social media campaign
- Gaming subreddits (r/gaming, r/AndroidGaming, etc.)
- Product Hunt launch
- Influencer/streamer partnerships
- Cross-promotion with similar apps

#### **Post-Launch**
- Content marketing (blog, video)
- Community events
- Referral program
- App Store reviews campaign
- Regular updates & transparency

---

## **� PHASE 14: MONETIZATION (OPTIONAL - POST-LAUNCH)**

### **13.1 React Native Setup**

#### **Project Structure**
```
/wittsy-app
  /src
    /components
      /common
      /game
      /lobby
      /profile
    /screens
      HomeScreen.js
      GameRoomScreen.js
      LobbyScreen.js
      ProfileScreen.js
      LeaderboardScreen.js
      SettingsScreen.js
    /navigation
      AppNavigator.js
    /services
      firebase.js
      auth.js
      database.js
      notifications.js
    /hooks
      useGameRoom.js
      useLeaderboard.js
      useAuth.js
    /utils
      helpers.js
      constants.js
    /context
      AuthContext.js
      GameContext.js
    /assets
      /images
      /sounds
      /fonts
```

#### **Key Dependencies**
- React Native
- React Navigation
- Firebase SDK
- React Native Firebase
- Redux or Context API
- Styled Components / NativeWind
- React Native Reanimated
- React Native Gesture Handler
- React Native Sound
- React Native Push Notifications
- React Native SVG (for avatars)

---

### **13.2 Development Best Practices**

#### **Code Quality**
- TypeScript for type safety
- ESLint + Prettier
- Component testing (Jest)
- E2E testing (Detox)
- CI/CD pipeline
- Code reviews

#### **Version Control**
- Git with feature branches
- Semantic versioning
- Changelog maintenance
- Release notes

#### **Documentation**
- Component library (Storybook)
- API documentation
- README and setup guides
- Architecture decision records

---

## **🔮 PHASE 15: FUTURE ENHANCEMENTS (POST-LAUNCH)**

### **14.1 Advanced Features (Post-Launch)**

#### **Game Modes**
- **Team Mode:** 2v2 or 3v3
- **Speed Round:** 10-second submissions
- **Theme Nights:** Specific category focus
- **Elimination Mode:** Lowest voted player eliminated each round
- **Collaborative Mode:** Team writes one phrase together
- **Best of 3:** Multiple prompts, best 2/3 wins round

#### **Advanced Social**
- Voice chat during lobby
- Clans/Guilds system
- Guild vs. Guild tournaments
- Private leagues
- Mentorship system (veterans help newcomers)

#### **Content Creation**
- Replay system (save and share best moments)
- Clip sharing to social media
- Phrase hall of fame website
- Annual "best of" compilations

#### **AI Features**
- Smart matchmaking (skill + personality)
- AI-suggested prompts based on group
- Toxicity detection
- Phrase quality prediction (learning system)

#### **Gamification**
- Daily challenges
- Season passes
- Battle pass system
- Limited-time events
- Seasonal cosmetics

#### **Platform Expansion**
- Desktop apps (Mac/Windows)
- Smart TV apps
- VR mode (future tech)
- Integration with streaming platforms (Twitch, YouTube)

---

### **14.2 Community Wishlist**
- Custom avatar animations
- Themed rooms (visual aesthetics)
- Music player in lobby
- Phrase favorites/bookmarking
- Personal phrase history
- Export stats to PDF
- Integration with Discord/Slack

---

---

## **📊 DEVELOPMENT STATUS TRACKER**

### **✅ COMPLETED**
- Phase 1.2: Firebase Infrastructure (100%)
- Phase 1.3: Authentication Service Backend (100%)
- 15 Sample Prompts Added
- Security Rules Deployed
- Firestore Indexes Deployed

### **🚧 IN PROGRESS**
- Phase 1.1: Project Structure Setup (80%)

### **📋 UP NEXT (MVP PRIORITY)**
1. **Navigation Setup** (Phase 3)
   - AppNavigator with auth flow
   - Screen routing structure
   
2. **Authentication Screens** (Phase 3)
   - Login Screen UI
   - Register Screen UI
   - Password Reset UI
   
3. **Core Screens** (Phase 3)
   - Home Screen
   - Browse Rooms Screen
   - Create Room Screen
   - Profile Screen
   
4. **Game Room Implementation** (Phase 2)
   - 5 Round Phases UI
   - Real-time state management
   - Timer components
   
5. **Database Services** (Phase 2)
   - Room CRUD operations
   - Game state management
   - Realtime Database integration

---

## **🎯 MVP FEATURE CHECKLIST**

### **15.1 Testing Strategy**

#### **Unit Testing**
- Component testing
- Utility function testing
- Service layer testing
- 80%+ code coverage goal

#### **Integration Testing**
- Firebase integration
- Navigation flows
- State management
- API interactions

#### **E2E Testing**
- Full game flow
- Multi-user scenarios
- Payment flows
- Notification handling

#### **Performance Testing**
- Load testing (100+ concurrent rooms)
- Memory leak detection
- Battery usage optimization
- Network efficiency

#### **Security Testing**
- Penetration testing
- Firebase rule validation
- Input sanitization
- Authentication flows

---

### **15.2 QA Checklist**

#### **Functional**
- All game phases work correctly
- Scoring accurate
- Timers precise
- Voting mechanics fair
- Leaderboard updates
- Profile saves correctly
- Settings persist

#### **UI/UX**
- Responsive on all screen sizes
- Smooth animations
- No UI blocking
- Clear feedback for all actions
- Accessible to all users
- Dark/light mode works

#### **Cross-Platform**
- Feature parity across Web/iOS/Android
- Consistent styling
- Platform-specific optimizations
- Deep linking works

#### **Edge Cases**
- Network disconnection/reconnection
- App backgrounding during game
- Multiple device login
- Timer edge cases
- Tie scenarios
- Empty states
- Error handling

---

## **🎯 SUCCESS CRITERIA**

### **Launch Goals**
- 10,000 downloads in first month
- 4.0+ App Store rating
- 30% D1 retention
- 15% D7 retention
- 5% D30 retention
- Average session length: 15+ minutes

### **6-Month Goals**
- 100,000 total users
- 10,000 DAU
- 20% D30 retention
- Active community (Discord 1000+ members)
- 2% conversion to premium (if applicable)
- Featured by App Store or Google Play

### **12-Month Goals**
- 500,000 total users
- 50,000 DAU
- 25% D30 retention
- Self-sustaining community
- Profitable or path to profitability
- Platform expansion consideration

---

## **📝 PRIORITY FEATURES FOR MVP**

To launch efficiently, here are the MUST-HAVE features for Version 1.0:

### **Critical (Must Have)**
1. ✅ Core game loop (prompt → submit → vote → results)
2. ✅ Room creation & joining
3. ✅ Basic avatar selection (preset options)
4. ✅ Real-time multiplayer (3-12 players)
5. ✅ Scoring & winner determination
6. ✅ Basic UI with timer
7. ✅ Firebase authentication
8. ✅ 200+ launch prompts
9. ✅ Global leaderboard (simple)
10. ✅ Basic profile page

### **Important (Should Have)**
11. ✅ Spectator mode
12. ✅ Friend system basics
13. ✅ Achievement system (basic)
14. ✅ Star detection (6+ votes)
15. ✅ Room settings customization
16. ✅ Chat system
17. ✅ Sound effects & music
18. ✅ Dark mode

### **Nice to Have (Can Wait for V1.1+)**
19. ⏳ Advanced avatar creator
20. ⏳ Custom prompt packs
21. ⏳ Detailed statistics
22. ⏳ Tournament system
23. ⏳ Premium features
24. ⏳ Advanced matchmaking
25. ⏳ Voice chat
26. ⏳ Team modes

---

## **🎬 FINAL NOTES**

This specification provides a comprehensive roadmap for building Wittsy from MVP to full-featured app. The phased approach allows for:

1. **Quick MVP launch** with core gameplay
2. **Iterative improvement** based on user feedback
3. **Scalable architecture** that can grow with user base
4. **Monetization flexibility** when the time is right
5. **Community-driven development** to keep players engaged

The key to success is:
- **Nail the core loop first** - Make the phrase submission and voting feel amazing
- **Iterate based on data** - Watch what players actually do
- **Build community early** - Engaged users are retention multipliers
- **Polish over features** - Better to have 10 polished features than 100 half-baked ones

---

**Next Steps:**
1. Review and prioritize features
2. Create detailed wireframes/mockups
3. Set up development environment
4. Build Firebase infrastructure
5. Develop MVP components
6. Internal testing
7. Beta launch
8. Iterate and launch! 🚀
