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
const { isCleanForPublic } = require('./contentFilter');
const db = admin.firestore();
const rtdb = admin.database();

// Minimum votes required for a phrase to earn a star
const STAR_THRESHOLD = 4;

// Default phase durations (in seconds) - must match client PHASE_DURATIONS in useGameTimer.ts
const DEFAULT_DURATIONS = {
  prompt: 3,
  submission: 25,
  voting: 10,
  results: 8
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

  // No previously-used prompts at game start
  const prompt = await getRandomPrompt([]);
  if (!prompt) throw new Error('No prompts available');

  const now = Date.now();
  const promptDuration = await getPhaseDurationForRoom(roomId, 'prompt');

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

  // Store usedPromptIds in Firestore so all CF instances share the same list
  await db.collection('rooms').doc(roomId).update({
    status: 'active',
    currentRound: 1,
    currentPrompt: prompt.text,
    usedPromptIds: [prompt.id],
    gameStartedAt: admin.firestore.Timestamp.now()
  });

  console.log(`✅ Game started: ${roomId} - prompt "${prompt.text?.substring(0, 40)}" (id: ${prompt.id})`);
}

/**
 * Advance to next phase.
 * Called by client when timer expires.
 *
 * Race condition context: all clients fire advancePhase when their timer hits 0.
 * With N players there are N concurrent Cloud Function calls. For most phases the
 * double-check (fresh re-read before writing) is sufficient to drop duplicate calls.
 *
 * The submission phase needs a stronger guard: a delayed call that arrives 1-2 seconds
 * after the submission phase starts will bypass the 1-second guard, read 0 submissions
 * (nobody has had time to type yet), and incorrectly trigger insufficient → new round.
 * Fix: reject submission-phase advances that arrive more than 3 seconds before the
 * configured deadline, unless every player in the room has already submitted
 * (the legitimate everyone-is-done early advance).
 */
async function advancePhase(roomId) {
  const gameRef = rtdb.ref(`rooms/${roomId}/game`);
  const snapshot = await gameRef.once('value');
  const game = snapshot.val();

  if (!game) {
    console.log(`⚠️ No game state for ${roomId}`);
    return;
  }

  // Basic guard against back-to-back duplicate calls. Racing calls that land
  // early in the submission phase (and would see 0 submissions) are rejected
  // by the clock-skew guard inside the submission case, which allows an early
  // advance only when every player has already submitted.
  const minElapsed = 1;
  const elapsed = (Date.now() - game.phaseStart) / 1000;
  if (elapsed < minElapsed) {
    console.log(`⏸️ Skipping advance - ${elapsed.toFixed(2)}s elapsed (min ${minElapsed}s for ${game.phase})`);
    return;
  }

  console.log(`⏭️ Advancing ${roomId} from ${game.phase}`);

  switch (game.phase) {
    case 'prompt': {
      const nextDuration = Math.max(10, await getPhaseDurationForRoom(roomId, 'submission'));
      await gameRef.update({
        phase: 'submission',
        phaseDuration: nextDuration,
        phaseStart: Date.now(),
        prompt: game.prompt,
        submissions: {},
        votes: {},
      });
      console.log(`✅ ${roomId}: prompt → submission (${nextDuration}s)`);
      return;
    }

    case 'submission': {
      // Fresh read — if another concurrent call already advanced, bail out.
      const freshSubSnap = await gameRef.once('value');
      const freshSubGame = freshSubSnap.val();
      if (!freshSubGame || freshSubGame.phase !== 'submission') {
        console.log(`⏸️ submission already moved to '${freshSubGame?.phase}' — skipping`);
        return;
      }

      const roomDoc = await db.collection('rooms').doc(roomId).get();
      const playerCount = roomDoc.data()?.players?.length || 0;

      // Clock-skew guard: a client with a fast clock (or a buggy timer) must not be
      // able to end the submission phase early for the whole room. Only allow an
      // early advance when every player in the room has already submitted.
      const subElapsed = (Date.now() - freshSubGame.phaseStart) / 1000;
      const configuredDuration = freshSubGame.phaseDuration || 0;
      const submittedCount = Object.keys(freshSubGame.submissions || {}).length;
      if (configuredDuration - subElapsed > 3 && submittedCount < playerCount) {
        console.log(`⏸️ Early advance rejected - ${subElapsed.toFixed(1)}s/${configuredDuration}s elapsed, ${submittedCount}/${playerCount} submitted`);
        return;
      }

      const votingDuration = Math.max(8, await getPhaseDurationForRoom(roomId, 'voting'));
      const subNow = Date.now();

      const submissions = freshSubGame.submissions || {};
      const validSubmissions = {};
      Object.entries(submissions).forEach(([userId, submission]) => {
        const submissionData = typeof submission === 'object' ? submission : { phrase: submission };
        const phrase = submissionData.phrase || submission;
        if (phrase && String(phrase).trim()) {
          validSubmissions[userId] = phrase;
        }
      });
      const validSubmissionCount = Object.keys(validSubmissions).length;

      // Require at least 3 valid submissions to proceed to voting.
      if (validSubmissionCount < 3) {
        console.log(`⚠️ ${roomId}: ${validSubmissionCount}/${playerCount} submissions — insufficient`);
        await gameRef.update({
          phase: 'insufficient',
          phaseDuration: 5,
          phaseStart: subNow,
          prompt: freshSubGame.prompt,
          insufficientSubmissions: true,
        });
        return;
      }

      await gameRef.update({
        phase: 'voting',
        phaseDuration: votingDuration,
        phaseStart: subNow,
        prompt: freshSubGame.prompt,
        validSubmissions,
      });
      console.log(`✅ ${roomId}: submission → voting (${votingDuration}s) | ${validSubmissionCount} valid submissions`);
      return;
    }

    case 'voting': {
      // Fresh read — if another concurrent call already advanced, bail out.
      const freshVotingSnap = await gameRef.once('value');
      const freshVotingGame = freshVotingSnap.val();
      if (!freshVotingGame || freshVotingGame.phase !== 'voting') {
        console.log(`⏸️ Voting already moved to '${freshVotingGame?.phase}' — skipping`);
        return;
      }

      console.log(`🗳️ ${Object.keys(freshVotingGame.votes || {}).length} votes received`);

      const winnerData = await processVotesSync(
        roomId,
        freshVotingGame.votes,
        freshVotingGame.validSubmissions || null,
        freshVotingGame.round || 0,
        freshVotingGame.prompt || ''
      );

      const resultsDuration = Math.max(5, await getPhaseDurationForRoom(roomId, 'results'));
      const votingUpdates = {
        phase: 'results',
        phaseDuration: resultsDuration,
        phaseStart: Date.now(),
        prompt: freshVotingGame.prompt,
      };
      if (winnerData) {
        Object.assign(votingUpdates, winnerData);
      } else {
        // Zero-vote round: explicitly clear winner fields so clients don't
        // display the previous round's winner on the results screen.
        Object.assign(votingUpdates, {
          lastWinners: null,
          lastWinner: null,
          lastWinningPhrases: null,
          lastWinningPhrase: null,
          roundVoteCounts: null,
        });
      }

      await gameRef.update(votingUpdates);
      console.log(`✅ ${roomId}: voting → results (${resultsDuration}s)`);
      return;
    }

    case 'insufficient': {
      const insuffSnap = await gameRef.once('value');
      const insuffGame = insuffSnap.val();
      if (!insuffGame || insuffGame.phase !== 'insufficient') {
        console.log(`⏸️ Insufficient phase already advanced (${insuffGame?.phase}) — skipping`);
        return;
      }
      return startNewRound(roomId);
    }

    case 'results': {
      const freshSnap = await gameRef.once('value');
      const freshGame = freshSnap.val();
      if (!freshGame || freshGame.phase !== 'results') {
        console.log(`⏸️ Results already advanced (${freshGame?.phase}) — skipping`);
        return;
      }
      const shouldContinue = await checkWinner(roomId);
      if (shouldContinue) {
        return startNewRound(roomId);
      }
      return;
    }

    default:
      console.log(`⚠️ Unknown phase '${game.phase}' for ${roomId}`);
      return;
  }
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

  if (!room) {
    console.log(`⚠️ startNewRound: room ${roomId} not found in Firestore — skipping`);
    return;
  }

  // Read usedPromptIds from Firestore — shared across ALL Cloud Function instances.
  // This is the ONLY reliable way to prevent prompt repetition since in-memory state
  // is not shared between concurrent CF instances.
  const usedPromptIds = room?.usedPromptIds || [];
  const prompt = await getRandomPrompt(usedPromptIds);
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
    lastWinningPhrase: null,
    lastWinners: null,
    lastWinningPhrases: null,
    roundVoteCounts: null
  };

  // RTDB transaction: only ONE concurrent call commits (prompt-flip prevention).
  // The loser calls return here without updating Firestore, so only one prompt is used.
  const result = await gameRef.transaction((currentGame) => {
    if (!currentGame) return newState;
    const phase = currentGame.phase;
    if (phase === 'results' || phase === 'insufficient' || phase === null) {
      return newState; // Commit: we are the first to advance
    }
    console.log(`⏸️ startNewRound transaction aborted — phase already '${phase}', skipping`);
    return; // Abort
  });

  if (!result.committed) {
    console.log(`⏸️ startNewRound: skipped for ${roomId} (concurrent call already started round)`);
    return;
  }

  // Only update Firestore if we won the RTDB transaction.
  // Append this prompt's ID to usedPromptIds using arrayUnion (atomic, safe for concurrent writes).
  await db.collection('rooms').doc(roomId).update({
    currentRound: newRound,
    currentPrompt: prompt.text,
    usedPromptIds: admin.firestore.FieldValue.arrayUnion(prompt.id)
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
 *
 * Uses a Firestore TRANSACTION with round-based idempotency tracking.
 * Root cause of double-counting: all clients call advancePhase simultaneously.
 * Multiple Cloud Function instances all reach processVotesSync, read the same
 * Firestore scores, and each writes votes back — the second write adds votes
 * a second time. The transaction + lastProcessedRound guard prevents any
 * second call from committing for the same round.
 */
/**
 * validSubmissions: the filtered set of on-time submissions (plain string map userId→phrase)
 *                  passed directly from the caller — do NOT re-read RTDB to avoid stale data.
 * currentRound:    round number, also passed from caller for the same reason.
 */
async function processVotesSync(roomId, votes, validSubmissions, currentRound, prompt) {
  if (!votes || Object.keys(votes).length === 0) {
    console.log(`⚠️ No votes to process for ${roomId}`);
    return;
  }

  const roomRef = db.collection('rooms').doc(roomId);

  // Build vote counts using the caller-provided validSubmissions (no extra RTDB read).
  // Using fresh data from the same snapshot that confirmed we're in voting phase
  // eliminates any chance of stale/concurrent data producing wrong vote counts.
  const voteCounts = {};
  Object.entries(votes).forEach(([voterId, votedFor]) => {
    if (voterId === votedFor) {
      console.log(`⚠️ BLOCKED self-vote from ${voterId}`);
      return;
    }
    // If validSubmissions is available, only count votes FROM players who submitted on time
    if (validSubmissions && !(voterId in validSubmissions)) {
      console.log(`⚠️ BLOCKED vote from ${voterId} - did not submit on time`);
      return;
    }
    // Only count votes FOR players who submitted on time
    if (validSubmissions && !(votedFor in validSubmissions)) {
      console.log(`⚠️ BLOCKED vote for ${votedFor} - not in validSubmissions`);
      return;
    }
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });

  // Find winner(s) from vote counts
  let maxVotes = 0;
  Object.values(voteCounts).forEach(count => { if (count > maxVotes) maxVotes = count; });
  const winners = Object.entries(voteCounts)
    .filter(([, count]) => count === maxVotes)
    .map(([userId]) => userId);

  console.log(`🗳️ Vote counts:`, voteCounts, '| Round winners:', winners, `(${maxVotes} votes each)`);

  // Winning phrases — validSubmissions stores plain strings
  const winningPhrases = winners.map(winnerId => {
    if (validSubmissions && validSubmissions[winnerId]) return validSubmissions[winnerId];
    return null;
  }).filter(p => p);

  // ATOMIC TRANSACTION: read-modify-write scores with idempotency key.
  // The transaction callback may be retried by Firestore on conflict, so we track
  // success with a flag that is reset at the START of each callback invocation
  // (not after) to avoid false-positive from a prior failed attempt.
  let transactionCommitted = false;
  let capturedRoomData = null;

  await db.runTransaction(async (transaction) => {
    // Reset flags at start of each invocation — Firestore may retry the callback
    transactionCommitted = false;

    const roomDoc = await transaction.get(roomRef);
    const room = roomDoc.data();

    // Capture room data for use after transaction (overwrites on each retry — final value is correct)
    capturedRoomData = { name: room?.name, players: room?.players || [], isSimulation: room?.isSimulation === true };

    // IDEMPOTENCY: if another concurrent call already processed this round, abort
    if (room?.lastProcessedRound === currentRound) {
      console.log(`⏸️ Round ${currentRound} already processed for ${roomId} — skipping duplicate`);
      return; // abort (no writes)
    }

    const scores = { ...(room?.scores || {}) };

    // Initialize score entry for any player receiving votes this round
    Object.keys(voteCounts).forEach(userId => {
      if (!scores[userId]) {
        scores[userId] = { totalVotes: 0, roundWins: 0, stars: 0, phrases: [] };
      }
    });

    // Add raw votes
    Object.entries(voteCounts).forEach(([userId, count]) => {
      scores[userId].totalVotes += count;
    });

    // Add +2 bonus for round winner(s) and increment stars if threshold met
    winners.forEach(winnerId => {
      if (scores[winnerId]) {
        scores[winnerId].roundWins += 1;
        scores[winnerId].totalVotes += 2;
        if (maxVotes >= STAR_THRESHOLD) {
          scores[winnerId].stars = (scores[winnerId].stars || 0) + 1;
        }
        console.log(`🏆 ${winnerId}: ${maxVotes} votes + 2 bonus = ${scores[winnerId].totalVotes} total${maxVotes >= STAR_THRESHOLD ? ' ⭐' : ''}`);
      }
    });

    // Atomic write: scores + idempotency key together
    transaction.update(roomRef, { scores, lastProcessedRound: currentRound });
    transactionCommitted = true;
  });

  if (!transactionCommitted) {
    console.log(`⏸️ processVotesSync: transaction aborted for round ${currentRound} (already processed by concurrent call)`);
    return null;
  }

  // Write starred phrases to dedicated Firestore collection for any round winner
  // who received STAR_THRESHOLD or more votes.
  // Simulation rooms are excluded — their phrases must not appear in the
  // public community gallery.
  if (maxVotes >= STAR_THRESHOLD && winners.length > 0 && !capturedRoomData?.isSimulation) {
    try {
      const usernameLookup = {};
      (capturedRoomData?.players || []).forEach(p => {
        if (p.userId) usernameLookup[p.userId] = p.username || '';
      });

      const starBatch = db.batch();
      winners.forEach(winnerId => {
        const phrase = validSubmissions?.[winnerId];
        if (!phrase) return;
        // The gallery is public — filter explicit content before it lands there.
        if (!isCleanForPublic(phrase)) {
          console.log(`🚫 Starred phrase failed content filter — not saved to gallery`);
          return;
        }
        const starRef = db.collection('starredPhrases').doc();
        starBatch.set(starRef, {
          userId: winnerId,
          username: usernameLookup[winnerId] || '',
          phrase,
          prompt: prompt || '',
          roomId,
          roomName: capturedRoomData?.name || '',
          voteCount: maxVotes,
          round: currentRound,
          earnedAt: admin.firestore.Timestamp.now(),
        });
      });
      await starBatch.commit();
      console.log(`⭐ Saved ${winners.length} starred phrase(s) for round ${currentRound} (${maxVotes} votes each)`);
    } catch (err) {
      console.error(`⚠️ Failed to save starred phrases for round ${currentRound}:`, err);
    }
  }

  if (winners.length > 1) {
    console.log(`✅ TIE! ${winners.length} winners with ${maxVotes} votes each`);
  } else {
    console.log(`✅ Votes processed: ${winners[0]} won with ${maxVotes} votes - "${winningPhrases[0]?.substring(0, 40)}..."`);
  }

  // Return winner data so the caller can combine it with the phase update in a
  // single RTDB write — eliminating the two-event gap where clients saw winner
  // data while still on the 'voting' phase.
  return {
    lastWinners: winners,
    lastWinner: winners[0] || null,
    lastWinningPhrases: winningPhrases,
    lastWinningPhrase: winningPhrases[0] || null,
    roundVoteCounts: voteCounts,
  };
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
    
    // Save match history for each player (ALWAYS — not just players with bestPhrase).
    // Simulation rooms are excluded — bot matches must not pollute user history.
    const batch = db.batch();
    const players = room?.isSimulation === true ? [] : (room?.players || []);
    let matchesQueued = 0;

    for (const player of players) {
      const userId = player.userId;
      const userScore = scores[userId] || { totalVotes: 0, roundWins: 0, stars: 0 };
      const bestPhrase = allSubmissions[userId] || '';
      const prompt = allPrompts[userId] || room?.currentPrompt || '';
      const stars = userScore.stars || 0;
      const won = userId === winnerId;

      const matchRef = db.collection('matches').doc(`${userId}_${roomId}_${Date.now()}`);
      batch.set(matchRef, {
        roomId: roomId,
        roomName: room.name || 'Unknown Room',
        userId: userId,
        username: player.username || 'Unknown',
        bestPhrase: bestPhrase,
        prompt: prompt,
        stars: stars,
        totalVotes: userScore.totalVotes || 0,
        roundWins: userScore.roundWins || 0,
        won: won,
        playerCount: players.length,
        isRanked: room.isRanked || false,
        rounds: room.currentRound || 1,
        playedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
      });
      matchesQueued++;
    }

    if (matchesQueued > 0) {
      await batch.commit();
      console.log(`💾 Saved ${matchesQueued} match history records for room ${roomId}`);
    } else {
      console.log(`⚠️ No match history records to save for room ${roomId}`);
    }
    
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
 * Get a random prompt that has NOT been used in this game session.
 *
 * usedPromptIds: string[] read from Firestore room.usedPromptIds.
 * Stored in Firestore (not in-memory) so ALL concurrent CF instances
 * see the same history and cannot repeat prompts across instances.
 */
let promptsCache = [];
let cacheTime = 0;

async function getRandomPrompt(usedPromptIds = []) {
  const now = Date.now();

  // Refresh prompt cache every 5 minutes
  if (promptsCache.length === 0 || (now - cacheTime) > 300000) {
    const snapshot = await db.collection('prompts')
      .where('status', '==', 'active')
      .limit(1000)
      .get();
    promptsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cacheTime = now;
    console.log(`📚 Loaded ${promptsCache.length} prompts into cache`);
  }

  const usedSet = new Set(usedPromptIds);
  const available = promptsCache.filter(p => !usedSet.has(p.id));

  if (available.length === 0) {
    // All prompts have been used — start over (very long game)
    console.log(`🔄 All ${promptsCache.length} prompts used — resetting and picking randomly`);
    return promptsCache[Math.floor(Math.random() * promptsCache.length)];
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  console.log(`✅ Selected prompt: "${selected.text?.substring(0, 40)}" (${usedSet.size + 1}/${promptsCache.length} used this game)`);

  // Increment timesUsed in Firestore (fire-and-forget, don't block game start)
  db.collection('prompts').doc(selected.id).update({
    timesUsed: admin.firestore.FieldValue.increment(1)
  }).catch(err => console.error(`⚠️ Failed to increment timesUsed for ${selected.id}:`, err));

  return selected;
}

/**
 * No-op kept for backwards compatibility — tracking is now in Firestore.
 */
function clearRoomPrompts(roomId) {
  console.log(`🧹 Prompt tracking for ${roomId} stored in Firestore (auto-cleared with room)`);
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
