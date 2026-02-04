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

// Phase durations (in seconds)
const DURATIONS = {
  prompt: 3,
  submission: 20,
  voting: 15,
  results: 8
};

/**
 * Start a new game
 * Sets up initial state and lets client handle all timing
 */
async function startGame(roomId) {
  console.log(`🎮 Starting game: ${roomId}`);
  
  // Get first prompt from cache (pass roomId for tracking)
  const prompt = await getRandomPrompt(roomId);
  if (!prompt) throw new Error('No prompts available');
  
  const now = Date.now();
  
  // Set game state - client will calculate timers from this
  await rtdb.ref(`rooms/${roomId}/game`).set({
    phase: 'prompt',
    round: 1,
    prompt: prompt.text,
    phaseStart: now,
    submissions: {},
    votes: {},
    lastWinner: null
  });
  
  // Update Firestore
  await db.collection('rooms').doc(roomId).update({
    status: 'active',
    currentRound: 1,
    currentPrompt: prompt.text,
    gameStartedAt: admin.firestore.Timestamp.now()
  });
  
  console.log(`✅ Game started: ${roomId}`);
}

/**
 * Advance to next phase
 * Called by client when timer expires OR by scheduled function as backup
 */
async function advancePhase(roomId) {
  const gameRef = rtdb.ref(`rooms/${roomId}/game`);
  const snapshot = await gameRef.once('value');
  const game = snapshot.val();
  
  if (!game) return;
  
  const now = Date.now();
  const updates = { phaseStart: now };
  
  switch (game.phase) {
    case 'prompt':
      updates.phase = 'submission';
      break;
      
    case 'submission':
      updates.phase = 'voting';
      // Process submissions in background
      processSubmissions(roomId, game.submissions).catch(console.error);
      break;
      
    case 'voting':
      updates.phase = 'results';
      // Process votes in background
      processVotes(roomId, game.votes).catch(console.error);
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
  console.log(`⏭️ ${roomId}: ${game.phase} → ${updates.phase}`);
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
  
  await rtdb.ref(`rooms/${roomId}/game`).update({
    phase: 'prompt',
    round: newRound,
    prompt: prompt.text,
    phaseStart: now,
    submissions: {},
    votes: {}
  });
  
  await db.collection('rooms').doc(roomId).update({
    currentRound: newRound,
    currentPrompt: prompt.text
  });
  
  console.log(`🔄 New round ${newRound}: ${roomId}`);
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
 * Process votes and update scores (async, doesn't block)
 */
async function processVotes(roomId, votes) {
  if (!votes || Object.keys(votes).length === 0) return;
  
  const roomRef = db.collection('rooms').doc(roomId);
  const roomDoc = await roomRef.get();
  const room = roomDoc.data();
  const scores = room?.scores || {};
  
  // Count votes
  const voteCounts = {};
  Object.values(votes).forEach(votedFor => {
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });
  
  // Update scores
  Object.entries(voteCounts).forEach(([userId, count]) => {
    if (!scores[userId]) {
      scores[userId] = { totalVotes: 0, roundWins: 0, stars: 0, phrases: [] };
    }
    scores[userId].totalVotes += count;
  });
  
  // Find winner
  const winner = Object.entries(voteCounts).reduce((a, b) => b[1] > a[1] ? b : a, ['', 0]);
  if (winner[0] && scores[winner[0]]) {
    scores[winner[0]].roundWins += 1;
  }
  
  await roomRef.update({ scores });
  
  // Update game state with winner
  await rtdb.ref(`rooms/${roomId}/game`).update({
    lastWinner: winner[0] || null
  });
  
  console.log(`🗳️ Processed votes: winner ${winner[0]} with ${winner[1]} votes`);
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
 * Get phase duration
 */
function getPhaseDuration(phase) {
  return DURATIONS[phase] || 0;
}

module.exports = {
  startGame,
  advancePhase,
  startNewRound,
  getPhaseDuration,
  clearRoomPrompts,
  DURATIONS
};
