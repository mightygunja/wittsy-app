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
    const currentRound = room.currentRound || 0;
    const winningScore = room.settings.winningScore || 10;

    // Check if game should end
    if (currentRound >= winningScore) {
      await endGame(roomId);
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
  
  // Check for winner
  const scores = room.scores || {};
  const maxScore = Math.max(...Object.values(scores).map(s => s.roundWins || 0));
  
  if (maxScore >= room.settings.winningScore) {
    await endGame(roomId);
  } else {
    // Continue to next round
    await sleep(2000);
    await startRound(roomId);
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

    // Award points
    for (const userId of Object.keys(voteCount)) {
      if (!scores[userId]) {
        scores[userId] = { roundWins: 0, totalVotes: 0, stars: 0, phrases: [] };
      }
      
      scores[userId].totalVotes += voteCount[userId];
      
      if (winners.includes(userId)) {
        scores[userId].roundWins += 1;
      }
      
      if (starWinners.includes(userId)) {
        scores[userId].stars += 1;
      }
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

    // Find winner
    const scores = room.scores || {};
    const sortedPlayers = Object.entries(scores)
      .sort((a, b) => b[1].roundWins - a[1].roundWins);
    
    const winnerId = sortedPlayers[0]?.[0];

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
