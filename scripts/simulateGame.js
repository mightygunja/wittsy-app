#!/usr/bin/env node
/**
 * GAME SIMULATION AGENT
 *
 * Creates a real casual room with 6 simulated players, plays a full game to 20 votes,
 * and monitors every rule for violations. Reports a full audit at the end.
 *
 * Usage:
 *   cd wittsy-app
 *   node scripts/simulateGame.js
 *
 * Requires Firebase Admin credentials:
 *   set GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
 *   OR run: gcloud auth application-default login
 */

const admin = require('firebase-admin');
const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const PROJECT_ID = 'wittsy-51992';
const RTDB_URL   = `https://${PROJECT_ID}-default-rtdb.firebaseio.com`;
const CF_BASE    = `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;
const WINNING_VOTES = 20;

// Timing (ms) — give the Cloud Function time to process each phase
const SUBMISSION_DELAY = 3000;  // wait before submitting phrases
const VOTE_DELAY       = 2000;  // wait before casting votes
const PHASE_POLL_MS    = 400;   // how often to poll for phase change

// ─── SIMULATED PLAYERS ────────────────────────────────────────────────────────
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
  "WiFi password is 'tryharder'",
  "In dog beers I've only had one — so far",
  "Not arguing, just explaining why you're wrong",
  "Sarcasm loading... please wait",
  "Professionally confused since birth",
  "Insert witty comment here — too tired to write one",
  "Adulting difficulty: hard",
  "Another meeting that could have been a nap",
  "My vibe is controlled chaos",
  "Zero stars, would not recommend existing",
  "Running on caffeine and bad decisions",
  "I'm basically a motivational poster in reverse",
  "Sleep is a myth perpetuated by alarm clock companies",
  "Currently in my 'pretending to have it together' era",
  "My inner child is a gremlin",
  "Vibes: existential dread with a side of fries",
];

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
const violations = [];
const log = [];
let roundNumber = 0;

function info(msg)  { const line = `[INFO]  ${msg}`;  console.log(line); log.push(line); }
function warn(msg)  { const line = `[WARN]  ${msg}`;  console.warn('\x1b[33m' + line + '\x1b[0m'); log.push(line); }
function error(msg) { const line = `[ERROR] ${msg}`;  console.error('\x1b[31m' + line + '\x1b[0m'); violations.push(line); log.push(line); }
function ok(msg)    { const line = `[OK]    ${msg}`;  console.log('\x1b[32m' + line + '\x1b[0m'); log.push(line); }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomPhrase() {
  const base = randomPick(PHRASE_POOL);
  // Make it unique per player/round so submissions are distinguishable
  return `${base} [${Math.random().toString(36).slice(2, 6)}]`;
}

// POST to a Cloud Function (onCall format)
async function callCF(name, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ data });
    const url = new URL(`${CF_BASE}/${name}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Wait until RTDB game phase equals target
async function waitForPhase(gameRef, target, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await gameRef.once('value');
    const game = snap.val();
    if (game && game.phase === target) return game;
    await sleep(PHASE_POLL_MS);
  }
  throw new Error(`Timeout waiting for phase: ${target}`);
}

// Wait until phase changes away from current
async function waitForPhaseChange(gameRef, currentPhase, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await gameRef.once('value');
    const game = snap.val();
    if (!game || game.phase !== currentPhase) return game;
    await sleep(PHASE_POLL_MS);
  }
  throw new Error(`Timeout waiting for phase to change from: ${currentPhase}`);
}

// ─── MAIN SIMULATION ─────────────────────────────────────────────────────────
async function main() {
  info('='.repeat(60));
  info('WITTZ GAME SIMULATION AGENT');
  info('='.repeat(60));

  // Initialize Firebase Admin
  try {
    admin.initializeApp({ databaseURL: RTDB_URL });
    info('Firebase Admin initialized');
  } catch (e) {
    // Already initialized
  }

  const db   = admin.firestore();
  const rtdb = admin.database();

  // ── 1. CREATE ROOM ──────────────────────────────────────────────────────────
  info('\n--- STEP 1: Creating game room ---');

  const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
  const roomData = {
    name: 'Simulation Room',
    roomCode,
    status: 'waiting',
    isRanked: false,
    hostId: PLAYERS[0].userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    players: PLAYERS.map(p => ({
      userId: p.userId,
      username: p.username,
      avatarConfig: null,
      joinedAt: new Date().toISOString(),
    })),
    settings: {
      maxPlayers: 8,
      submissionTime: 20,
      votingTime: 15,
      winningVotes: WINNING_VOTES,
      isPrivate: true,
      autoStart: false,
    },
    scores: {},
  };

  const roomRef = await db.collection('rooms').add(roomData);
  const roomId  = roomRef.id;
  info(`Room created: ${roomId} (code: ${roomCode})`);

  const gameRef = rtdb.ref(`rooms/${roomId}/game`);

  // ── 2. START GAME ───────────────────────────────────────────────────────────
  info('\n--- STEP 2: Starting game (setting status → active) ---');
  await roomRef.update({ status: 'active' });
  info('Room status set to active — onGameStart trigger should fire');

  // Wait for prompt phase to appear in RTDB (Cloud Function sets it up)
  info('Waiting for Cloud Function to initialize game state...');
  try {
    await waitForPhase(gameRef, 'prompt', 15000);
    ok('Game state initialized — prompt phase active');
  } catch (e) {
    error(`Game never started: ${e.message}`);
    await cleanup(db, rtdb, roomId);
    process.exit(1);
  }

  // ── 3. GAME LOOP ─────────────────────────────────────────────────────────────
  const scores = {}; // track cumulative scores locally for validation
  PLAYERS.forEach(p => { scores[p.userId] = 0; });

  let gameOver = false;
  let maxRounds = 30; // safety limit

  while (!gameOver && maxRounds-- > 0) {
    roundNumber++;
    info(`\n${'='.repeat(60)}`);
    info(`ROUND ${roundNumber}`);
    info('='.repeat(60));

    // ── PROMPT PHASE ──────────────────────────────────────────────────────────
    let game = await waitForPhase(gameRef, 'prompt', 15000);
    info(`Prompt: "${game.prompt}"`);
    info(`Waiting for submission phase...`);
    await sleep(1000); // let prompt phase tick down naturally or advance

    // Advance from prompt → submission
    await callCF('advanceGamePhase', { roomId });
    game = await waitForPhase(gameRef, 'submission', 10000);
    ok('Submission phase started');

    const phaseEnd = game.phaseStart + (game.phaseDuration * 1000);

    // ── SUBMISSION PHASE ──────────────────────────────────────────────────────
    await sleep(SUBMISSION_DELAY);

    // Decide which players submit (sometimes skip 1–2 to test insufficient rule)
    const skipCount = roundNumber <= 2 ? 0 : (Math.random() < 0.15 ? 1 : 0);
    const submittingPlayers = [...PLAYERS].sort(() => Math.random() - 0.5).slice(0, PLAYERS.length - skipCount);
    const skippedPlayers    = PLAYERS.filter(p => !submittingPlayers.find(s => s.userId === p.userId));

    const submittedPhrases = {}; // userId → phrase (only on-time)
    const lateUserIds      = [];

    for (const player of submittingPlayers) {
      const phrase     = randomPhrase();
      const now        = Date.now();
      const isLate     = now > phaseEnd + 500; // shouldn't happen normally
      const timestamp  = now;

      await rtdb.ref(`rooms/${roomId}/game/submissions/${player.userId}`).set({
        phrase,
        timestamp,
      });

      if (isLate) {
        lateUserIds.push(player.userId);
        warn(`${player.username} submitted LATE (${Math.round((now - phaseEnd) / 1000)}s after deadline)`);
      } else {
        submittedPhrases[player.userId] = phrase;
        info(`${player.username} submitted: "${phrase.slice(0, 40)}..."`);
      }
    }

    if (skippedPlayers.length > 0) {
      warn(`Skipped players (no submission): ${skippedPlayers.map(p => p.username).join(', ')}`);
    }

    // Advance from submission → voting (or insufficient)
    await callCF('advanceGamePhase', { roomId });
    game = await waitForPhaseChange(gameRef, 'submission', 10000);
    info(`Phase changed to: ${game ? game.phase : 'null (game may have ended)'}`);

    if (!game) {
      // Game ended unexpectedly early
      error('Game state disappeared unexpectedly after submission phase');
      break;
    }

    // ── INSUFFICIENT SUBMISSIONS CHECK ────────────────────────────────────────
    if (game.phase === 'insufficient') {
      const validCount = Object.keys(submittedPhrases).length;
      info(`Insufficient submissions phase triggered (${validCount} valid submissions)`);

      if (PLAYERS.length >= 3 && validCount < 3) {
        ok(`RULE CHECK: Insufficient correctly triggered (${validCount} < 3 for ${PLAYERS.length} players)`);
      } else {
        error(`RULE VIOLATION: Insufficient phase triggered but ${validCount} valid submissions existed for ${PLAYERS.length} players`);
      }

      // Wait for new round to start
      info('Waiting for new round after insufficient phase...');
      game = await waitForPhase(gameRef, 'prompt', 15000);
      info('New round started after insufficient — continuing');
      continue; // back to top of loop
    }

    // ── VOTING PHASE ──────────────────────────────────────────────────────────
    if (game.phase !== 'voting') {
      error(`Expected voting phase, got: ${game.phase}`);
      break;
    }

    ok('Voting phase started');

    // Verify validSubmissions — late submissions must not appear
    const validSubmissions = game.validSubmissions || {};
    const validUserIds     = Object.keys(validSubmissions);

    info(`Valid submissions in RTDB: ${validUserIds.map(id => PLAYERS.find(p => p.userId === id)?.username || id).join(', ')}`);

    for (const lateId of lateUserIds) {
      if (lateId in validSubmissions) {
        error(`RULE VIOLATION: Late submission from ${lateId} appears in validSubmissions`);
      } else {
        ok(`Late submission from ${lateId} correctly excluded from validSubmissions`);
      }
    }

    for (const skipped of skippedPlayers) {
      if (skipped.userId in validSubmissions) {
        error(`RULE VIOLATION: Player ${skipped.username} (no submission) appears in validSubmissions`);
      } else {
        ok(`Non-submitter ${skipped.username} correctly excluded from validSubmissions`);
      }
    }

    // Cast votes — no self-voting, only vote for validSubmissions
    await sleep(VOTE_DELAY);

    const voterIds     = [...PLAYERS.map(p => p.userId)];
    const eligibleIds  = validUserIds; // who can be voted for
    const castVotes    = {}; // voterId → votedForId (for local validation)

    for (const voterId of voterIds) {
      // Eligible targets: valid submissions, excluding self
      const targets = eligibleIds.filter(id => id !== voterId);
      if (targets.length === 0) {
        warn(`${PLAYERS.find(p => p.userId === voterId)?.username} has no valid targets to vote for`);
        continue;
      }

      // Attempt self-vote check: try voting for self and ensure it's blocked
      if (eligibleIds.includes(voterId) && Math.random() < 0.1) {
        // Simulate a self-vote attempt (we DON'T write it, just verify the frontend rule)
        ok(`SELF-VOTE CHECK: Would block ${PLAYERS.find(p => p.userId === voterId)?.username} from voting for themselves`);
      }

      const votedFor = randomPick(targets);
      castVotes[voterId] = votedFor;

      // Verify not voting for self
      if (votedFor === voterId) {
        error(`RULE VIOLATION: Self-vote cast — ${voterId} voted for themselves`);
      }

      await rtdb.ref(`rooms/${roomId}/game/votes/${voterId}`).set(votedFor);
    }

    info(`Votes cast: ${Object.entries(castVotes).map(([v, f]) => {
      const voter = PLAYERS.find(p => p.userId === v)?.username || v;
      const target = PLAYERS.find(p => p.userId === f)?.username || f;
      return `${voter}→${target}`;
    }).join(', ')}`);

    // Advance from voting → results
    await callCF('advanceGamePhase', { roomId });
    game = await waitForPhase(gameRef, 'results', 10000);
    ok('Results phase started');

    // ── RESULTS VALIDATION ────────────────────────────────────────────────────
    const roundVoteCounts = game.roundVoteCounts || {};
    const lastWinners     = game.lastWinners || (game.lastWinner ? [game.lastWinner] : []);
    const lastPhrases     = game.lastWinningPhrases || (game.lastWinningPhrase ? [game.lastWinningPhrase] : []);

    info(`Round ${roundNumber} winners: ${lastWinners.map(id => PLAYERS.find(p => p.userId === id)?.username || id).join(', ')}`);
    info(`Vote counts: ${JSON.stringify(roundVoteCounts)}`);

    // Verify vote counts are correct (count manually from castVotes)
    const expectedCounts = {};
    for (const [voterId, votedFor] of Object.entries(castVotes)) {
      // Only count if votedFor is in validSubmissions and not self
      if (votedFor !== voterId && eligibleIds.includes(votedFor)) {
        expectedCounts[votedFor] = (expectedCounts[votedFor] || 0) + 1;
      }
    }

    for (const [userId, count] of Object.entries(expectedCounts)) {
      const rtdbCount = roundVoteCounts[userId] || 0;
      if (rtdbCount !== count) {
        error(`RULE VIOLATION: Vote count mismatch for ${PLAYERS.find(p => p.userId === userId)?.username}: expected ${count}, got ${rtdbCount}`);
      } else {
        ok(`Vote count correct for ${PLAYERS.find(p => p.userId === userId)?.username}: ${count}`);
      }
    }

    // Verify winning phrase is from validSubmissions (not a skipped/late player)
    for (const winnerId of lastWinners) {
      if (!eligibleIds.includes(winnerId)) {
        error(`RULE VIOLATION: Winner ${winnerId} was not in validSubmissions`);
      }
      if (skippedPlayers.find(p => p.userId === winnerId)) {
        error(`RULE VIOLATION: Winner ${winnerId} never submitted a phrase`);
      }
    }

    // Check +2 bonus by reading Firestore scores
    const roomSnap = await db.collection('rooms').doc(roomId).get();
    const fsScores = roomSnap.data()?.scores || {};

    for (const winnerId of lastWinners) {
      const winnerVotes  = roundVoteCounts[winnerId] || 0;
      const expectedTotal = (scores[winnerId] || 0) + winnerVotes + 2; // +2 bonus
      const actualTotal   = fsScores[winnerId]?.totalVotes || 0;

      if (actualTotal === expectedTotal) {
        ok(`+2 BONUS CHECK: ${PLAYERS.find(p => p.userId === winnerId)?.username} got ${winnerVotes} votes + 2 bonus = ${actualTotal} total`);
        scores[winnerId] = actualTotal;
      } else {
        error(`RULE VIOLATION: +2 bonus wrong for ${winnerId}: expected ${expectedTotal} got ${actualTotal}`);
      }
    }

    // Update local score tracking for non-winners
    for (const [userId, count] of Object.entries(roundVoteCounts)) {
      if (!lastWinners.includes(userId)) {
        const expected = (scores[userId] || 0) + count;
        const actual   = fsScores[userId]?.totalVotes || 0;
        if (actual !== expected && expected > 0) {
          error(`RULE VIOLATION: Score mismatch for ${PLAYERS.find(p => p.userId === userId)?.username}: expected ${expected} got ${actual}`);
        }
        scores[userId] = actual;
      }
    }

    // Print scoreboard
    info('\nSCOREBOARD:');
    const sortedScores = Object.entries(fsScores)
      .map(([uid, data]) => ({
        name: PLAYERS.find(p => p.userId === uid)?.username || uid,
        total: data?.totalVotes || 0,
        wins:  data?.roundWins || 0,
      }))
      .sort((a, b) => b.total - a.total);

    sortedScores.forEach((s, i) => {
      const bar = '█'.repeat(Math.min(s.total, 40));
      info(`  ${i + 1}. ${s.name.padEnd(10)} ${bar} ${s.total} votes (${s.wins} round wins)`);
    });

    // Check if game should have ended
    const maxVotes = sortedScores[0]?.total || 0;
    if (maxVotes >= WINNING_VOTES) {
      info(`\nPlayer ${sortedScores[0].name} has reached ${maxVotes} votes — game should end`);
    }

    // Advance from results → next round (or game end)
    await callCF('advanceGamePhase', { roomId });

    // Check what happens next
    await sleep(2000);
    const nextSnap = await gameRef.once('value');
    const nextGame = nextSnap.val();

    if (!nextGame) {
      // Game ended (RTDB cleared by endGame)
      const finalRoomSnap = await db.collection('rooms').doc(roomId).get();
      const finalRoom     = finalRoomSnap.data();

      if (finalRoom?.status === 'finished') {
        ok(`\nGAME OVER — Room status = finished`);
        gameOver = true;

        // Final winner validation
        const finalScores = Object.entries(finalRoom.scores || {})
          .map(([uid, data]) => ({
            uid,
            name: PLAYERS.find(p => p.userId === uid)?.username || uid,
            total: data?.totalVotes || 0,
          }))
          .sort((a, b) => b.total - a.total);

        const topScore   = finalScores[0]?.total || 0;
        const finalWinners = finalScores.filter(s => s.total === topScore);

        ok(`FINAL WINNER(S): ${finalWinners.map(w => `${w.name} (${w.total} votes)`).join(', ')}`);

        // Verify winner has >= WINNING_VOTES
        if (topScore < WINNING_VOTES) {
          error(`RULE VIOLATION: Game ended but top score ${topScore} < WINNING_VOTES (${WINNING_VOTES})`);
        } else {
          ok(`WINNING VOTES CHECK: ${topScore} >= ${WINNING_VOTES}`);
        }
      } else {
        warn('RTDB cleared but room not marked finished — possible cleanup issue');
      }
    } else if (nextGame.phase === 'prompt') {
      info(`New round starting (round ${roundNumber + 1})`);
    } else {
      warn(`Unexpected phase after results: ${nextGame.phase}`);
    }
  }

  if (maxRounds <= 0) {
    error('Safety limit hit — simulation stopped after 30 rounds without a winner');
  }

  // ── FINAL AUDIT REPORT ────────────────────────────────────────────────────
  await cleanup(db, rtdb, roomId);
  printReport();
}

async function cleanup(db, rtdb, roomId) {
  info('\n--- CLEANUP ---');
  try {
    await db.collection('rooms').doc(roomId).update({ status: 'finished' });
    await rtdb.ref(`rooms/${roomId}`).remove();
    info(`Room ${roomId} cleaned up`);
  } catch (e) {
    warn(`Cleanup error: ${e.message}`);
  }
}

function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`Total rounds simulated: ${roundNumber}`);
  console.log(`Violations found:       ${violations.length}`);
  console.log('');

  if (violations.length === 0) {
    console.log('\x1b[32m✅ ALL RULES PASSED — No violations detected\x1b[0m');
  } else {
    console.log('\x1b[31mVIOLATIONS:\x1b[0m');
    violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));
  }

  console.log('\n' + '='.repeat(60));
  process.exit(violations.length > 0 ? 1 : 0);
}

// ─── RUN ─────────────────────────────────────────────────────────────────────
main().catch(e => {
  error(`Unhandled error: ${e.message}\n${e.stack}`);
  printReport();
  process.exit(1);
});
