const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const rtdb = admin.database();

// ============================================
// GAME SYSTEM - NEW CLEAN ARCHITECTURE
// ============================================

const gameFunctions = require('./gameFunctions');
const initCollections = require('./initCollections');

exports.onGameStart = gameFunctions.onGameStart;
exports.advanceGamePhase = gameFunctions.advanceGamePhase;
// Scheduler function commented out due to deployment error - backup not critical
// exports.checkGamePhases = gameFunctions.checkGamePhases;

const simulate = require('./simulateGame');
exports.simulateGame = simulate.simulateGame;

// One-time initialization
exports.initializeCollections = initCollections.initializeCollections;

// ============================================
// LEADERBOARD
// ============================================

exports.updateLeaderboard = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const userId = context.params.userId;

    try {
      const leaderboardRef = db.collection('leaderboards').doc(userId);
      
      await leaderboardRef.set({
        userId: userId,
        username: newData.username,
        avatar: newData.avatar,
        rating: newData.rating,
        rank: newData.rank,
        wins: newData.stats.gamesWon,
        stars: newData.stats.starsEarned,
        winRate: newData.stats.gamesPlayed > 0 
          ? (newData.stats.gamesWon / newData.stats.gamesPlayed * 100).toFixed(1)
          : 0,
        position: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }

    return null;
  });

// ============================================
// CLEANUP
// ============================================

exports.cleanupOldRooms = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    
    const oldRooms = await db.collection('rooms')
      .where('createdAt', '<', new Date(cutoff).toISOString())
      .where('status', '==', 'finished')
      .get();

    const batch = db.batch();
    oldRooms.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldRooms.size} old rooms`);
    
    return null;
  });

// ============================================
// CLEANUP OLD CASUAL ROOMS
// ============================================

exports.cleanupStaleCasualRooms = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('🧹 Checking for stale casual rooms...');
    
    const sixHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - (6 * 60 * 60 * 1000));
    
    try {
      // Find casual rooms that are waiting or active and older than 6 hours
      const staleRooms = await db.collection('rooms')
        .where('isRanked', '==', false)
        .where('status', 'in', ['waiting', 'active'])
        .where('createdAt', '<', sixHoursAgo)
        .get();

      if (staleRooms.empty) {
        console.log('✅ No stale casual rooms found');
        return null;
      }

      const batch = db.batch();
      let count = 0;

      staleRooms.docs.forEach(doc => {
        const roomData = doc.data();
        console.log(`🗑️ Deleting stale casual room: ${doc.id} (${roomData.name}) - ${roomData.status} - created ${roomData.createdAt.toDate()}`);
        batch.delete(doc.ref);
        
        // Also clean up realtime database state
        rtdb.ref(`rooms/${doc.id}`).remove().catch(err => 
          console.error(`Failed to clean RTDB for ${doc.id}:`, err)
        );
        
        count++;
      });

      await batch.commit();
      console.log(`✅ Cleaned up ${count} stale casual rooms`);
      
      return null;
    } catch (error) {
      console.error('❌ Error cleaning up stale casual rooms:', error);
      return null;
    }
  });

// ============================================
// RANKED GAME TIMEOUT - 6 HOUR AUTO-KILL
// ============================================

exports.timeoutRankedGames = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('⏰ Checking for timed-out ranked games...');
    
    const sixHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - (6 * 60 * 60 * 1000));
    
    try {
      // Find ranked games that are active and older than 6 hours
      const timedOutGames = await db.collection('rooms')
        .where('isRanked', '==', true)
        .where('status', '==', 'active')
        .where('startedAt', '<', sixHoursAgo)
        .get();

      if (timedOutGames.empty) {
        console.log('✅ No timed-out ranked games found');
        return null;
      }

      console.log(`⚠️ Found ${timedOutGames.size} ranked games that exceeded 6-hour limit`);

      for (const doc of timedOutGames.docs) {
        const roomData = doc.data();
        const roomId = doc.id;
        
        console.log(`⏱️ Processing timeout for ranked game: ${roomId} (${roomData.name})`);
        
        // Calculate partial ratings based on current scores
        const scores = roomData.scores || {};
        const players = roomData.players || [];
        
        // Sort players by totalVotes to determine placement
        const playerScores = players.map(p => ({
          userId: p.userId,
          username: p.username,
          totalVotes: scores[p.userId]?.totalVotes || 0,
          roundWins: scores[p.userId]?.roundWins || 0
        })).sort((a, b) => b.totalVotes - a.totalVotes);
        
        // Award partial ratings (50% of normal rating change)
        // This prevents abuse while still rewarding performance
        if (playerScores.length >= 2) {
          console.log(`📊 Allocating partial ratings for ${playerScores.length} players`);
          
          // Calculate rating changes with reduced K-factor (30 instead of 60)
          const K_FACTOR_TIMEOUT = 30; // Half of normal placement K-factor
          
          for (let i = 0; i < playerScores.length; i++) {
            const player = playerScores[i];
            const placement = i + 1;
            
            try {
              const userRef = db.collection('users').doc(player.userId);
              const userDoc = await userRef.get();
              
              if (userDoc.exists) {
                const userData = userDoc.data();
                const currentRating = userData.rating || 1200;
                
                // Simple rating adjustment based on placement
                // 1st place: +15, 2nd: +5, 3rd: 0, 4th+: -5
                let ratingChange = 0;
                if (placement === 1) ratingChange = 15;
                else if (placement === 2) ratingChange = 5;
                else if (placement === 3) ratingChange = 0;
                else ratingChange = -5;
                
                const newRating = Math.max(0, currentRating + ratingChange);
                
                await userRef.update({
                  rating: newRating,
                  'stats.gamesPlayed': admin.firestore.FieldValue.increment(1)
                });
                
                console.log(`  ${player.username}: ${currentRating} → ${newRating} (${ratingChange >= 0 ? '+' : ''}${ratingChange})`);
              }
            } catch (error) {
              console.error(`Failed to update rating for ${player.userId}:`, error);
            }
          }
        }
        
        // Mark game as finished with timeout reason
        await doc.ref.update({
          status: 'finished',
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          endReason: 'timeout_6_hours'
        });
        
        // Clean up realtime database
        await rtdb.ref(`rooms/${roomId}`).remove();
        
        console.log(`✅ Ranked game ${roomId} timed out and ratings allocated`);
      }
      
      console.log(`✅ Processed ${timedOutGames.size} timed-out ranked games`);
      return null;
    } catch (error) {
      console.error('❌ Error processing ranked game timeouts:', error);
      return null;
    }
  });

// ============================================
// SEASON MANAGEMENT
// ============================================

exports.checkSeasonRotation = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🎯 Checking season rotation...');
    
    try {
      const seasonsSnapshot = await db.collection('seasons')
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (seasonsSnapshot.empty) {
        console.log('📅 No active season. Creating Season 1...');
        await createSeason(1, 'Season 1: The Beginning', 'launch', 'The inaugural season of WITTSY!');
        return null;
      }

      const seasonDoc = seasonsSnapshot.docs[0];
      const currentSeason = seasonDoc.data();
      const endDate = new Date(currentSeason.endDate);
      const now = new Date();

      if (now >= endDate) {
        console.log(`🏁 Season ${currentSeason.number} has ended.`);
        await endSeason(currentSeason.id);
        const newSeasonNumber = currentSeason.number + 1;
        await createSeason(newSeasonNumber, `Season ${newSeasonNumber}`, null, `Season ${newSeasonNumber} of competitive WITTSY!`);
        console.log(`✅ Season ${newSeasonNumber} created!`);
      } else {
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`⏳ Season ${currentSeason.number}: ${daysRemaining} days remaining.`);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Season rotation error:', error);
      return null;
    }
  });

exports.adminCreateSeason = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { number, name, theme, description, durationDays } = data;
  
  console.log(`📅 Admin creating season ${number}...`);
  await createSeason(number, name, theme, description, durationDays);
  
  return { success: true, message: `Season ${number} created successfully!` };
});

exports.adminEndSeason = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { seasonId } = data;
  
  console.log(`🏁 Admin ending season ${seasonId}...`);
  await endSeason(seasonId);
  
  return { success: true, message: `Season ${seasonId} ended successfully!` };
});

async function createSeason(number, name, theme, description, durationDays = 90) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const season = {
    id: `season_${number}`,
    number,
    name,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    theme: theme || null,
    description: description || null,
    rewards: [
      { rank: 'Legend', tier: 'Legend', minRating: 4000, rewards: { title: 'Legendary Champion', badge: 'legendary_season', xp: 5000 } },
      { rank: 'Grandmaster', tier: 'Grandmaster', minRating: 3500, rewards: { title: 'Season Grandmaster', badge: 'grandmaster_season', xp: 3000 } },
      { rank: 'Master', tier: 'Master', minRating: 3000, rewards: { title: 'Season Master', badge: 'master_season', xp: 2000 } },
      { rank: 'Diamond I', tier: 'Diamond', minRating: 2500, rewards: { badge: 'diamond_season', xp: 1500 } },
      { rank: 'Platinum I', tier: 'Platinum', minRating: 2000, rewards: { badge: 'platinum_season', xp: 1000 } },
      { rank: 'Gold I', tier: 'Gold', minRating: 1500, rewards: { badge: 'gold_season', xp: 500 } },
    ],
  };

  await db.collection('seasons').doc(season.id).set(season);
  console.log(`✅ Created ${season.name}`);
}

async function endSeason(seasonId) {
  await db.collection('seasons').doc(seasonId).update({ status: 'ended' });

  const seasonStatsSnapshot = await db.collection('seasonStats')
    .where('seasonId', '==', seasonId)
    .get();

  const seasonDoc = await db.collection('seasons').doc(seasonId).get();
  const seasonData = seasonDoc.data();

  if (!seasonData) return;

  const batch = db.batch();
  
  for (const doc of seasonStatsSnapshot.docs) {
    const stats = doc.data();
    const qualifiedReward = seasonData.rewards
      .filter(r => stats.peakRating >= r.minRating)
      .sort((a, b) => b.minRating - a.minRating)[0];
    
    if (qualifiedReward) {
      const userRef = db.collection('users').doc(stats.userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      if (userData) {
        const updates = {};
        if (qualifiedReward.rewards.title) {
          updates.unlockedTitles = [...(userData.unlockedTitles || []), qualifiedReward.rewards.title];
        }
        if (qualifiedReward.rewards.xp) {
          updates.xp = (userData.xp || 0) + qualifiedReward.rewards.xp;
        }
        if (qualifiedReward.rewards.badge) {
          updates.badges = [...(userData.badges || []), qualifiedReward.rewards.badge];
        }
        batch.update(userRef, updates);
      }
    }
  }
  
  await batch.commit();
  console.log(`✅ Season ${seasonId} ended, rewards distributed`);
}

// ============================================
// CHALLENGES
// ============================================

const DAILY_CHALLENGES_TEMPLATE = [
  {
    type: 'daily',
    category: 'wins',
    title: 'Daily Victor',
    description: 'Win 3 games today',
    icon: '🏆',
    requirement: 3,
    reward: { xp: 100, coins: 50 },
  },
  {
    type: 'daily',
    category: 'votes',
    title: 'Vote Collector',
    description: 'Earn 20 votes today',
    icon: '⭐',
    requirement: 20,
    reward: { xp: 75, coins: 30 },
  },
  {
    type: 'daily',
    category: 'creativity',
    title: 'Star Power',
    description: 'Get 2 star responses today',
    icon: '✨',
    requirement: 2,
    reward: { xp: 150, coins: 75 },
  },
  {
    type: 'daily',
    category: 'social',
    title: 'Social Butterfly',
    description: 'Play 5 games with friends',
    icon: '🦋',
    requirement: 5,
    reward: { xp: 100, coins: 50 },
  },
  {
    type: 'daily',
    category: 'skill',
    title: 'Perfect Streak',
    description: 'Win 3 rounds in a row',
    icon: '🔥',
    requirement: 3,
    reward: { xp: 200, coins: 100 },
  },
];

const WEEKLY_CHALLENGES_TEMPLATE = [
  {
    type: 'weekly',
    category: 'wins',
    title: 'Weekly Champion',
    description: 'Win 15 games this week',
    icon: '👑',
    requirement: 15,
    reward: { xp: 500, coins: 250, badge: 'weekly_champion' },
  },
  {
    type: 'weekly',
    category: 'votes',
    title: 'Vote Master',
    description: 'Earn 100 votes this week',
    icon: '💯',
    requirement: 100,
    reward: { xp: 400, coins: 200 },
  },
  {
    type: 'weekly',
    category: 'creativity',
    title: 'Star Collector',
    description: 'Get 10 star responses this week',
    icon: '🌟',
    requirement: 10,
    reward: { xp: 600, coins: 300, emote: 'star_power' },
  },
  {
    type: 'weekly',
    category: 'social',
    title: 'Friend Zone',
    description: 'Add 5 new friends this week',
    icon: '👥',
    requirement: 5,
    reward: { xp: 300, coins: 150 },
  },
  {
    type: 'weekly',
    category: 'skill',
    title: 'Comeback King',
    description: 'Win 5 games from behind',
    icon: '🎯',
    requirement: 5,
    reward: { xp: 750, coins: 400, title: 'Comeback King' },
  },
];

exports.generateDailyChallenges = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🎯 Generating daily challenges...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const shuffled = [...DAILY_CHALLENGES_TEMPLATE].sort(() => Math.random() - 0.5);
    const selectedChallenges = shuffled.slice(0, 3);
    
    const batch = db.batch();
    
    for (const challengeTemplate of selectedChallenges) {
      const challengeRef = db.collection('challenges').doc();
      batch.set(challengeRef, {
        ...challengeTemplate,
        startDate: admin.firestore.Timestamp.fromDate(today),
        endDate: admin.firestore.Timestamp.fromDate(tomorrow),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    await batch.commit();
    console.log(`✅ Generated ${selectedChallenges.length} daily challenges`);
    return null;
  });

exports.generateWeeklyChallenges = functions.pubsub
  .schedule('0 0 * * 1')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🎯 Generating weekly challenges...');
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    
    const shuffled = [...WEEKLY_CHALLENGES_TEMPLATE].sort(() => Math.random() - 0.5);
    const selectedChallenges = shuffled.slice(0, 2);
    
    const batch = db.batch();
    
    for (const challengeTemplate of selectedChallenges) {
      const challengeRef = db.collection('challenges').doc();
      batch.set(challengeRef, {
        ...challengeTemplate,
        startDate: admin.firestore.Timestamp.fromDate(monday),
        endDate: admin.firestore.Timestamp.fromDate(nextMonday),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    await batch.commit();
    console.log(`✅ Generated ${selectedChallenges.length} weekly challenges`);
    return null;
  });

exports.cleanupExpiredChallenges = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🧹 Cleaning up expired challenges...');
    
    const now = admin.firestore.Timestamp.now();
    const expiredChallenges = await db.collection('challenges')
      .where('endDate', '<', now)
      .get();
    
    const batch = db.batch();
    let count = 0;
    
    expiredChallenges.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Deleted ${count} expired challenges`);
    } else {
      console.log('No expired challenges to delete');
    }

    return null;
  });
