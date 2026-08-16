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

// Inject SEO / social metadata into the exported index.html.
const indexPath = path.join(PUBLIC, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const DESCRIPTION =
  'The fast-paced party word game where your wit wins. Get a prompt, write the funniest phrase, vote for the best — play free in your browser or on iPhone.';
const META = `
  <meta name="description" content="${DESCRIPTION}">
  <meta name="theme-color" content="#6C63FF">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Wittz">
  <meta property="og:title" content="Wittz: Party Word Game">
  <meta property="og:description" content="${DESCRIPTION}">
  <meta property="og:url" content="https://wittz.app">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Wittz: Party Word Game">
  <meta name="twitter:description" content="${DESCRIPTION}">
  <meta name="apple-itunes-app" content="app-id=6757277835">
`;
html = html.replace('</head>', `${META}</head>`);
fs.writeFileSync(indexPath, html);

console.log('public/ rebuilt from', DIST, '+ metadata injected');
