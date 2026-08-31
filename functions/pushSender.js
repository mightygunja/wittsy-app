/**
 * Push notification delivery.
 *
 * The app writes in-app notification docs to `notifications/` (friend
 * requests, game invites, challenge/event updates). This trigger delivers
 * each one as an Expo push to the recipient's device, gated on the
 * preferences the client mirrors to users/{uid}.notificationPrefs.
 *
 * Tokens are saved by the client on sign-in (users/{uid}.pushToken); tokens
 * Expo reports as dead are cleared so we stop sending to them.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

// Map notification doc `type` values to preference keys (default: allow).
const TYPE_TO_PREF = {
  friend_request: 'friendRequests',
  friend_accepted: 'friendRequests',
  game_invite: 'gameInvites',
  challenge_completed: 'challengeUpdates',
  achievement: 'achievementUnlocked',
  event_registered: 'eventReminders',
  event_starting: 'eventReminders',
  event_reward: 'eventReminders',
  battle_pass: 'levelUp',
  prompt_approved: 'challengeUpdates',
  prompt_rejected: 'challengeUpdates',
};

exports.sendPushOnNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap) => {
    const n = snap.data();
    if (!n || !n.userId) return null;

    const userRef = db.collection('users').doc(n.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return null;
    const user = userSnap.data();

    const token = user.pushToken;
    if (!token || typeof token !== 'string' || !token.startsWith('ExponentPushToken')) {
      return null; // no device registered (web-only user, or permission denied)
    }

    // Respect the user's notification preferences (absent prefs = allow)
    const prefs = user.notificationPrefs || {};
    if (prefs.enabled === false || prefs.pushEnabled === false) return null;
    const prefKey = TYPE_TO_PREF[n.type];
    if (prefKey && prefs[prefKey] === false) return null;

    const data = { type: n.type || 'general' };
    if (n.roomId) data.roomId = n.roomId;
    if (n.eventId) data.eventId = n.eventId;
    if (n.requestId) data.requestId = n.requestId;

    const message = {
      to: token,
      sound: 'default',
      title: n.title || 'Wittz',
      body: n.message || n.body || '',
      data,
    };

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(message),
      });
      const result = await res.json();
      const ticket = Array.isArray(result?.data) ? result.data[0] : result?.data;

      if (ticket && ticket.status === 'error') {
        console.warn('Expo push error:', ticket.message, ticket.details?.error);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await userRef.update({ pushToken: admin.firestore.FieldValue.delete() });
        }
      }
    } catch (err) {
      console.error('Push send failed:', err);
    }
    return null;
  });
