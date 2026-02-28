/**
 * Seed challenges directly from the app
 * This will run automatically and populate Firestore
 */

import { collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';

const challenges = [
  {
    title: "Daily Player",
    description: "Play 3 games today",
    type: "daily",
    category: "games",
    goal: 3,
    difficulty: "easy",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 50, xp: 25 }
  },
  {
    title: "Daily Winner",
    description: "Win 2 games today",
    type: "daily",
    category: "wins",
    goal: 2,
    difficulty: "medium",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 75, xp: 35 }
  },
  {
    title: "Big Round",
    description: "Score 8+ points in a single round",
    type: "daily",
    category: "round_score",
    goal: 8,
    difficulty: "hard",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 100, xp: 50 }
  },
  {
    title: "Weekly Warrior",
    description: "Win 10 games this week",
    type: "weekly",
    category: "wins",
    goal: 10,
    difficulty: "medium",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 200, xp: 100 }
  },
  {
    title: "Win Streak",
    description: "Win 3 games in a row",
    type: "weekly",
    category: "streak",
    goal: 3,
    difficulty: "hard",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 150, xp: 75 }
  },
  {
    title: "Season Champion",
    description: "Win 50 games this season",
    type: "seasonal",
    category: "wins",
    goal: 50,
    difficulty: "hard",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 500, xp: 250, gems: 50 }
  },
  {
    title: "Speed Demon",
    description: "Answer correctly in under 3 seconds",
    type: "skill",
    category: "speed",
    goal: 1,
    difficulty: "hard",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 150, xp: 75 }
  },
  {
    title: "Friend Finder",
    description: "Add 3 new friends",
    type: "social",
    category: "friends",
    goal: 3,
    difficulty: "easy",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    rewards: { coins: 100, xp: 50 }
  }
];

export async function seedChallenges() {
  try {
    // Wait a bit for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if challenges already exist
    const snapshot = await getDocs(collection(firestore, 'challenges'));
    
    if (snapshot.empty) {
      console.log('🌱 Seeding challenges...');
      
      for (const challenge of challenges) {
        try {
          await addDoc(collection(firestore, 'challenges'), challenge);
          console.log(`✅ Added: ${challenge.title}`);
        } catch (err: any) {
          console.log(`⚠️ Could not add ${challenge.title}: ${err.message}`);
          console.log('💡 Please add challenges manually via Firebase Console');
          return false;
        }
      }
      
      console.log('🎉 Challenges seeded successfully!');
      return true;
    } else {
      console.log('✓ Challenges already exist');
      return false;
    }
  } catch (error: any) {
    console.log('⚠️ Could not seed challenges:', error.message);
    console.log('💡 Challenges will need to be added manually');
    return false;
  }
}
