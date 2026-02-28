const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const rtdb = admin.database();

// Import new game system
const gameFunctions = require('./gameFunctions');

// Export game functions
exports.onGameStart = gameFunctions.onGameStart;
exports.advanceGamePhase = gameFunctions.advanceGamePhase;
exports.checkGamePhases = gameFunctions.checkGamePhases;

// Trigger when game state phase changes - schedule phase end
exports.onGameStateChange = functions.database
  .ref('rooms/{roomId}/gameState')
  .onWrite(async (change, context) => {
    const roomId = context.params.roomId;
    const gameState = change.after.val();
    
    // If game state was deleted, stop
    if (!gameState) return null;
    
    const oldState = change.before.val();
    const phase = gameState.phase;
    const oldPhase = oldState?.phase;
    
    // Only act if phase changed AND phaseStartTime is not already set
    // (to avoid double triggering when startGameLoop already set it up)
    if ((!oldState || phase !== oldPhase) && !gameState.phaseStartTime) {
      console.log(`Phase changed to ${phase} for room ${roomId} - setting up timer`);
      
      // Store phase start time and duration
      const phaseStartTime = Date.now();
      const phaseDuration = gameState.timeRemaining || PHASE_DURATIONS[phase] || 10;
      
      await rtdb.ref(`rooms/${roomId}/gameState`).update({
        phaseStartTime: phaseStartTime,
        phaseDuration: phaseDuration
      });
      
      // Schedule phase end check
      setTimeout(async () => {
        await checkPhaseEnd(roomId, phase, phaseStartTime);
      }, phaseDuration * 1000);
    }
    
    return null;
  });

// Check if phase should end
async function checkPhaseEnd(roomId, expectedPhase, expectedStartTime) {
  try {
    const now = Date.now();
    const elapsed = (now - expectedStartTime) / 1000;
    console.log(`checkPhaseEnd called for room ${roomId}, phase ${expectedPhase}, elapsed: ${elapsed}s`);
    
    const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
    const snapshot = await gameStateRef.once('value');
    const currentState = snapshot.val();
    
    // Only transition if we're still in the expected phase with the expected start time
    if (currentState && 
        currentState.phase === expectedPhase && 
        currentState.phaseStartTime === expectedStartTime) {
      console.log(`✅ Phase ${expectedPhase} ended for room ${roomId} - transitioning now`);
      await handlePhaseTransition(roomId, currentState);
    } else {
      console.log(`⚠️ Phase already changed for room ${roomId} - current: ${currentState?.phase}, expected: ${expectedPhase}`);
    }
  } catch (error) {
    console.error('Error checking phase end:', error);
  }
}

// Handle phase transitions
async function handlePhaseTransition(roomId, currentState) {
  const phase = currentState.phase;
  const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
  console.log(`🔄 Transitioning from ${phase} for room ${roomId}`);
  
  if (phase === 'prompt') {
    // Move to submission
    const phaseStartTime = Date.now();
    const phaseDuration = PHASE_DURATIONS.submission;
    console.log(`→ Moving to submission phase (${phaseDuration}s)`);
    await gameStateRef.update({
      phase: 'submission',
      timeRemaining: phaseDuration,
      phaseStartTime: phaseStartTime,
      phaseDuration: phaseDuration
    });
    
    // PRE-FETCH NEXT PROMPT during submission phase (25 seconds - plenty of time!)
    console.log(`🔮 Pre-fetching next prompt during submission phase...`);
    getRandomPrompt().then(prompt => {
      if (prompt) {
        console.log(`✅ Next prompt pre-fetched: "${prompt.text?.substring(0, 30)}..."`);
      }
    }).catch(err => console.error('Error pre-fetching prompt:', err));
    
    setTimeout(async () => {
      await checkPhaseEnd(roomId, 'submission', phaseStartTime);
    }, phaseDuration * 1000);
  } else if (phase === 'submission') {
    // Move to voting IMMEDIATELY
    const phaseStartTime = Date.now();
    const phaseDuration = PHASE_DURATIONS.voting;
    await gameStateRef.update({
      phase: 'voting',
      timeRemaining: phaseDuration,
      phaseStartTime: phaseStartTime,
      phaseDuration: phaseDuration
    });
    console.log(`→ Moving to voting phase (${phaseDuration}s)`);
    
    // Process submissions asynchronously (don't wait)
    handleSubmissionEnd(roomId).catch(err => console.error('Error handling submission end:', err));
    
    setTimeout(async () => {
      await checkPhaseEnd(roomId, 'voting', phaseStartTime);
    }, phaseDuration * 1000);
  } else if (phase === 'voting') {
    // Move to results IMMEDIATELY
    const phaseStartTime = Date.now();
    const phaseDuration = PHASE_DURATIONS.results;
    await gameStateRef.update({
      phase: 'results',
      timeRemaining: phaseDuration,
      phaseStartTime: phaseStartTime,
      phaseDuration: phaseDuration
    });
    console.log(`→ Moving to results phase (${phaseDuration}s)`);
    
    // Process votes asynchronously (don't wait)
    handleVotingEnd(roomId).catch(err => console.error('Error handling voting end:', err));
    
    // PRE-FETCH NEXT PROMPT during results phase so it's ready instantly!
    console.log(`🔮 Pre-fetching next prompt during results phase...`);
    getRandomPrompt().then(prompt => {
      if (prompt) {
        console.log(`✅ Next prompt pre-fetched and ready: "${prompt.text?.substring(0, 30)}..."`);
      }
    }).catch(err => console.error('Error pre-fetching prompt:', err));
    
    setTimeout(async () => {
      await checkPhaseEnd(roomId, 'results', phaseStartTime);
    }, phaseDuration * 1000);
  } else if (phase === 'results') {
    // Check if game should continue or end
    await checkGameContinuation(roomId);
  }
}

// Check if game should continue to next round or end
async function checkGameContinuation(roomId) {
  console.log(`🏁 Checking game continuation for room ${roomId}`);
  
  // For now, always continue to next round for smooth gameplay
  // Winner checking happens in handleVotingEnd which already has the room data
  console.log(`➡️ Continuing to next round immediately`);
  await startNewRound(roomId);
  
  // TODO: Implement proper winner checking without slow Firestore query
  // Could check scores in Realtime Database or pass room data through
}

// Start a new round
async function startNewRound(roomId) {
  console.log(`🔄 Starting new round for room ${roomId}`);
  const startTime = Date.now();
  
  const roomRef = db.collection('rooms').doc(roomId);
  
  // Fetch room data and prompt in parallel
  const [roomSnap, prompt] = await Promise.all([
    roomRef.get(),
    getRandomPrompt()
  ]);
  
  const room = roomSnap.data();
  const nextRound = (room.currentRound || 0) + 1;
  
  if (!prompt) {
    console.error('No prompts available');
    return;
  }
  
  console.log(`→ Got prompt and room data in ${Date.now() - startTime}ms`);
  
  const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
  const phaseStartTime = Date.now();
  const phaseDuration = PHASE_DURATIONS.prompt;
  
  // Update Firestore and RTDB in parallel
  await Promise.all([
    roomRef.update({
      currentRound: nextRound,
      currentPrompt: prompt
    }),
    gameStateRef.update({
      phase: 'prompt',
      timeRemaining: phaseDuration,
      currentPrompt: prompt.text,
      currentRound: nextRound,
      submissions: {},
      votes: {},
      lastWinner: null,
      lastWinningPhrase: null,
      phaseStartTime: phaseStartTime,
      phaseDuration: phaseDuration
    })
  ]);
  
  console.log(`✅ New round started in ${Date.now() - startTime}ms`);
  
  // Schedule phase transition
  setTimeout(async () => {
    await checkPhaseEnd(roomId, 'prompt', phaseStartTime);
  }, phaseDuration * 1000);
}

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

// Initialize game - start first round immediately
async function startGameLoop(roomId) {
  try {
    const t0 = Date.now();
    console.log(`🎮 INSTANT SYSTEM: Starting game for room ${roomId}`);
    
    // Get first prompt from cache (instant)
    const prompt = await getRandomPrompt();
    if (!prompt) {
      console.error('No prompts available');
      return;
    }
    console.log(`✅ Got first prompt in ${Date.now() - t0}ms`);
    
    // Start first round immediately with timestamps
    const phaseStartTime = Date.now();
    const phaseDuration = PHASE_DURATIONS.prompt;
    
    const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
    await gameStateRef.set({
      phase: 'prompt',
      currentRound: 1,
      currentPrompt: prompt.text,
      phaseStartTime,
      phaseDuration,
      timeRemaining: phaseDuration,
      submissions: {},
      votes: {}
    });
    
    // Update Firestore
    const roomRef = db.collection('rooms').doc(roomId);
    await roomRef.update({
      currentRound: 1,
      currentPrompt: prompt.text
    });
    
    console.log(`✅ Game started in ${Date.now() - t0}ms - INSTANT!`);
    
    // Schedule phase transition
    setTimeout(async () => {
      await transitionToNextPhase(roomId, 'prompt');
    }, phaseDuration * 1000);
    
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

// Transition to next phase with instant timestamps
async function transitionToNextPhase(roomId, currentPhase) {
  const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
  
  if (currentPhase === 'prompt') {
    const phaseDuration = PHASE_DURATIONS.submission;
    const phaseStartTime = Date.now();
    await gameStateRef.update({
      phase: 'submission',
      phaseStartTime,
      phaseDuration,
      timeRemaining: phaseDuration
    });
    setTimeout(() => transitionToNextPhase(roomId, 'submission'), phaseDuration * 1000);
    
  } else if (currentPhase === 'submission') {
    handleSubmissionEnd(roomId).catch(err => console.error(err));
    const phaseDuration = PHASE_DURATIONS.voting;
    const phaseStartTime = Date.now();
    await gameStateRef.update({
      phase: 'voting',
      phaseStartTime,
      phaseDuration,
      timeRemaining: phaseDuration
    });
    setTimeout(() => transitionToNextPhase(roomId, 'voting'), phaseDuration * 1000);
    
  } else if (currentPhase === 'voting') {
    // Transition to results IMMEDIATELY - process votes in background
    const phaseDuration = PHASE_DURATIONS.results;
    const phaseStartTime = Date.now();
    await gameStateRef.update({
      phase: 'results',
      phaseStartTime,
      phaseDuration,
      timeRemaining: phaseDuration
    });
    
    // Process votes asynchronously (don't block)
    handleVotingEnd(roomId).catch(err => console.error('Error handling voting end:', err));
    
    setTimeout(() => transitionToNextPhase(roomId, 'results'), phaseDuration * 1000);
    
  } else if (currentPhase === 'results') {
    // Check if someone won, otherwise start next round
    await checkAndStartNextRound(roomId);
  }
}

// Check winner and start next round if needed
async function checkAndStartNextRound(roomId) {
  const roomRef = db.collection('rooms').doc(roomId);
  const roomSnap = await roomRef.get();
  
  if (!roomSnap.exists) return;
  
  const room = roomSnap.data();
  const scores = room?.scores || {};
  const winningVotes = room?.settings?.winningVotes || 20;
  const maxVotes = Math.max(...Object.values(scores).map(s => s?.totalVotes || 0), 0);
  
  if (maxVotes >= winningVotes) {
    console.log(`🏆 Winner found with ${maxVotes} votes!`);
    await endGame(roomId);
  } else {
    // Start next round with new prompt
    const prompt = await getRandomPrompt();
    if (!prompt) return;
    
    const currentRound = (room.currentRound || 0) + 1;
    const phaseStartTime = Date.now();
    const phaseDuration = PHASE_DURATIONS.prompt;
    
    await roomRef.update({
      currentRound,
      currentPrompt: prompt.text
    });
    
    const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
    await gameStateRef.update({
      phase: 'prompt',
      currentRound,
      currentPrompt: prompt.text,
      phaseStartTime,
      phaseDuration,
      timeRemaining: phaseDuration,
      submissions: {},
      votes: {}
    });
    
    console.log(`➡️ Starting round ${currentRound}`);
    setTimeout(() => transitionToNextPhase(roomId, 'prompt'), phaseDuration * 1000);
  }
}

// Process timeline and update phases
async function startTimelineProcessor(roomId) {
  const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
  
  // Check every second and update phase if needed
  const interval = setInterval(async () => {
    try {
      const snapshot = await gameStateRef.once('value');
      const gameState = snapshot.val();
      
      if (!gameState || !gameState.timeline) {
        clearInterval(interval);
        return;
      }
      
      const now = Date.now();
      const timeline = gameState.timeline;
      
      // Find current round and phase based on timeline
      for (const round of timeline.rounds) {
        for (const [phaseName, phaseData] of Object.entries(round.phases)) {
          const phaseEnd = phaseData.startTime + (phaseData.duration * 1000);
          
          if (now >= phaseData.startTime && now < phaseEnd) {
            // We're in this phase
            if (gameState.currentPhase !== phaseName || gameState.currentRound !== round.roundNumber) {
              // Phase changed - update
              await gameStateRef.update({
                currentPhase: phaseName,
                currentRound: round.roundNumber,
                currentPrompt: round.prompt
              });
              console.log(`⏰ Timeline: Round ${round.roundNumber}, Phase ${phaseName}`);
            }
            return;
          }
        }
      }
      
      // Game finished
      clearInterval(interval);
      console.log(`🏁 Game timeline completed for room ${roomId}`);
      
    } catch (error) {
      console.error('Error in timeline processor:', error);
    }
  }, 1000);
}

// Old functions removed - now using handlePhaseTransition and startNewRound
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
    
    if (!roomSnap.exists) {
      console.error(`❌ Room ${roomId} not found in handleVotingEnd`);
      return;
    }
    
    const room = roomSnap.data();
    const scores = room?.scores || {};

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
    const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
    await gameStateRef.update({
      lastWinner: winners[0] || null,
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
    const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
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
    const gameStateRef = rtdb.ref(`rooms/${roomId}/gameState`);
    await gameStateRef.remove();

    console.log(`Game ended early in room ${roomId}, winner: ${winnerId}`);
  } catch (error) {
    console.error('Error ending game early:', error);
  }
}

// Get random prompt - WITH IN-MEMORY CACHE
async function getRandomPrompt() {
  try {
    const t0 = Date.now();
    const now = Date.now();
    
    // Use cache if available and not expired
    if (promptsCache.length > 0 && (now - promptsCacheTime) < CACHE_DURATION) {
      console.log(`✅ Using cached prompts (${promptsCache.length} available)`);
      const randomIndex = Math.floor(Math.random() * promptsCache.length);
      const selected = promptsCache[randomIndex];
      console.log(`⚡ INSTANT: Selected "${selected.text?.substring(0, 30)}..." in ${Date.now() - t0}ms`);
      return selected;
    }
    
    // Cache expired or empty - fetch from Firestore
    console.log('🔍 Cache expired, fetching prompts from Firestore...');
    const snapshot = await db.collection('prompts').limit(50).get();
    console.log(`⏱️ Firestore query took ${Date.now() - t0}ms, got ${snapshot.size} prompts`);
    
    if (snapshot.empty) {
      console.error('❌ No prompts found in database!');
      return null;
    }

    // Update cache
    promptsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    promptsCacheTime = now;
    console.log(`💾 Cached ${promptsCache.length} prompts for 5 minutes`);
    
    const randomIndex = Math.floor(Math.random() * promptsCache.length);
    const selected = promptsCache[randomIndex];
    console.log(`✅ Selected prompt: "${selected.text?.substring(0, 30)}..."`);
    
    return selected;
  } catch (error) {
    console.error('❌ Error getting random prompt:', error);
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
