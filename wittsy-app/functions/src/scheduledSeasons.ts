/**
 * Scheduled Season Management
 * Automatically checks and rotates seasons daily
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * Scheduled function that runs daily at midnight UTC
 * Checks if current season should end and creates new one
 */
export const checkSeasonRotation = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🎯 Checking season rotation...');

    try {
      // Get current active season
      const seasonsSnapshot = await firestore
        .collection('seasons')
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (seasonsSnapshot.empty) {
        // No active season - create the first one
        console.log('📅 No active season found. Creating Season 1...');
        await createSeason(1, 'Season 1: The Beginning', 'launch', 'The inaugural season of WITTSY!');
        return;
      }

      const currentSeason = seasonsSnapshot.docs[0].data();
      const endDate = new Date(currentSeason.endDate);
      const now = new Date();

      // Check if season should end
      if (now >= endDate) {
        console.log(`🏁 Season ${currentSeason.number} has ended. Processing...`);
        
        // End current season
        await endSeason(currentSeason.id);
        
        // Create new season
        const newSeasonNumber = currentSeason.number + 1;
        await createSeason(
          newSeasonNumber,
          `Season ${newSeasonNumber}`,
          undefined,
          `Season ${newSeasonNumber} of competitive WITTSY!`
        );
        
        console.log(`✅ Season ${newSeasonNumber} created successfully!`);
      } else {
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`⏳ Season ${currentSeason.number} has ${daysRemaining} days remaining.`);
      }
    } catch (error) {
      console.error('❌ Error in season rotation:', error);
      throw error;
    }
  });

/**
 * Create a new season
 */
async function createSeason(
  number: number,
  name: string,
  theme?: string,
  description?: string
): Promise<void> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90); // 90 day season

  const season = {
    id: `season_${number}`,
    number,
    name,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    theme: theme || null,
    description: description || null,
    rewards: generateSeasonRewards(),
  };

  await firestore.collection('seasons').doc(season.id).set(season);
  console.log(`✅ Created ${season.name}`);
}

/**
 * End a season and distribute rewards
 */
async function endSeason(seasonId: string): Promise<void> {
  // Update season status
  await firestore.collection('seasons').doc(seasonId).update({
    status: 'ended',
  });

  // Get all users' season stats
  const seasonStatsSnapshot = await firestore
    .collection('seasonStats')
    .where('seasonId', '==', seasonId)
    .get();

  const seasonDoc = await firestore.collection('seasons').doc(seasonId).get();
  const seasonData = seasonDoc.data();

  if (!seasonData) return;

  // Distribute rewards based on final rating
  const batch = firestore.batch();
  
  for (const doc of seasonStatsSnapshot.docs) {
    const stats = doc.data();
    const rewards = getRewardsForRating(stats.peakRating, seasonData.rewards);
    
    if (rewards) {
      const userRef = firestore.collection('users').doc(stats.userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      if (userData) {
        const updates: any = {};
        
        if (rewards.title) {
          updates.unlockedTitles = [...(userData.unlockedTitles || []), rewards.title];
        }
        if (rewards.xp) {
          updates.xp = (userData.xp || 0) + rewards.xp;
        }
        if (rewards.badge) {
          updates.badges = [...(userData.badges || []), rewards.badge];
        }
        
        batch.update(userRef, updates);
      }
    }
  }
  
  await batch.commit();
  console.log(`✅ Season ${seasonId} ended and rewards distributed`);
}

/**
 * Generate season rewards
 */
function generateSeasonRewards(): any[] {
  return [
    {
      rank: 'Legend',
      tier: 'Legend',
      minRating: 4000,
      rewards: {
        title: 'Legendary Champion',
        badge: 'legendary_season',
        xp: 5000,
      },
    },
    {
      rank: 'Grandmaster',
      tier: 'Grandmaster',
      minRating: 3500,
      rewards: {
        title: 'Season Grandmaster',
        badge: 'grandmaster_season',
        xp: 3000,
      },
    },
    {
      rank: 'Master',
      tier: 'Master',
      minRating: 3000,
      rewards: {
        title: 'Season Master',
        badge: 'master_season',
        xp: 2000,
      },
    },
    {
      rank: 'Diamond I',
      tier: 'Diamond',
      minRating: 2500,
      rewards: {
        badge: 'diamond_season',
        xp: 1500,
      },
    },
    {
      rank: 'Platinum I',
      tier: 'Platinum',
      minRating: 2000,
      rewards: {
        badge: 'platinum_season',
        xp: 1000,
      },
    },
    {
      rank: 'Gold I',
      tier: 'Gold',
      minRating: 1500,
      rewards: {
        badge: 'gold_season',
        xp: 500,
      },
    },
  ];
}

/**
 * Get rewards for a given rating
 */
function getRewardsForRating(rating: number, rewards: any[]): any | null {
  const qualified = rewards
    .filter(r => rating >= r.minRating)
    .sort((a, b) => b.minRating - a.minRating)[0];
  
  return qualified?.rewards || null;
}
