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
  
  const now = Date.now();
  let nextPhase = null;
  let nextDuration = 0;
  const updates = { phaseStart: now };
  
  console.log(`⏭️ Advancing ${roomId} from ${game.phase}`);
  
  switch (game.phase) {
    case 'prompt':
      nextPhase = 'submission';
      nextDuration = await getPhaseDurationForRoom(roomId, 'submission');
      updates.phase = nextPhase;
      updates.phaseDuration = nextDuration;
      updates.submissions = {}; // Clear submissions from previous round
      updates.votes = {}; // Clear votes from previous round
      break;
      
    case 'submission':
      nextPhase = 'voting';
      nextDuration = await getPhaseDurationForRoom(roomId, 'voting');
      updates.phase = nextPhase;
      updates.phaseDuration = nextDuration;
      // Don't process submissions - they're already in RTDB
      console.log(`📝 ${Object.keys(game.submissions || {}).length} submissions received`);
      break;
      
    case 'voting':
      // CRITICAL: Process votes BEFORE advancing to results
      // This ensures winner is calculated before results phase starts
      await processVotesSync(roomId, game.votes, game.submissions);
      
      nextPhase = 'results';
      nextDuration = await getPhaseDurationForRoom(roomId, 'results');
      updates.phase = nextPhase;
      updates.phaseDuration = nextDuration;
      // lastWinner and lastWinningPhrase are set by processVotesSync
      break;
      
    case 'results':
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
 * Start a new round
 */
async function startNewRound(roomId) {
  const roomDoc = await db.collection('rooms').doc(roomId).get();
  const room = roomDoc.data();
  
  const prompt = await getRandomPrompt(roomId);
  if (!prompt) return;
  
  const newRound = (room.currentRound || 0) + 1;
  const now = Date.now();
  const promptDuration = await getPhaseDurationForRoom(roomId, 'prompt');
  
  await rtdb.ref(`rooms/${roomId}/game`).update({
    phase: 'prompt',
    round: newRound,
    prompt: prompt.text,
    phaseStart: now,
    phaseDuration: promptDuration,
    submissions: {},
    votes: {},
    lastWinner: null,
    lastWinningPhrase: null
  });
  
  await db.collection('rooms').doc(roomId).update({
    currentRound: newRound,
    currentPrompt: prompt.text
  });
  
  console.log(`🔄 Round ${newRound} started: ${roomId} - "${prompt.text?.substring(0, 40)}..."`);
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
  
  // Count votes
  const voteCounts = {};
  Object.values(votes).forEach(votedFor => {
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });
  
  console.log(`🗳️ Vote counts:`, voteCounts);
  
  // Update scores
  Object.entries(voteCounts).forEach(([userId, count]) => {
    if (!scores[userId]) {
      scores[userId] = { totalVotes: 0, roundWins: 0, stars: 0, phrases: [] };
    }
    scores[userId].totalVotes += count;
  });
  
  // Find winner
  let winnerId = null;
  let maxVotes = 0;
  Object.entries(voteCounts).forEach(([userId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = userId;
    }
  });
  
  // Update round wins
  if (winnerId && scores[winnerId]) {
    scores[winnerId].roundWins += 1;
  }
  
  // Get winning phrase
  const winningPhrase = winnerId && submissions ? submissions[winnerId] : null;
  
  // Update Firestore scores
  await roomRef.update({ scores });
  
  // Update game state with winner info
  await rtdb.ref(`rooms/${roomId}/game`).update({
    lastWinner: winnerId || null,
    lastWinningPhrase: winningPhrase || null
  });
  
  console.log(`✅ Votes processed: ${winnerId} won with ${maxVotes} votes - "${winningPhrase?.substring(0, 40)}..."`);
}

/**
 * End game
 */
async function endGame(roomId) {
  await db.collection('rooms').doc(roomId).update({
    status: 'finished',
    endedAt: admin.firestore.Timestamp.now()
  });
  
  await rtdb.ref(`rooms/${roomId}/game`).remove();
  
  // Clear used prompts for this room
  clearRoomPrompts(roomId);
  
  console.log(`🏁 Game ended: ${roomId}`);
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
