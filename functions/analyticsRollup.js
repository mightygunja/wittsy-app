/**
 * Daily analytics rollup.
 *
 * Aggregates yesterday's raw analyticsEvents batches into a single
 * analyticsDaily/{YYYY-MM-DD} document: DAU, sessions, average session
 * length, platform/country splits, event counts, top screens, and the
 * core gameplay funnel. Dashboards read the rollup, never the raw events.
 *
 * Also prunes raw event batches older than 90 days to cap storage cost.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.dailyAnalyticsRollup = functions.pubsub
  .schedule('every day 07:00')
  .timeZone('America/Chicago')
  .onRun(async () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // local midnight
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const dayKey = start.toISOString().slice(0, 10);

    const snap = await db
      .collection('analyticsEvents')
      .where('flushedAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('flushedAt', '<', admin.firestore.Timestamp.fromDate(end))
      .get();

    const users = new Set();
    const sessions = new Set();
    const platforms = {};
    const countries = {};
    const appVersions = {};
    const eventCounts = {};
    const screenViews = {};
    let sessionSeconds = 0;
    let sessionEndCount = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.userId) users.add(d.userId);
      if (d.sessionId) sessions.add(d.sessionId);
      platforms[d.platform] = (platforms[d.platform] || 0) + 1;
      countries[d.country || 'unknown'] = (countries[d.country || 'unknown'] || 0) + 1;
      appVersions[d.appVersion || 'unknown'] = (appVersions[d.appVersion || 'unknown'] || 0) + 1;

      for (const ev of d.events || []) {
        eventCounts[ev.name] = (eventCounts[ev.name] || 0) + 1;
        if (ev.name === 'screen_view' && ev.params?.screen) {
          screenViews[ev.params.screen] = (screenViews[ev.params.screen] || 0) + 1;
        }
        if (ev.name === 'session_end' && typeof ev.params?.durationSec === 'number') {
          sessionSeconds += ev.params.durationSec;
          sessionEndCount++;
        }
      }
    }

    const topScreens = Object.entries(screenViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([screen, views]) => ({ screen, views }));

    await db.collection('analyticsDaily').doc(dayKey).set({
      date: dayKey,
      batches: snap.size,
      dau: users.size,
      sessions: sessions.size,
      avgSessionSec: sessionEndCount ? Math.round(sessionSeconds / sessionEndCount) : 0,
      platforms,
      countries,
      appVersions,
      eventCounts,
      topScreens,
      funnel: {
        sessionStarts: eventCounts['session_start'] || 0,
        roomsCreated: eventCounts['create_room'] || 0,
        roomsJoined: eventCounts['join_room'] || 0,
        submissions: eventCounts['submit_response'] || 0,
        votes: eventCounts['cast_vote'] || 0,
        roundWins: eventCounts['win_round'] || 0,
        shares: eventCounts['share'] || 0,
        signUps: eventCounts['sign_up'] || 0,
      },
      generatedAt: admin.firestore.Timestamp.now(),
    });
    console.log(`📊 Rollup ${dayKey}: ${users.size} DAU, ${sessions.size} sessions, ${snap.size} batches`);

    // Prune raw batches older than 90 days (small daily chunks)
    const pruneBefore = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    const old = await db
      .collection('analyticsEvents')
      .where('flushedAt', '<', admin.firestore.Timestamp.fromDate(pruneBefore))
      .limit(500)
      .get();
    if (!old.empty) {
      const batch = db.batch();
      old.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`🧹 Pruned ${old.size} old analytics batches`);
    }

    return null;
  });
