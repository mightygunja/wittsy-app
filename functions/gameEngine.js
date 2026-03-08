/**
 * PROFESSIONAL GAME ENGINE - Clean Room Redesign
 * 
 * Architecture:
 * - Server stores ONLY game state (phase, round, prompt)
 * - Server does NOT manage timers or transitions
 * - Client calculates ALL timers locally
 * - Server validates submissions/votes when they come in
 * - Cloud Scheduler triggers phase checks every 10 seconds (backup only)
 */

const admin = require('firebase-admin');
const db = admin.firestore();
const rtdb = admin.database();

// Default phase durations (in seconds) - used as fallback only
const DEFAULT_DURATIONS = {
  prompt: 5,
  submission: 30,
  voting: 20,
  results: 10
};

/**
 * Get phase duration from room settings
 */
async function getPhaseDurationForRoom(roomId, phase) {
  try {
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    const room = roomDoc.data();
    const settings = room?.settings || {};
    
    switch (phase) {
      case 'prompt':
        return DEFAULT_DURATIONS.prompt; // Prompt is always fixed
      case 'submission':
        return settings.submissionTime || DEFAULT_DURATIONS.submission;
      case 'voting':
        return settings.votingTime || DEFAULT_DURATIONS.voting;
      case 'results':
        return DEFAULT_DURATIONS.results; // Results is always fixed
      default:
        return DEFAULT_DURATIONS[phase] || 10;
    }
  } catch (error) {
    console.error('Error getting phase duration:', error);
    return DEFAULT_DURATIONS[phase] || 10;
  }
}

/**
 * Start a new game
 * Sets up initial state with proper timing
 */
async function startGame(roomId) {
  console.log(`🎮 Starting game: ${roomId}`);
  
  // Get first prompt from cache (pass roomId for tracking)
  const prompt = await getRandomPrompt(roomId);
  if (!prompt) throw new Error('No prompts available');
  
  const now = Date.now();
  const promptDuration = await getPhaseDurationForRoom(roomId, 'prompt');
  
  // Set game state - client will calculate timers from this
  await rtdb.ref(`rooms/${roomId}/game`).set({
    phase: 'prompt',
    round: 1,
    prompt: prompt.text,
    phaseStart: now,
    phaseDuration: promptDuration,
    submissions: {},
    votes: {},
    lastWinner: null,
    lastWinningPhrase: null
  });
  
  // Update Firestore
  await db.collection('rooms').doc(roomId).update({
    status: 'active',
    currentRound: 1,
    currentPrompt: prompt.text,
    gameStartedAt: admin.firestore.Timestamp.now()
  });
  
  console.log(`✅ Game started: ${roomId} - Prompt phase (${promptDuration}s)`);
}

/**
 * Advance to next phase
 * Called by client when timer expires OR by scheduled function as backup
 */
async function advancePhase(roomId) {
  const gameRef = rtdb.ref(`rooms/${roomId}/game`);
  const snapshot = await gameRef.once('value');
  const game = snapshot.val();
  
  if (!game) {
    console.log(`⚠️ No game state for ${roomId}`);
    return;
  }
  
  // PRODUCTION FIX: Prevent race conditions - check if phase was already advanced
  const elapsed = (Date.now() - game.phaseStart) / 1000;
  if (elapsed < 1) {
    console.log(`⏸️ Skipping advance - phase just started (${elapsed.toFixed(2)}s ago)`);
    return;
  }
  
  const now = Date.now();
  let nextPhase = null;
  let nextDuration = 0;
  const updates = { phaseStart: now };
  
  console.log(`⏭️ Advancing ${roomId} from ${game.phase}`);
  
  switch (game.phase) {
    case 'prompt':
      nextPhase = 'submission';
      nextDuration = await getPhaseDurationForRoom(roomId, 'submission');
      // PRODUCTION FIX: Enforce minimum 10 seconds for submission
      nextDuration = Math.max(10, nextDuration);
      updates.phase = nextPhase;
      updates.phaseDuration = nextDuration;
      updates.prompt = game.prompt; // CRITICAL: Preserve prompt across phase transitions
      updates.submissions = {}; // Clear submissions from previous round
      updates.votes = {}; // Clear votes from previous round
      break;
      
    case 'submission':
      // Get player count from Firestore
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      const playerCount = roomDoc.data()?.players?.length || 0;
      const submissionCount = Object.keys(game.submissions || {}).length;
      console.log(`📝 ${submissionCount} submissions received from ${playerCount} players`);
      
      if (submissionCount === 0) {
        console.log(`⚠️ No submissions - extending submission phase by 5s`);
        updates.phaseStart = now;
        updates.phaseDuration = 5;
        await gameRef.update(updates);
        return;
      }
      
      // Filter late submissions — add 3s grace period for client/server clock drift and network latency.
      // Submissions use client Date.now(); phaseStart uses server Date.now() — there can be drift.
      const GRACE_MS = 3000;
      const submissionPhaseEnd = game.phaseStart + (game.phaseDuration * 1000) + GRACE_MS;
      const validSubmissions = {};
      Object.entries(game.submissions || {}).forEach(([userId, submission]) => {
        const submissionData = typeof submission === 'object' ? submission : { phrase: submission, timestamp: game.phaseStart };
        const submissionTime = submissionData.timestamp || game.phaseStart;

        if (submissionTime <= submissionPhaseEnd) {
          validSubmissions[userId] = submissionData.phrase || submission;
        } else {
          console.log(`⏰ EXCLUDED submission from ${userId} (${Math.round((submissionTime - submissionPhaseEnd) / 1000)}s past grace period)`);
        }
      });

      const validSubmissionCount = Object.keys(validSubmissions).length;
      console.log(`✅ Valid submissions for voting: ${validSubmissionCount}/${submissionCount}`);

      // If 3+ players and fewer than 3 valid submissions, show "not enough" for 5s then new round.
      // IMPORTANT: Do NOT use setTimeout here — Cloud Function containers can be terminated before
      // a deferred callback fires. Instead, set phaseDuration=5 and let the client timer call
      // advancePhase when it hits 0, which then calls startNewRound via case 'insufficient'.
      if (playerCount >= 3 && validSubmissionCount < 3) {
        console.log(`⚠️ Not enough valid submissions (${validSubmissionCount}/3) - insufficient phase`);
        updates.phase = 'insufficient';
        updates.phaseDuration = 5;
        updates.prompt = game.prompt;
        updates.insufficientSubmissions = true;
        await gameRef.update(updates);
        return;
      }
      
      nextPhase = 'voting';
      nextDuration = await getPhaseDurationForRoom(roomId, 'voting');
      // PRODUCTION FIX: Enforce minimum 8 seconds for voting to ensure it shows
      nextDuration = Math.max(8, nextDuration);
      updates.phase = nextPhase;
      updates.phaseDuration = nextDuration;
      updates.prompt = game.prompt; // CRITICAL: Preserve prompt across phase transitions
      updates.validSubmissions = validSubmissions; // Store filtered submissions for voting
      break;
      
    case 'voting':
      // PRODUCTION FIX: Ensure at least 1 vote before advancing
      const voteCount = Object.keys(game.votes || {}).length;
      console.log(`🗳️ ${voteCount} votes received`);
      
      if (voteCount === 0) {
        console.log(`⚠️ No votes - extending voting phase by 5s`);
        updates.phaseStart = now;
        updates.phaseDuration = 5;
        await gameRef.update(updates);
        return;
      }
      
      // CRITICAL: Process votes BEFORE advancing to results
      // This ensures winner is calculated before results phase starts
      // Pass validSubmissions so only on-time submissions are used for winner phrase lookup
      await processVotesSync(roomId, game.votes, game.validSubmissions || game.submissions);
      
      nextPhase = 'results';
      nextDuration = await getPhaseDurationForRoom(roomId, 'results');
      // PRODUCTION FIX: Enforce minimum 5 seconds for results to show
      nextDuration = Math.max(5, nextDuration);
      updates.phase = nextPhase;
      updates.phaseDuration = nextDuration;
      updates.prompt = game.prompt; // CRITICAL: Preserve prompt across phase transitions
      // lastWinner and lastWinningPhrase are set by processVotesSync
      break;
      
    case 'insufficient': {
      // Re-read state to prevent concurrent advance from another client
      const insuffSnap = await gameRef.once('value');
      const insuffGame = insuffSnap.val();
      if (!insuffGame || insuffGame.phase !== 'insufficient') {
        console.log(`⏸️ Insufficient phase already advanced (phase: ${insuffGame?.phase}) — skipping`);
        return;
      }
      return startNewRound(roomId);
    }

    case 'results':
      // Re-read the CURRENT game state immediately before acting — the snapshot
      // at the top of this function may be stale if another client already advanced.
      const freshSnap = await gameRef.once('value');
      const freshGame = freshSnap.val();
      if (!freshGame || freshGame.phase !== 'results') {
        console.log(`⏸️ Results already advanced by another client (phase: ${freshGame?.phase}) — skipping`);
        return;
      }
      // Check for winner or start new round
      const shouldContinue = await checkWinner(roomId);
      if (shouldContinue) {
        return startNewRound(roomId);
      }
      return;
  }
  
  await gameRef.update(updates);
  console.log(`✅ ${roomId}: ${game.phase} → ${nextPhase} (${nextDuration}s)`);
}

/**
 * Start a new round.
 *
 * Uses a RTDB transaction to guarantee only ONE concurrent call commits.
 * Root cause of prompt-flip bug: all clients call advancePhase when their
 * timer hits 0. Multiple Cloud Function instances run concurrently, each
 * picks a different random prompt, and the last writer wins — causing the
 * visible prompt to change. The transaction ensures only the first call
 * that sees phase='results'|'insufficient' commits; subsequent calls abort.
 */
async function startNewRound(roomId) {
  const gameRef = rtdb.ref(`rooms/${roomId}/game`);
  const roomDoc = await db.collection('rooms').doc(roomId).get();
  const room = roomDoc.data();

  const prompt = await getRandomPrompt(roomId);
  if (!prompt) return;

  const newRound = (room.currentRound || 0) + 1;
  const now = Date.now();
  const promptDuration = await getPhaseDurationForRoom(roomId, 'prompt');

  const newState = {
    phase: 'prompt',
    round: newRound,
    prompt: prompt.text,
    phaseStart: now,
    phaseDuration: promptDuration,
    submissions: {},
    votes: {},
    validSubmissions: null,
    insufficientSubmissions: null,
    lastWinner: null,
    lastWinningPhrase: null
  };

  // Transaction: only commit if still in a phase that should trigger a new round.
  // If another client already set phase='prompt', this aborts — preventing the flip.
  const result = await gameRef.transaction((currentGame) => {
    if (!currentGame) return newState; // No existing state — safe to write
    const phase = currentGame.phase;
    if (phase === 'results' || phase === 'insufficient' || phase === null) {
      return newState; // Commit: we are the first to advance
    }
    // Already in 'prompt' or another phase — someone beat us here, abort
    console.log(`⏸️ startNewRound transaction aborted — phase already '${phase}', skipping`);
    return; // Returning undefined aborts the transaction
  });

  if (!result.committed) {
    console.log(`⏸️ startNewRound: skipped for ${roomId} (concurrent call already started round)`);
    return;
  }

  // Only update Firestore if we won the transaction
  await db.collection('rooms').doc(roomId).update({
    currentRound: newRound,
    currentPrompt: prompt.text
  });

  console.log(`🔄 Round ${newRound} started: ${roomId} - "${prompt.text?.substring(0, 40)}..." (prompt locked via transaction)`);
}

/**
 * Check if someone won
 */
async function checkWinner(roomId) {
  const roomDoc = await db.collection('rooms').doc(roomId).get();
  const room = roomDoc.data();
  const scores = room?.scores || {};
  const winningVotes = room?.settings?.winningVotes || 20;
  
  const maxVotes = Math.max(...Object.values(scores).map(s => s?.totalVotes || 0), 0);
  
  if (maxVotes >= winningVotes) {
    await endGame(roomId);
    return false;
  }
  
  return true;
}

/**
 * Process submissions (async, doesn't block)
 */
async function processSubmissions(roomId, submissions) {
  // Just log for now - submissions are already in RTDB
  console.log(`📝 Processed ${Object.keys(submissions || {}).length} submissions`);
}

/**
 * Process votes and update scores (SYNCHRONOUS - must complete before results phase)
 */
async function processVotesSync(roomId, votes, submissions) {
  if (!votes || Object.keys(votes).length === 0) {
    console.log(`⚠️ No votes to process for ${roomId}`);
    return;
  }

  const roomRef = db.collection('rooms').doc(roomId);
  const roomDoc = await roomRef.get();
  const room = roomDoc.data();
  const scores = room?.scores || {};

  // Read validSubmissions from RTDB to know which players actually submitted on time
  const gameSnapshot = await rtdb.ref(`rooms/${roomId}/game`).once('value');
  const gameData = gameSnapshot.val() || {};
  const validSubmissions = gameData.validSubmissions || null;

  // CRITICAL: Count votes correctly - each vote should add exactly 1
  // Rules enforced server-side (frontend also enforces, but backend is the source of truth):
  //   1. No self-voting
  //   2. Voter must have submitted on time (non-submitters cannot vote)
  //   3. Cannot vote for a player who didn't submit on time
  const voteCounts = {};
  Object.entries(votes).forEach(([voterId, votedFor]) => {
    // Block self-votes unconditionally
    if (voterId === votedFor) {
      console.log(`⚠️ BLOCKED self-vote from ${voterId}`);
      return;
    }
    // Block votes FROM players who didn't submit on time
    if (validSubmissions && !(voterId in validSubmissions)) {
      console.log(`⚠️ BLOCKED vote from ${voterId} - did not submit on time (non-submitters cannot vote)`);
      return;
    }
    // Block votes FOR players who didn't submit on time
    if (validSubmissions && !(votedFor in validSubmissions)) {
      console.log(`⚠️ BLOCKED vote for ${votedFor} - not in validSubmissions (late or no submission)`);
      return;
    }
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });
  
  console.log(`🗳️ Vote counts for this round:`, voteCounts);
  console.log(`📊 Current cumulative scores BEFORE update:`, JSON.stringify(scores));
  
  // CRITICAL: Only add votes from THIS round, not duplicate
  // Initialize scores for new players
  Object.keys(voteCounts).forEach(userId => {
    if (!scores[userId]) {
      scores[userId] = { totalVotes: 0, roundWins: 0, stars: 0, phrases: [] };
    }
  });
  
  // Add THIS round's votes to cumulative total (1 vote = +1 to total)
  Object.entries(voteCounts).forEach(([userId, count]) => {
    scores[userId].totalVotes += count;
    console.log(`➕ Adding ${count} votes to ${userId}, new total: ${scores[userId].totalVotes}`);
  });
  
  console.log(`📊 Updated cumulative scores AFTER update:`, JSON.stringify(scores));
  
  // Find winner(s) - handle ties by finding ALL players with max votes
  let maxVotes = 0;
  Object.values(voteCounts).forEach(count => {
    if (count > maxVotes) maxVotes = count;
  });
  
  // Get all winners (in case of tie)
  const winners = Object.entries(voteCounts)
    .filter(([userId, count]) => count === maxVotes)
    .map(([userId]) => userId);
  
  console.log(`🏆 Round winners (${maxVotes} votes each):`, winners);
  
  // Update round wins for ALL winners and give +2 vote bonus
  winners.forEach(winnerId => {
    if (scores[winnerId]) {
      scores[winnerId].roundWins += 1;
      scores[winnerId].totalVotes += 2; // +2 vote bonus for winning round
      console.log(`🏆 Round winner ${winnerId} gets +2 bonus votes, new total: ${scores[winnerId].totalVotes}`);
    }
  });
  
  // Get winning phrases — use validSubmissions (plain strings) first, then fall back to submissions
  const winningPhrases = winners.map(winnerId => {
    // validSubmissions stores plain strings; submissions may store {phrase, timestamp} objects
    if (validSubmissions && validSubmissions[winnerId]) {
      return validSubmissions[winnerId];
    }
    const sub = submissions[winnerId];
    if (!sub) return null;
    return typeof sub === 'object' ? (sub.phrase || null) : sub;
  }).filter(p => p);
  
  // Update Firestore scores
  await roomRef.update({ scores });
  
  // Update game state with winner info (support multiple winners)
  await rtdb.ref(`rooms/${roomId}/game`).update({
    lastWinners: winners, // Array of winner IDs
    lastWinner: winners[0] || null, // Keep for backwards compatibility
    lastWinningPhrases: winningPhrases, // Array of winning phrases
    lastWinningPhrase: winningPhrases[0] || null, // Keep for backwards compatibility
    roundVoteCounts: voteCounts // Store vote counts for this round
  });
  
  if (winners.length > 1) {
    console.log(`✅ TIE! ${winners.length} winners with ${maxVotes} votes each`);
  } else {
    console.log(`✅ Votes processed: ${winners[0]} won with ${maxVotes} votes - "${winningPhrases[0]?.substring(0, 40)}..."`);
  }
}

/**
 * End game
 */
async function endGame(roomId) {
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    const room = roomDoc.data();
    const scores = room?.scores || {};
    
    // Find winner(s) - handle ties at game end too
    let maxVotes = 0;
    Object.entries(scores).forEach(([userId, data]) => {
      const totalVotes = data?.totalVotes || 0;
      if (totalVotes > maxVotes) {
        maxVotes = totalVotes;
      }
    });
    
    // Get all winners with max votes (in case of tie)
    const winners = Object.entries(scores)
      .filter(([userId, data]) => (data?.totalVotes || 0) === maxVotes)
      .map(([userId]) => userId);
    
    const winnerId = winners[0] || null;
    
    console.log(`🏆 GAME END - Winner(s) with ${maxVotes} votes:`, winners);
    
    // Update room status
    await roomRef.update({
      status: 'finished',
      endedAt: admin.firestore.Timestamp.now()
    });
    
    // Save match history for each player with their best phrase and prompt
    const gameSnapshot = await rtdb.ref(`rooms/${roomId}/game`).once('value');
    const gameData = gameSnapshot.val();
    const allSubmissions = {}; // Collect all submissions from all rounds
    const allPrompts = {}; // Map userId to their prompts
    
    // Get submission history from RTDB (if available)
    const submissionsSnapshot = await rtdb.ref(`rooms/${roomId}/submissions`).once('value');
    const submissionsData = submissionsSnapshot.val() || {};
    
    // Build map of user's best phrase and corresponding prompt
    Object.entries(submissionsData).forEach(([roundKey, roundData]) => {
      if (roundData && typeof roundData === 'object') {
        Object.entries(roundData).forEach(([userId, submission]) => {
          if (submission && typeof submission === 'object') {
            const phrase = submission.phrase || submission.text;
            const prompt = submission.prompt || roundData.prompt;
            if (phrase && !allSubmissions[userId]) {
              allSubmissions[userId] = phrase;
              allPrompts[userId] = prompt;
            }
          }
        });
      }
    });
    
    // Save match history for each player
    const batch = db.batch();
    const players = room?.players || [];
    
    for (const player of players) {
      const userId = player.userId;
      const userScore = scores[userId] || { totalVotes: 0, roundWins: 0, stars: 0 };
      const bestPhrase = allSubmissions[userId] || '';
      const prompt = allPrompts[userId] || room?.currentPrompt || '';
      const stars = userScore.stars || 0;
      const won = userId === winnerId;
      
      // Only save if player submitted at least one phrase
      if (bestPhrase) {
        const matchRef = db.collection('matches').doc();
        batch.set(matchRef, {
          roomId: roomId,
          roomName: room.name || 'Unknown Room',
          userId: userId,
          username: player.username || 'Unknown',
          bestPhrase: bestPhrase,
          prompt: prompt, // CRITICAL: Save prompt with phrase
          stars: stars,
          totalVotes: userScore.totalVotes || 0,
          roundWins: userScore.roundWins || 0,
          won: won,
          rounds: room.currentRound || 1,
          playedAt: admin.firestore.Timestamp.now(),
          createdAt: admin.firestore.Timestamp.now(),
        });
      }
    }
    
    await batch.commit();
    
    // Clear game state
    await rtdb.ref(`rooms/${roomId}/game`).remove();
    await rtdb.ref(`rooms/${roomId}/submissions`).remove();
    
    // Clear used prompts for this room
    clearRoomPrompts(roomId);
    
    console.log(`🏁 Game ended: ${roomId} - Winner: ${winnerId} with ${maxVotes} votes`);
  } catch (error) {
    console.error(`❌ Error ending game ${roomId}:`, error);
    // Still try to clean up
    await rtdb.ref(`rooms/${roomId}/game`).remove();
    clearRoomPrompts(roomId);
  }
}

/**
 * Get random prompt (with caching and session-based deduplication)
 */
let promptsCache = [];
let cacheTime = 0;
const usedPromptsPerRoom = new Map(); // Track used prompts per room session

async function getRandomPrompt(roomId) {
  const now = Date.now();
  
  // Refresh cache every 5 minutes
  if (promptsCache.length === 0 || (now - cacheTime) > 300000) {
    const snapshot = await db.collection('prompts')
      .where('status', '==', 'active')
      .limit(200)
      .get();
    promptsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cacheTime = now;
    console.log(`📚 Loaded ${promptsCache.length} prompts into cache`);
  }
  
  // Get used prompts for this room session
  const usedPrompts = usedPromptsPerRoom.get(roomId) || new Set();
  
  // Filter out used prompts
  const availablePrompts = promptsCache.filter(p => !usedPrompts.has(p.id));
  
  // If all prompts used, reset for this room
  if (availablePrompts.length === 0) {
    console.log(`🔄 All prompts used in room ${roomId}, resetting...`);
    usedPrompts.clear();
    usedPromptsPerRoom.set(roomId, usedPrompts);
    return promptsCache[Math.floor(Math.random() * promptsCache.length)];
  }
  
  // Select random prompt from available
  const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
  
  // Mark as used for this room
  usedPrompts.add(selectedPrompt.id);
  usedPromptsPerRoom.set(roomId, usedPrompts);
  
  console.log(`✅ Selected prompt for room ${roomId}: "${selectedPrompt.text?.substring(0, 40)}..." (${usedPrompts.size}/${promptsCache.length} used)`);
  
  return selectedPrompt;
}

/**
 * Clear used prompts for a room (call when game ends)
 */
function clearRoomPrompts(roomId) {
  usedPromptsPerRoom.delete(roomId);
  console.log(`🧹 Cleared prompt history for room ${roomId}`);
}

/**
 * Get phase duration (for backup scheduler)
 */
function getPhaseDuration(phase) {
  return DEFAULT_DURATIONS[phase] || 10;
}

module.exports = {
  startGame,
  advancePhase,
  startNewRound,
  getPhaseDuration,
  getPhaseDurationForRoom,
  clearRoomPrompts,
  DEFAULT_DURATIONS
};
