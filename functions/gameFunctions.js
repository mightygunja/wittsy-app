/**
 * Cloud Functions for Game Management
 * Simple, clean, no timer management
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const https     = require('https');
const gameEngine = require('./gameEngine');

// ── PUSH NOTIFICATION HELPERS ────────────────────────────────────────────────

/**
 * POST a batch of messages to Expo's Push API.
 * Expo accepts up to 100 messages per request.
 */
function sendExpoPushNotifications(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(messages);
    const options = {
      hostname: 'exp.host',
      path:     '/--/api/v2/push/send',
      method:   'POST',
      headers: {
        'Content-Type':     'application/json',
        'Content-Length':   Buffer.byteLength(body),
        'Accept':           'application/json',
        'Accept-Encoding':  'gzip, deflate',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (_) { resolve(data); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Look up each player's Expo push token from Firestore and send them
 * a push notification. Players without a token are silently skipped.
 *
 * @param {Array<{userId: string}>} players  - room.players array
 * @param {string} title
 * @param {string} body
 * @param {object} data  - arbitrary payload delivered to the app on tap
 */
async function notifyRoomPlayers(players, title, body, data = {}) {
  if (!players || players.length === 0) return;

  const db      = admin.firestore();
  const userIds = players.map(p => p.userId).filter(Boolean);

  const userDocs = await Promise.all(
    userIds.map(uid => db.collection('users').doc(uid).get())
  );

  const messages = [];
  for (const userDoc of userDocs) {
    const token = userDoc.data()?.expoPushToken;
    if (token && token.startsWith('ExponentPushToken[')) {
      messages.push({ to: token, sound: 'default', title, body, data });
    }
  }

  if (messages.length === 0) {
    console.log('notifyRoomPlayers: no valid Expo push tokens found');
    return;
  }

  console.log(`Sending ${messages.length} push notification(s): "${title}"`);
  const result = await sendExpoPushNotifications(messages);
  console.log('Expo push result:', JSON.stringify(result));
}

// ── ROOM TRIGGER ─────────────────────────────────────────────────────────────

/**
 * Fires on every room document update. Handles:
 *
 *  1. Player count 2 → 3  (status still 'waiting')
 *     → "Game About to Start!" push to all players
 *
 *  2. status 'waiting' → 'active'
 *     → Start the game engine
 *     → "Game Started!" push to all players
 */
exports.onGameStart = functions.firestore
  .document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const before  = change.before.data();
    const after   = change.after.data();
    const roomId  = context.params.roomId;
    const players = after.players || [];

    // ── Notification 1: 3rd player just joined ──────────────────────────────
    const beforeCount = (before.players || []).length;
    const afterCount  = players.length;

    if (after.status === 'waiting' && beforeCount < 3 && afterCount >= 3) {
      console.log(`Room ${roomId}: player count reached ${afterCount} — sending "about to start" notification`);
      await notifyRoomPlayers(
        players,
        'Game About to Start! 🎮',
        `Your Wittz room now has ${afterCount} players. Get ready!`,
        { type: 'room_ready', roomId }
      ).catch(err => console.error('Failed to send "about to start" notifications:', err));
    }

    // ── Notification 2: game started ─────────────────────────────────────────
    if (before.status === 'waiting' && after.status === 'active') {
      await gameEngine.startGame(roomId);

      console.log(`Room ${roomId}: game started — sending "game started" notification`);
      await notifyRoomPlayers(
        players,
        'Game Started! 🚀',
        'Your Wittz game has started. Submit your wittiest response!',
        { type: 'game_started', roomId }
      ).catch(err => console.error('Failed to send "game started" notifications:', err));
    }

    return null;
  });

// ── PHASE ADVANCE (client-initiated) ─────────────────────────────────────────

/**
 * Client calls this to advance phase when its timer hits 0.
 * This is the only mechanism — no server-side backup timers.
 */
exports.advanceGamePhase = functions.https.onCall(async (data, context) => {
  const { roomId } = data;

  if (!roomId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID required');
  }

  await gameEngine.advancePhase(roomId);
  return { success: true };
});

module.exports = exports;
