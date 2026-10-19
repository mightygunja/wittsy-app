/**
 * Daily watch on the in-app purchase "init-connection" bug.
 *
 * Background: initialize() used to mark itself initialized even when
 * initConnection() failed, so every later purchase hit the native layer with
 * no connection and threw "Connection not initialized. Call initConnection()
 * first." Fixed on 2026-10-19 (commit 22c304c, update group a63e6cd4) and
 * shipped over the air to runtime 1.1.0.
 *
 * This reports whether the error has appeared since the fix, and how much real
 * usage there has been — silence with no sessions proves nothing.
 *
 * Usage: node scripts/checkIapErrors.js   (needs scripts/serviceAccountKey.json)
 */

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
const key = require(path.join(__dirname, 'serviceAccountKey.json'));

const FIX_SHIPPED_AT = Date.parse('2026-10-19T05:30:00Z');
const WINDOW_DAYS = 14;

admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const ms = (v) => (!v ? 0 : typeof v.toMillis === 'function' ? v.toMillis() : new Date(v).getTime() || 0);
const t = (m) => new Date(m).toISOString().replace('T', ' ').slice(0, 16) + 'Z';
const isInitConnection = (msg) => /init-connection|Connection not initialized/i.test(msg || '');

(async () => {
  const since = Date.now() - WINDOW_DAYS * 24 * 3600 * 1000;
  const batches = (await db.collection('analyticsEvents').get())
    .docs.map((d) => d.data())
    .filter((b) => ms(b.flushedAt) >= since);

  const errors = [];
  let sessionsAfterFix = 0;
  let sessionsTotal = 0;

  batches.forEach((b) => {
    (b.events || []).forEach((e) => {
      const at = e.ts || ms(b.flushedAt);
      if (e.name === 'session_start') {
        sessionsTotal++;
        if (at >= FIX_SHIPPED_AT) sessionsAfterFix++;
      }
      if (e.name === 'error' && isInitConnection(e.params && e.params.error_message)) {
        errors.push({ at, uid: (b.userId || '?').slice(0, 8), platform: b.platform, ver: b.appVersion });
      }
    });
  });

  errors.sort((a, b) => a.at - b.at);
  const after = errors.filter((e) => e.at >= FIX_SHIPPED_AT);
  const before = errors.filter((e) => e.at < FIX_SHIPPED_AT);
  const daysSinceFix = ((Date.now() - FIX_SHIPPED_AT) / 86400000).toFixed(1);

  console.log('IAP init-connection watch —', t(Date.now()));
  console.log('fix shipped', t(FIX_SHIPPED_AT), `(${daysSinceFix} days ago)`);
  console.log('');
  console.log('SINCE THE FIX:');
  console.log('  sessions:', sessionsAfterFix);
  console.log('  init-connection errors:', after.length);
  after.forEach((e) => console.log('    ' + t(e.at) + ' ' + e.uid + ' ' + e.platform + ' ' + (e.ver || '')));
  console.log('');
  console.log(`BEFORE THE FIX (last ${WINDOW_DAYS}d): ${before.length} error(s), ${sessionsTotal - sessionsAfterFix} session(s)`);

  console.log('');
  if (after.length > 0) {
    console.log('VERDICT: STILL BROKEN — the error has recurred since the fix shipped.');
  } else if (sessionsAfterFix === 0) {
    console.log('VERDICT: NO DATA YET — nobody has opened the app since the fix, so silence means nothing.');
  } else if (sessionsAfterFix < 10) {
    console.log(`VERDICT: LOOKING GOOD, TOO EARLY — ${sessionsAfterFix} session(s), no errors. Needs ~10+ to be meaningful.`);
  } else {
    console.log(`VERDICT: FIXED — ${sessionsAfterFix} sessions since the fix with no init-connection errors.`);
  }

  // Note: users on the older App Store binary never receive the over-the-air
  // fix, so a late straggler is not automatically a regression — check the
  // reporting app version above.
  process.exit(0);
})().catch((e) => {
  console.error('check failed:', e.message);
  process.exit(1);
});
