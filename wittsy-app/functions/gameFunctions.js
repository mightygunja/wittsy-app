/**
 * Cloud Functions for Game Management
 * Simple, clean, no timer management
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const gameEngine = require('./gameEngine');

const rtdb = admin.database();

/**
 * Trigger when room status changes to 'active'
 */
exports.onGameStart = functions.firestore
  .document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const roomId = context.params.roomId;
    
    // Game starting
    if (before.status === 'waiting' && after.status === 'active') {
      await gameEngine.startGame(roomId);
    }
    
    return null;
  });

/**
 * Client calls this to advance phase
 * This is the primary mechanism - client knows when timer expires
 */
exports.advanceGamePhase = functions.https.onCall(async (data, context) => {
  const { roomId } = data;
  
  if (!roomId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID required');
  }
  
  await gameEngine.advancePhase(roomId);
  return { success: true };
});

/**
 * Backup: Scheduled function checks every 10 seconds
 * Only advances if client failed to do so
 */
exports.checkGamePhases = functions.pubsub
  .schedule('every 10 seconds')
  .onRun(async (context) => {
    const snapshot = await rtdb.ref('rooms').once('value');
    const rooms = snapshot.val() || {};
    
    const now = Date.now();
    const promises = [];
    
    Object.entries(rooms).forEach(([roomId, data]) => {
      if (!data.game || !data.game.phase) return;
      
      const game = data.game;
      const duration = gameEngine.getPhaseDuration(game.phase);
      const elapsed = (now - game.phaseStart) / 1000;
      
      // If phase should have ended but didn't, advance it
      if (elapsed > duration + 2) {
        console.log(`⚠️ Backup advancing ${roomId} from ${game.phase}`);
        promises.push(gameEngine.advancePhase(roomId));
      }
    });
    
    await Promise.all(promises);
    return null;
  });

module.exports = exports;
