/**
 * Initialize default challenges in Firestore
 * Run with: node scripts/initChallenges.js
 * 
 * GAME MECHANICS:
 * - Single round: Max 11 points (if only correct player in 12-player room)
 * - Game: First to 20 points wins
 * - Typical game: 2-4 rounds to reach 20 points
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Helper to get date strings
const getDateString = (daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Daily Challenges (reset every 24 hours)
const dailyChallenges = [
  {
    title: "Daily Player",
    description: "Play 3 games today",
    type: "daily",
    category: "games",
    goal: 3,
    startDate: getDateString(0),
    endDate: getDateString(1),
    rewards: {
      coins: 50,
      xp: 25,
    },
    difficulty: "easy",
    active: true,
  },
  {
    title: "Daily Winner",
    description: "Win 2 games today",
    type: "daily",
    category: "wins",
    goal: 2,
    startDate: getDateString(0),
    endDate: getDateString(1),
    rewards: {
      coins: 75,
      xp: 35,
    },
    difficulty: "medium",
    active: true,
  },
  {
    title: "Big Round",
    description: "Score 8+ points in a single round",
    type: "daily",
    category: "round_score",
    goal: 8,
    startDate: getDateString(0),
    endDate: getDateString(1),
    rewards: {
      coins: 100,
      xp: 50,
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Play with Friends",
    description: "Play 2 games with friends",
    type: "daily",
    category: "social",
    goal: 2,
    startDate: getDateString(0),
    endDate: getDateString(1),
    rewards: {
      coins: 60,
      xp: 30,
    },
    difficulty: "easy",
    active: true,
  },
  {
    title: "Category Explorer",
    description: "Play with 3 different prompt categories",
    type: "daily",
    category: "variety",
    goal: 3,
    startDate: getDateString(0),
    endDate: getDateString(1),
    rewards: {
      coins: 80,
      xp: 40,
    },
    difficulty: "medium",
    active: true,
  },
];

// Weekly Challenges (reset every Monday)
const weeklyChallenges = [
  {
    title: "Weekly Warrior",
    description: "Win 10 games this week",
    type: "weekly",
    category: "wins",
    goal: 10,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 200,
      xp: 100,
      items: ["badge_weekly_warrior"],
    },
    difficulty: "medium",
    active: true,
  },
  {
    title: "Marathon Player",
    description: "Play 25 games this week",
    type: "weekly",
    category: "games",
    goal: 25,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 250,
      xp: 125,
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Win Streak",
    description: "Win 3 games in a row",
    type: "weekly",
    category: "streak",
    goal: 3,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 150,
      xp: 75,
      items: ["badge_streak_master"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Prompt Creator",
    description: "Submit 3 prompts this week",
    type: "weekly",
    category: "prompts",
    goal: 3,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 100,
      xp: 50,
      items: ["badge_contributor"],
    },
    difficulty: "easy",
    active: true,
  },
  {
    title: "Social Butterfly",
    description: "Play with 5 different friends",
    type: "weekly",
    category: "social",
    goal: 5,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 175,
      xp: 85,
    },
    difficulty: "medium",
    active: true,
  },
  {
    title: "Dominant Player",
    description: "Score 10+ points in a round 5 times",
    type: "weekly",
    category: "round_score",
    goal: 5,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 300,
      xp: 150,
      items: ["badge_dominant"],
    },
    difficulty: "hard",
    active: true,
  },
];

// Seasonal Challenges (tied to Battle Pass - 60 days)
const seasonalChallenges = [
  {
    title: "Season Champion",
    description: "Win 50 games this season",
    type: "seasonal",
    category: "wins",
    goal: 50,
    startDate: getDateString(0),
    endDate: getDateString(60),
    rewards: {
      coins: 500,
      xp: 250,
      gems: 50,
      items: ["title_season_champion", "badge_champion"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Battle Pass Master",
    description: "Reach Battle Pass level 25",
    type: "seasonal",
    category: "battlepass",
    goal: 25,
    startDate: getDateString(0),
    endDate: getDateString(60),
    rewards: {
      coins: 300,
      xp: 150,
      gems: 25,
    },
    difficulty: "medium",
    active: true,
  },
  {
    title: "Completionist",
    description: "Complete 20 daily challenges",
    type: "seasonal",
    category: "challenges",
    goal: 20,
    startDate: getDateString(0),
    endDate: getDateString(60),
    rewards: {
      coins: 400,
      xp: 200,
      items: ["title_completionist"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Season Grinder",
    description: "Play 100 games this season",
    type: "seasonal",
    category: "games",
    goal: 100,
    startDate: getDateString(0),
    endDate: getDateString(60),
    rewards: {
      coins: 600,
      xp: 300,
      gems: 75,
    },
    difficulty: "hard",
    active: true,
  },
];

// Skill Challenges (permanent - test player skill)
const skillChallenges = [
  {
    title: "Speed Demon",
    description: "Answer correctly in under 3 seconds",
    type: "skill",
    category: "speed",
    goal: 1,
    startDate: getDateString(0),
    endDate: getDateString(365),
    rewards: {
      coins: 150,
      xp: 75,
      items: ["badge_speed_demon"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Perfect Round",
    description: "Score 11 points in a single round (be the only correct answer)",
    type: "skill",
    category: "round_score",
    goal: 11,
    startDate: getDateString(0),
    endDate: getDateString(365),
    rewards: {
      coins: 200,
      xp: 100,
      items: ["badge_perfect_round"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Flawless Victory",
    description: "Win a game with all correct answers",
    type: "skill",
    category: "perfect_game",
    goal: 1,
    startDate: getDateString(0),
    endDate: getDateString(365),
    rewards: {
      coins: 250,
      xp: 125,
      items: ["badge_flawless"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Comeback King",
    description: "Win a game after being 10+ points behind",
    type: "skill",
    category: "comeback",
    goal: 1,
    startDate: getDateString(0),
    endDate: getDateString(365),
    rewards: {
      coins: 175,
      xp: 85,
      items: ["badge_comeback_king"],
    },
    difficulty: "hard",
    active: true,
  },
  {
    title: "Quick Win",
    description: "Win a game in 2 rounds or less",
    type: "skill",
    category: "quick_win",
    goal: 1,
    startDate: getDateString(0),
    endDate: getDateString(365),
    rewards: {
      coins: 200,
      xp: 100,
      items: ["badge_quick_win"],
    },
    difficulty: "hard",
    active: true,
  },
];

// Social Challenges (encourage multiplayer)
const socialChallenges = [
  {
    title: "Friend Finder",
    description: "Add 3 new friends",
    type: "social",
    category: "friends",
    goal: 3,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 100,
      xp: 50,
    },
    difficulty: "easy",
    active: true,
  },
  {
    title: "Room Creator",
    description: "Create 5 custom rooms",
    type: "social",
    category: "rooms",
    goal: 5,
    startDate: getDateString(0),
    endDate: getDateString(7),
    rewards: {
      coins: 75,
      xp: 35,
    },
    difficulty: "easy",
    active: true,
  },
  {
    title: "Invite Master",
    description: "Invite 3 players to join Wittsy",
    type: "social",
    category: "invites",
    goal: 3,
    startDate: getDateString(0),
    endDate: getDateString(30),
    rewards: {
      coins: 300,
      xp: 150,
      gems: 25,
      items: ["badge_invite_master"],
    },
    difficulty: "medium",
    active: true,
  },
];

async function initializeChallenges() {
  try {
    console.log('🎯 Initializing challenges...\n');

    const allChallenges = [
      ...dailyChallenges,
      ...weeklyChallenges,
      ...seasonalChallenges,
      ...skillChallenges,
      ...socialChallenges,
    ];

    let count = 0;
    for (const challenge of allChallenges) {
      await db.collection('challenges').add(challenge);
      console.log(`✅ Created: ${challenge.title} (${challenge.type})`);
      count++;
    }

    console.log(`\n🎉 Successfully created ${count} challenges!`);
    console.log('\nChallenge breakdown:');
    console.log(`  📅 Daily: ${dailyChallenges.length}`);
    console.log(`  📆 Weekly: ${weeklyChallenges.length}`);
    console.log(`  🏆 Seasonal: ${seasonalChallenges.length}`);
    console.log(`  🎓 Skill: ${skillChallenges.length}`);
    console.log(`  👥 Social: ${socialChallenges.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing challenges:', error);
    process.exit(1);
  }
}

initializeChallenges();
