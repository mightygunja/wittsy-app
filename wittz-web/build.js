/**
 * Build wittz.app: copy the Expo web export into public/, preserving
 * the .well-known directory (apple-app-site-association for universal links).
 *
 * Usage:
 *   cd wittsy-app && npx expo export --platform web
 *   cd ../wittz-web && node build.js && npx vercel deploy --prod
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'wittsy-app', 'dist');
const PUBLIC = path.join(__dirname, 'public');
const WELL_KNOWN = path.join(PUBLIC, '.well-known');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web export found at', DIST, '— run: npx expo export --platform web');
  process.exit(1);
}

// Stash .well-known, wipe public, restore, copy dist in.
const stash = path.join(__dirname, '.well-known-stash');
fs.rmSync(stash, { recursive: true, force: true });
if (fs.existsSync(WELL_KNOWN)) fs.cpSync(WELL_KNOWN, stash, { recursive: true });

fs.rmSync(PUBLIC, { recursive: true, force: true });
fs.mkdirSync(PUBLIC, { recursive: true });
if (fs.existsSync(stash)) {
  fs.cpSync(stash, WELL_KNOWN, { recursive: true });
  fs.rmSync(stash, { recursive: true, force: true });
}

fs.cpSync(DIST, PUBLIC, { recursive: true });
console.log('public/ rebuilt from', DIST);
