const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const rtdb = admin.database();

// Game constants
const PHASE_DURATIONS = {
  prompt: 3,
  submission: 25,
  waiting: 5,
  voting: 10,
  results: 8,
};

const STAR_THRESHOLD = 6;
const XP_REWARDS = {
  roundParticipation: 10,
  roundWin: 25,
  gameWin: 100,
  starBonus: 50,
  voting: 5,
};

// Trigger when a room is created or updated to 'active'
exports.onRoomStatusChange = functions.firestore
  .document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const roomId = context.params.roomId;

    // Start game when status changes to 'active'
    if (oldData.status === 'waiting' && newData.status === 'active') {
      console.log(`Game starting in room ${roomId}`);
      await startGameLoop(roomId);
    }

    return null;
  });

// Main game loop
async function startGameLoop(roomId) {
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    
    if (!roomSnap.exists) {
      console.error(`Room ${roomId} not found`);
      return;
    }

    const room = roomSnap.data();
    const scores = room.scores || {};
    const winningVotes = room.settings.winningVotes || 20;
    
    // Check if any player has reached winning votes
    const maxVotes = Math.max(...Object.values(scores).map(s => s.totalVotes || 0));
    console.log(`Room ${roomId} - Max votes: ${maxVotes}, Winning votes: ${winningVotes}`);
    
    if (maxVotes >= winningVotes) {
      console.log(`Game ending - player reached ${winningVotes} votes`);
      await endGame(roomId);
      return;
    }
    
    // Check if minimum players requirement is met
    const activePlayers = room.players.filter(p => p.isConnected).length;
    if (activePlayers < 3) {
      console.log(`Game ending - less than 3 active players`);
      await endGameEarly(roomId, 'Insufficient players');
      return;
    }

    // Start new round
    await startRound(roomId);
  } catch (error) {
    console.error('Error in game loop:', error);
  }
}

// Start a new round
async function startRound(roomId) {
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();

    // Get random prompt
    const prompt = await getRandomPrompt();
    
    if (!prompt) {
      console.error('No prompts available');
      return;
    }

    // Update room with new prompt
    await roomRef.update({
      currentRound: admin.firestore.FieldValue.increment(1),
      currentPrompt: prompt,
      gameState: 'submission',
    });

    // Initialize game state in Realtime DB
    const gameStateRef = rtdb.ref(`gameStates/${roomId}`);
    await gameStateRef.set({
      phase: 'prompt',
      timeRemaining: PHASE_DURATIONS.prompt,
      currentPrompt: prompt.text,
      currentRound: room.currentRound + 1,
      submissions: {},
      votes: {},
      lastUpdate: admin.database.ServerValue.TIMESTAMP,
    });

    // Start phase progression
    await progressPhases(roomId);
  } catch (error) {
    console.error('Error starting round:', error);
  }
}

// Progress through game phases
async function progressPhases(roomId) {
  const phases = ['prompt', 'submission', 'waiting', 'voting', 'results'];
  
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const duration = PHASE_DURATIONS[phase];

    // Update phase
    const gameStateRef = rtdb.ref(`gameStates/${roomId}`);
    await gameStateRef.update({
      phase: phase,
      timeRemaining: duration,
    });

    // Wait for phase duration with countdown
    for (let remaining = duration; remaining > 0; remaining--) {
      await sleep(1000);
      await gameStateRef.update({ timeRemaining: remaining - 1 });
    }

    // Handle phase completion
    if (phase === 'submission') {
      await handleSubmissionEnd(roomId);
    } else if (phase === 'voting') {
      await handleVotingEnd(roomId);
    }
  }

  // After results, check if game should continue
  const roomRef = db.collection('rooms').doc(roomId);
  const roomSnap = await roomRef.get();
  const room = roomSnap.data();
  
  // Check for winner based on total votes
  const scores = room.scores || {};
  const winningVotes = room.settings.winningVotes || 20;
  const maxVotes = Math.max(...Object.values(scores).map(s => s.totalVotes || 0));
  
  console.log(`After round - Max votes: ${maxVotes}, Winning votes: ${winningVotes}`);
  
  if (maxVotes >= winningVotes) {
    console.log('Player reached winning votes, ending game');
    await endGame(roomId);
  } else {
    // Check if enough players remain
    const activePlayers = room.players.filter(p => p.isConnected).length;
    if (activePlayers < 3) {
      console.log('Less than 3 active players, ending game early');
      await endGameEarly(roomId, 'Insufficient players');
    } else {
      // Continue to next round
      await sleep(2000);
      await startRound(roomId);
    }
  }
}

// Handle end of submission phase
async function handleSubmissionEnd(roomId) {
  try {
    const submissionsRef = rtdb.ref(`submissions/${roomId}`);
    const submissionsSnap = await submissionsRef.once('value');
    const submissions = submissionsSnap.val() || {};

    console.log(`Submissions for room ${roomId}:`, Object.keys(submissions).length);
  } catch (error) {
    console.error('Error handling submission end:', error);
  }
}

// Handle end of voting phase and calculate results
async function handleVotingEnd(roomId) {
  try {
    const votesRef = rtdb.ref(`votes/${roomId}`);
    const votesSnap = await votesRef.once('value');
    const votes = votesSnap.val() || {};

    // Count votes for each phrase
    const voteCount = {};
    Object.values(votes).forEach(phraseId => {
      voteCount[phraseId] = (voteCount[phraseId] || 0) + 1;
    });

    // Find winner(s)
    const maxVotes = Math.max(...Object.values(voteCount), 0);
    const winners = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);

    // Check for stars (6+ votes)
    const starWinners = Object.keys(voteCount).filter(id => voteCount[id] >= STAR_THRESHOLD);

    // Update scores in Firestore
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();
    const scores = room.scores || {};

    // Award points - totalVotes is the primary win condition
    for (const userId of Object.keys(voteCount)) {
      if (!scores[userId]) {
        scores[userId] = { totalVotes: 0, roundWins: 0, stars: 0, phrases: [] };
      }
      
      // Add votes to total (primary win condition)
      scores[userId].totalVotes += voteCount[userId];
      
      // Track round wins for stats
      if (winners.includes(userId)) {
        scores[userId].roundWins += 1;
      }
      
      // Track stars
      if (starWinners.includes(userId)) {
        scores[userId].stars += 1;
      }
      
      console.log(`Player ${userId} - Total votes: ${scores[userId].totalVotes}, Round wins: ${scores[userId].roundWins}`);
    }

    await roomRef.update({ scores });

    // Update game state with results
    const gameStateRef = rtdb.ref(`gameStates/${roomId}`);
    await gameStateRef.update({
      lastWinner: winners[0],
      lastWinningPhrase: null, // Would need to store phrases separately
    });

    // Award XP to players
    await awardXP(roomId, winners, starWinners, voteCount);

  } catch (error) {
    console.error('Error handling voting end:', error);
  }
}

// Award XP to players
async function awardXP(roomId, winners, starWinners, voteCount) {
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();

    const batch = db.batch();

    for (const player of room.players) {
      const userId = player.userId;
      const userRef = db.collection('users').doc(userId);
      
      let xpToAdd = XP_REWARDS.roundParticipation;
      
      if (winners.includes(userId)) {
        xpToAdd += XP_REWARDS.roundWin;
      }
      
      if (starWinners.includes(userId)) {
        xpToAdd += XP_REWARDS.starBonus;
      }
      
      if (voteCount[userId]) {
        xpToAdd += XP_REWARDS.voting;
      }

      batch.update(userRef, {
        xp: admin.firestore.FieldValue.increment(xpToAdd),
        'stats.roundsWon': winners.includes(userId) 
          ? admin.firestore.FieldValue.increment(1) 
          : admin.firestore.FieldValue.increment(0),
        'stats.starsEarned': starWinners.includes(userId)
          ? admin.firestore.FieldValue.increment(1)
          : admin.firestore.FieldValue.increment(0),
        'stats.totalVotes': admin.firestore.FieldValue.increment(voteCount[userId] || 0),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error awarding XP:', error);
  }
}

// End game and save results
async function endGame(roomId) {
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();

    // Find winner based on total votes (primary win condition)
    const scores = room.scores || {};
    const sortedPlayers = Object.entries(scores)
      .sort((a, b) => (b[1].totalVotes || 0) - (a[1].totalVotes || 0));
    
    const winnerId = sortedPlayers[0]?.[0];
    const winnerVotes = sortedPlayers[0]?.[1]?.totalVotes || 0;
    
    console.log(`Game ended - Winner: ${winnerId} with ${winnerVotes} total votes`);

    // Update room status
    await roomRef.update({
      status: 'finished',
      winnerId: winnerId,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Save match history
    await db.collection('matches').add({
      roomId: roomId,
      roomName: room.name,
      players: room.players,
      scores: scores,
      winnerId: winnerId,
      rounds: room.currentRound,
      startedAt: room.startedAt,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Award game win XP
    if (winnerId) {
      const winnerRef = db.collection('users').doc(winnerId);
      await winnerRef.update({
        xp: admin.firestore.FieldValue.increment(XP_REWARDS.gameWin),
        'stats.gamesWon': admin.firestore.FieldValue.increment(1),
        'stats.gamesPlayed': admin.firestore.FieldValue.increment(1),
      });
    }

    // Update all players' games played
    const batch = db.batch();
    for (const player of room.players) {
      if (player.userId !== winnerId) {
        const userRef = db.collection('users').doc(player.userId);
        batch.update(userRef, {
          'stats.gamesPlayed': admin.firestore.FieldValue.increment(1),
        });
      }
    }
    await batch.commit();

    // Clear game state
    const gameStateRef = rtdb.ref(`gameStates/${roomId}`);
    await gameStateRef.remove();

    console.log(`Game ended in room ${roomId}, winner: ${winnerId}`);
  } catch (error) {
    console.error('Error ending game:', error);
  }
}

// End game early due to insufficient players
async function endGameEarly(roomId, reason) {
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();

    // Find winner based on highest total votes among remaining players
    const scores = room.scores || {};
    const sortedPlayers = Object.entries(scores)
      .sort((a, b) => (b[1].totalVotes || 0) - (a[1].totalVotes || 0));
    
    const winnerId = sortedPlayers[0]?.[0];
    const winnerVotes = sortedPlayers[0]?.[1]?.totalVotes || 0;
    
    console.log(`Game ended early (${reason}) - Winner: ${winnerId} with ${winnerVotes} total votes`);

    // Update room status
    await roomRef.update({
      status: 'finished',
      winnerId: winnerId,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      earlyEnd: true,
      earlyEndReason: reason,
    });

    // Save match history
    await db.collection('matches').add({
      roomId: roomId,
      roomName: room.name,
      players: room.players,
      scores: scores,
      winnerId: winnerId,
      rounds: room.currentRound,
      startedAt: room.startedAt,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      earlyEnd: true,
      earlyEndReason: reason,
    });

    // Award win to player with most votes
    if (winnerId) {
      const winnerRef = db.collection('users').doc(winnerId);
      await winnerRef.update({
        'stats.gamesWon': admin.firestore.FieldValue.increment(1),
        'stats.gamesPlayed': admin.firestore.FieldValue.increment(1),
        xp: admin.firestore.FieldValue.increment(XP_REWARDS.gameWin),
      });
    }

    // Update all players' games played
    const batch = db.batch();
    for (const player of room.players) {
      if (player.userId !== winnerId) {
        const userRef = db.collection('users').doc(player.userId);
        batch.update(userRef, {
          'stats.gamesPlayed': admin.firestore.FieldValue.increment(1),
        });
      }
    }
    await batch.commit();

    // Clear game state
    const gameStateRef = rtdb.ref(`gameStates/${roomId}`);
    await gameStateRef.remove();

    console.log(`Game ended early in room ${roomId}, winner: ${winnerId}`);
  } catch (error) {
    console.error('Error ending game early:', error);
  }
}

// Get random prompt
async function getRandomPrompt() {
  try {
    const promptsRef = db.collection('prompts');
    const snapshot = await promptsRef.get();
    
    if (snapshot.empty) {
      return null;
    }

    const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const randomIndex = Math.floor(Math.random() * prompts.length);
    
    return prompts[randomIndex];
  } catch (error) {
    console.error('Error getting random prompt:', error);
    return null;
  }
}

// Update leaderboard when user stats change
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
        position: 0, // Would need separate calculation
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }

    return null;
  });

// Clean up old rooms
exports.cleanupOldRooms = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
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

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SEASON MANAGEMENT
// ============================================

// Automatic season rotation - runs daily at midnight UTC
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

// Manual admin function to create a season
exports.adminCreateSeason = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { number, name, theme, description, durationDays } = data;
  
  console.log(`📅 Admin creating season ${number}...`);
  await createSeason(number, name, theme, description, durationDays);
  
  return { success: true, message: `Season ${number} created successfully!` };
});

// Manual admin function to end a season
exports.adminEndSeason = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { seasonId } = data;
  
  console.log(`🏁 Admin ending season ${seasonId}...`);
  await endSeason(seasonId);
  
  return { success: true, message: `Season ${seasonId} ended successfully!` };
});

// Create a new season
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

// End a season and distribute rewards
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

// ==================== SOCIAL FEATURES: CHALLENGES ====================

// Daily challenge templates
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

// Weekly challenge templates
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

// Generate daily challenges (runs at midnight UTC)
exports.generateDailyChallenges = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🎯 Generating daily challenges...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Select 3 random daily challenges
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

// Generate weekly challenges (runs on Monday at midnight UTC)
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
    
    // Select 2 random weekly challenges
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

// Clean up expired challenges
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
