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
const GLOBAL_CSS = `
  <style>
    html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
    body { background: #13111C; }
    ::selection { background: rgba(108, 99, 255, 0.4); }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 6px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
    #wittz-splash { position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #13111C; z-index: 9999;
      transition: opacity 0.3s ease; }
    #wittz-splash .logo { font-size: 44px; font-weight: 900; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 1px; margin-bottom: 24px; }
    #wittz-splash .logo span { color: #6C63FF; }
    #wittz-splash .spinner { width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid rgba(108, 99, 255, 0.25); border-top-color: #6C63FF;
      animation: wittz-spin 0.8s linear infinite; }
    @keyframes wittz-spin { to { transform: rotate(360deg); } }
  </style>
`;
const SPLASH = `
  <div id="wittz-splash"><div class="logo">⚡ Wit<span>tz</span></div><div class="spinner"></div></div>
  <script>
    // Remove the splash once React mounts content into #root
    new MutationObserver(function (m, obs) {
      var root = document.getElementById('root');
      if (root && root.children.length > 0) {
        var s = document.getElementById('wittz-splash');
        if (s) { s.style.opacity = '0'; setTimeout(function () { s.remove(); }, 300); }
        obs.disconnect();
      }
    }).observe(document.body, { childList: true, subtree: true });
  </script>
`;
html = html.replace('</head>', `${META}${GLOBAL_CSS}</head>`);
html = html.replace('</body>', `${SPLASH}</body>`);
fs.writeFileSync(indexPath, html);

console.log('public/ rebuilt from', DIST, '+ metadata injected');
