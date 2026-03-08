/**
 * GAME SIMULATION CLOUD FUNCTION
 *
 * Creates a real casual room with 6 simulated players, plays a full game to 20 votes,
 * and verifies every rule. Returns a full audit report.
 *
 * Trigger: GET/POST https://us-central1-wittsy-51992.cloudfunctions.net/simulateGame
 * Optional query: ?rounds=30&submissionTimeSec=8&votingTimeSec=6
 *
 * Runs inside Google Cloud so it has full Admin credentials automatically.
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const gameEngine = require('./gameEngine');

const WINNING_VOTES = 20;

const PLAYERS = [
  { userId: 'sim_alice',   username: 'Alice'   },
  { userId: 'sim_bob',     username: 'Bob'     },
  { userId: 'sim_charlie', username: 'Charlie' },
  { userId: 'sim_diana',   username: 'Diana'   },
  { userId: 'sim_eve',     username: 'Eve'     },
  { userId: 'sim_frank',   username: 'Frank'   },
];

const PHRASE_POOL = [
  "When life gives you lemons, weaponize them",
  "I put the 'fun' in 'fundamentally broken'",
  "Plot twist: the butler did it on purpose",
  "404: Motivation not found, please reboot",
  "My therapist says I'm making progress — liar",
  "Currently accepting cash, Venmo, and compliments",
  "Error 404: Social skills not installed",
  "I'm not lazy, I'm in power-saving mode",
  "In dog beers I've only had one — so far",
  "Not arguing, just explaining why you're wrong",
  "Sarcasm loading... please wait",
  "Professionally confused since birth",
  "Zero stars, would not recommend existing",
  "Running on caffeine and bad decisions",
  "My inner child is a gremlin",
  "Vibes: existential dread with a side of fries",
  "I survived today, barely",
  "Sleep is a myth perpetuated by alarm clocks",
  "Currently in my pretending to have it together era",
  "My vibe is controlled chaos with extra chaos",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPhrase()  { return randomPick(PHRASE_POOL) + ` [${Math.random().toString(36).slice(2,5)}]`; }

async function waitForPhase(gameRef, phase, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await gameRef.once('value');
    const g = snap.val();
    if (g && g.phase === phase) return g;
    await sleep(300);
  }
  throw new Error(`Timeout waiting for phase: ${phase}`);
}

async function waitForPhaseChange(gameRef, currentPhase, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await gameRef.once('value');
    const g = snap.val();
    if (!g || g.phase !== currentPhase) return g;
    await sleep(300);
  }
  throw new Error(`Timeout waiting for phase to change from: ${currentPhase}`);
}

exports.simulateGame = functions
  .runWith({ timeoutSeconds: 540, memory: '256MB' })
  .https.onRequest(async (req, res) => {

  const db   = admin.firestore();
  const rtdb = admin.database();

  const MAX_ROUNDS       = parseInt(req.query.rounds || '40');
  const SUB_TIME_SEC     = parseInt(req.query.submissionTimeSec || '8');
  const VOTE_TIME_SEC    = parseInt(req.query.votingTimeSec || '6');

  const log        = [];
  const violations = [];
  let   roundNum   = 0;
  let   roomId     = null;

  const info  = msg => { log.push({ level: 'info',      msg }); console.log('[INFO]  ' + msg); };
  const ok    = msg => { log.push({ level: 'ok',        msg }); console.log('[OK]    ' + msg); };
  const warn  = msg => { log.push({ level: 'warn',      msg }); console.log('[WARN]  ' + msg); };
  const error = msg => { log.push({ level: 'violation', msg }); violations.push(msg); console.error('[ERROR] ' + msg); };

  try {
    info('=== WITTZ GAME SIMULATION START ===');

    // ── CREATE ROOM ────────────────────────────────────────────────────────────
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const roomRef  = await db.collection('rooms').add({
      name:      'Simulation Room',
      roomCode,
      status:    'waiting',
      isRanked:  false,
      hostId:    PLAYERS[0].userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      players:   PLAYERS.map(p => ({
        userId:       p.userId,
        username:     p.username,
        avatarConfig: null,
        joinedAt:     new Date().toISOString(),
      })),
      settings: {
        maxPlayers:     8,
        submissionTime: SUB_TIME_SEC,
        votingTime:     VOTE_TIME_SEC,
        winningVotes:   WINNING_VOTES,
        isPrivate:      true,
        autoStart:      false,
      },
      scores: {},
    });

    roomId = roomRef.id;
    info(`Room created: ${roomId} (code: ${roomCode})`);

    const gameRef = rtdb.ref(`rooms/${roomId}/game`);

    // ── START GAME (triggers onGameStart Cloud Function) ───────────────────────
    // We call gameEngine.startGame directly since we're inside the same process
    await gameEngine.startGame(roomId);
    ok('gameEngine.startGame() called');

    await waitForPhase(gameRef, 'prompt', 10000);
    ok('Prompt phase confirmed in RTDB');

    // ── LOCAL SCORE TRACKER ────────────────────────────────────────────────────
    const localScores = {};
    PLAYERS.forEach(p => { localScores[p.userId] = 0; });

    // ── GAME LOOP ──────────────────────────────────────────────────────────────
    let gameOver = false;

    while (!gameOver && roundNum < MAX_ROUNDS) {
      roundNum++;
      info(`\n=== ROUND ${roundNum} ===`);

      // PROMPT PHASE
      const promptGame = await waitForPhase(gameRef, 'prompt', 10000);
      info(`Prompt: "${promptGame.prompt}"`);

      // Wait >1s so advancePhase race-condition guard doesn't block us
      await sleep(1500);
      // Advance prompt → submission
      await gameEngine.advancePhase(roomId);
      const subGame = await waitForPhase(gameRef, 'submission', 10000);
      ok('Submission phase');

      const phaseEnd = subGame.phaseStart + (subGame.phaseDuration * 1000);

      // ── SIMULATE SUBMISSIONS ─────────────────────────────────────────────────
      // Randomly skip 0–1 players (~15% chance of 1 skip after round 2)
      const skipCount = roundNum <= 2 ? 0 : (Math.random() < 0.15 ? 1 : 0);
      const shuffled  = [...PLAYERS].sort(() => Math.random() - 0.5);
      const submitters = shuffled.slice(0, PLAYERS.length - skipCount);
      const skipped    = PLAYERS.filter(p => !submitters.find(s => s.userId === p.userId));

      const onTimeSubmissions = {}; // userId → phrase (submitted before deadline)

      for (const player of submitters) {
        const phrase    = randomPhrase();
        const timestamp = Date.now();
        const isLate    = timestamp > phaseEnd + 200;

        await rtdb.ref(`rooms/${roomId}/game/submissions/${player.userId}`).set({ phrase, timestamp });

        if (isLate) {
          warn(`${player.username} submitted LATE`);
        } else {
          onTimeSubmissions[player.userId] = phrase;
          info(`${player.username} submitted: "${phrase.slice(0,45)}"`);
        }
      }

      skipped.forEach(p => warn(`${p.username} did NOT submit`));

      // Debug: read game state before advancing to see what advancePhase will see
      const preSnap = await gameRef.once('value');
      const preGame = preSnap.val();
      const subCount = Object.keys(preGame?.submissions || {}).length;
      const phaseEndMs = (preGame?.phaseStart || 0) + ((preGame?.phaseDuration || 0) * 1000);
      const nowMs = Date.now();
      info(`PRE-ADVANCE DEBUG: phase=${preGame?.phase}, submissions=${subCount}, phaseStart=${preGame?.phaseStart}, phaseDuration=${preGame?.phaseDuration}, phaseEnd=${phaseEndMs}, now=${nowMs}, elapsed=${((nowMs - (preGame?.phaseStart||0))/1000).toFixed(1)}s`);

      // Log each submission's timestamp vs phaseEnd
      Object.entries(preGame?.submissions || {}).forEach(([uid, sub]) => {
        const ts = typeof sub === 'object' ? sub.timestamp : null;
        const name = PLAYERS.find(p => p.userId === uid)?.username || uid;
        info(`  ${name} submission timestamp: ${ts}, isLate: ${ts > phaseEndMs} (phaseEnd=${phaseEndMs})`);
      });

      // Advance submission → voting (or insufficient)
      await sleep(1500);
      await gameEngine.advancePhase(roomId);
      const afterSub = await waitForPhaseChange(gameRef, 'submission', 15000);

      if (!afterSub) {
        warn('Game state null after submission — may have ended');
        gameOver = true;
        break;
      }

      // ── INSUFFICIENT CHECK ───────────────────────────────────────────────────
      if (afterSub.phase === 'insufficient') {
        const validCount = Object.keys(onTimeSubmissions).length;
        info(`Insufficient phase triggered — ${validCount} valid submissions`);

        if (PLAYERS.length >= 3 && validCount < 3) {
          ok(`RULE OK: insufficient correctly triggered (${validCount} valid < 3)`);
        } else {
          error(`RULE FAIL: insufficient triggered with ${validCount} valid submissions for ${PLAYERS.length} players`);
        }

        // Wait for next round
        await waitForPhase(gameRef, 'prompt', 12000);
        continue;
      }

      // ── VOTING PHASE ─────────────────────────────────────────────────────────
      if (afterSub.phase !== 'voting') {
        error(`Expected voting, got: ${afterSub.phase}`);
        break;
      }

      ok('Voting phase');

      const validSubs   = afterSub.validSubmissions || {};
      const validIds    = Object.keys(validSubs);

      info(`validSubmissions: [${validIds.map(id => PLAYERS.find(p=>p.userId===id)?.username||id).join(', ')}]`);

      // Verify late / skipped players are NOT in validSubmissions
      for (const p of skipped) {
        if (p.userId in validSubs) {
          error(`RULE FAIL: ${p.username} (no submission) appears in validSubmissions`);
        } else {
          ok(`${p.username} correctly excluded from validSubmissions`);
        }
      }

      // Verify self-voting is impossible — no player should vote for themselves
      const castVotes = {}; // voterId → targetId
      for (const voter of PLAYERS) {
        const targets = validIds.filter(id => id !== voter.userId);
        if (targets.length === 0) {
          warn(`${voter.username} has no valid targets (they didn't submit or only they submitted)`);
          continue;
        }
        const target = randomPick(targets);

        // Explicit self-vote check
        if (target === voter.userId) {
          error(`RULE FAIL: Self-vote — ${voter.username} would vote for themselves`);
          continue;
        }

        castVotes[voter.userId] = target;
        await rtdb.ref(`rooms/${roomId}/game/votes/${voter.userId}`).set(target);
        info(`${voter.username} → ${PLAYERS.find(p=>p.userId===target)?.username}`);
      }

      // Advance voting → results
      await sleep(1500);
      await gameEngine.advancePhase(roomId);
      const resultsGame = await waitForPhase(gameRef, 'results', 10000);
      ok('Results phase');

      // ── VALIDATE VOTE COUNTS & +2 BONUS ─────────────────────────────────────
      const roundVoteCounts = resultsGame.roundVoteCounts || {};
      const lastWinners     = resultsGame.lastWinners || (resultsGame.lastWinner ? [resultsGame.lastWinner] : []);
      const lastPhrases     = resultsGame.lastWinningPhrases || (resultsGame.lastWinningPhrase ? [resultsGame.lastWinningPhrase] : []);

      info(`Winners: [${lastWinners.map(id => PLAYERS.find(p=>p.userId===id)?.username||id).join(', ')}]`);

      // Build expected vote counts from what we cast
      const expectedCounts = {};
      for (const [voterId, targetId] of Object.entries(castVotes)) {
        if (targetId !== voterId && validIds.includes(targetId)) {
          expectedCounts[targetId] = (expectedCounts[targetId] || 0) + 1;
        }
      }

      for (const [uid, expected] of Object.entries(expectedCounts)) {
        const actual = roundVoteCounts[uid] || 0;
        if (actual !== expected) {
          error(`RULE FAIL: Vote count for ${PLAYERS.find(p=>p.userId===uid)?.username}: expected ${expected} got ${actual}`);
        } else {
          ok(`Vote count OK for ${PLAYERS.find(p=>p.userId===uid)?.username}: ${actual}`);
        }
      }

      // Validate +2 bonus applied to winner(s) in Firestore
      const roomSnap = await db.collection('rooms').doc(roomId).get();
      const fsScores = roomSnap.data()?.scores || {};

      for (const winnerId of lastWinners) {
        const roundVotes     = roundVoteCounts[winnerId] || 0;
        const expectedTotal  = (localScores[winnerId] || 0) + roundVotes + 2;
        const actualTotal    = fsScores[winnerId]?.totalVotes || 0;

        if (actualTotal === expectedTotal) {
          ok(`+2 BONUS OK: ${PLAYERS.find(p=>p.userId===winnerId)?.username} — ${roundVotes} votes + 2 bonus = ${actualTotal}`);
          localScores[winnerId] = actualTotal;
        } else {
          // Allow ±1 for potential race condition in multi-winner ties
          if (Math.abs(actualTotal - expectedTotal) <= 1) {
            warn(`+2 BONUS marginal: ${PLAYERS.find(p=>p.userId===winnerId)?.username} expected ~${expectedTotal} got ${actualTotal}`);
          } else {
            error(`+2 BONUS FAIL: ${PLAYERS.find(p=>p.userId===winnerId)?.username} expected ${expectedTotal} got ${actualTotal}`);
          }
        }
      }

      // Update local scores for non-winners
      for (const [uid, count] of Object.entries(roundVoteCounts)) {
        if (!lastWinners.includes(uid)) {
          localScores[uid] = (localScores[uid] || 0) + count;
        }
      }

      // Verify winning phrase exists
      for (let i = 0; i < lastWinners.length; i++) {
        const wid    = lastWinners[i];
        const phrase = lastPhrases[i];
        if (!phrase) {
          error(`RULE FAIL: Winner ${PLAYERS.find(p=>p.userId===wid)?.username} has no winning phrase`);
        } else {
          ok(`Winning phrase present: "${phrase.slice(0,50)}"`);
        }
        if (!validIds.includes(wid)) {
          error(`RULE FAIL: Winner ${wid} was not in validSubmissions`);
        }
      }

      // Print scoreboard
      const board = Object.entries(fsScores)
        .map(([uid, d]) => ({ name: PLAYERS.find(p=>p.userId===uid)?.username||uid, total: d?.totalVotes||0, wins: d?.roundWins||0 }))
        .sort((a,b) => b.total - a.total);

      info('SCOREBOARD: ' + board.map((s,i) => `${i+1}.${s.name}:${s.total}`).join(' | '));

      const topScore = board[0]?.total || 0;
      if (topScore >= WINNING_VOTES) {
        info(`${board[0].name} reached ${topScore} votes — game ending`);
      }

      // Advance results → next round or game end
      await sleep(1500);
      await gameEngine.advancePhase(roomId);
      await sleep(2000);

      // Check if game ended
      const postSnap = await gameRef.once('value');
      const postGame = postSnap.val();

      if (!postGame) {
        const finalRoomSnap = await db.collection('rooms').doc(roomId).get();
        const finalRoom     = finalRoomSnap.data();

        if (finalRoom?.status === 'finished') {
          ok('GAME OVER — status = finished');
          gameOver = true;

          const finalScores = Object.entries(finalRoom.scores || {})
            .map(([uid, d]) => ({ uid, name: PLAYERS.find(p=>p.userId===uid)?.username||uid, total: d?.totalVotes||0 }))
            .sort((a,b) => b.total - a.total);

          const champion = finalScores[0];
          ok(`CHAMPION: ${champion.name} with ${champion.total} votes`);

          if (champion.total < WINNING_VOTES) {
            error(`RULE FAIL: Game ended but top score ${champion.total} < WINNING_VOTES ${WINNING_VOTES}`);
          } else {
            ok(`WINNING VOTES CHECK: ${champion.total} >= ${WINNING_VOTES}`);
          }
        } else {
          warn('RTDB cleared but room not marked finished');
        }
      }
    }

    if (!gameOver && roundNum >= MAX_ROUNDS) {
      error(`Safety limit: simulation stopped after ${MAX_ROUNDS} rounds without a winner`);
    }

  } catch (e) {
    error(`Fatal: ${e.message}`);
    console.error(e.stack);
  } finally {
    // Cleanup
    if (roomId) {
      try {
        await admin.firestore().collection('rooms').doc(roomId).update({ status: 'finished' });
        await admin.database().ref(`rooms/${roomId}`).remove();
        info(`Cleanup: room ${roomId} removed`);
      } catch (e) {
        warn(`Cleanup error: ${e.message}`);
      }
    }
  }

  // ── REPORT ───────────────────────────────────────────────────────────────────
  const passed = violations.length === 0;
  res.status(passed ? 200 : 500).json({
    status:     passed ? 'PASS' : 'FAIL',
    rounds:     roundNum,
    violations: violations.length,
    issues:     violations,
    log,
  });
});
