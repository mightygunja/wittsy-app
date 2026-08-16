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

// Static SEO/content pages (how-to-play, faq, legal, robots, sitemap, og image)
// are copied AFTER dist so they always win over generated files.
const STATIC = path.join(__dirname, 'static');
if (fs.existsSync(STATIC)) fs.cpSync(STATIC, PUBLIC, { recursive: true });

// Inject SEO / social metadata into the exported index.html.
const indexPath = path.join(PUBLIC, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const DESCRIPTION =
  'The fast-paced party word game where your wit wins. Get a prompt, write the funniest phrase, vote for the best — play free in your browser or on iPhone.';
const META = `
  <meta name="description" content="${DESCRIPTION}">
  <meta name="theme-color" content="#6C63FF">
  <link rel="canonical" href="https://wittz.app/">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://firestore.googleapis.com">
  <link rel="preconnect" href="https://identitytoolkit.googleapis.com">
  <link rel="preconnect" href="https://wittsy-51992-default-rtdb.firebaseio.com">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Wittz">
  <meta property="og:title" content="Wittz: Party Word Game">
  <meta property="og:description" content="${DESCRIPTION}">
  <meta property="og:url" content="https://wittz.app">
  <meta property="og:image" content="https://wittz.app/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Wittz: Party Word Game">
  <meta name="twitter:description" content="${DESCRIPTION}">
  <meta name="twitter:image" content="https://wittz.app/og-image.jpg">
  <meta name="apple-itunes-app" content="app-id=6757277835">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Wittz: Party Word Game",
    "url": "https://wittz.app",
    "image": "https://wittz.app/og-image.jpg",
    "description": "${DESCRIPTION}",
    "genre": ["Party", "Word", "Trivia"],
    "playMode": "MultiPlayer",
    "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 12 },
    "applicationCategory": "Game",
    "operatingSystem": "Web, iOS",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "sameAs": ["https://apps.apple.com/us/app/wittz-party-word-game/id6757277835"]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Wittz",
    "url": "https://wittz.app",
    "logo": "https://wittz.app/icon-1024.png"
  }
  </script>
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
  <!-- Crawlable content: matches what the app renders on its landing view.
       Sits beneath the fixed splash overlay and is removed when React mounts,
       so users never see it but non-JS crawlers index real content. -->
  <div id="wittz-seo">
    <h1>Wittz: Party Word Game</h1>
    <p>${DESCRIPTION}</p>
    <p>Wittz is a fast-paced party word game for 3–12 players. Each round you get
    a prompt, write the funniest phrase in 25 seconds, and everyone votes
    anonymously for the best answer. The round winner banks their votes plus a
    bonus — first to 20 votes wins. Play ranked lobbies with an ELO rating and
    seasonal leaderboards, or private rooms with friends via a 6-digit invite
    code. Legendary answers earn stars and live forever in the community gallery.</p>
    <ul>
      <li><a href="/how-to-play">How to play Wittz — rules and tips</a></li>
      <li><a href="/faq">Frequently asked questions</a></li>
      <li><a href="https://apps.apple.com/us/app/wittz-party-word-game/id6757277835">Download Wittz on the App Store</a></li>
      <li><a href="/support">Support</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></li>
    </ul>
  </div>
  <div id="wittz-splash"><div class="logo">⚡ Wit<span>tz</span></div><div class="spinner"></div></div>
  <script>
    // Remove the splash + SEO fallback once React mounts content into #root
    new MutationObserver(function (m, obs) {
      var root = document.getElementById('root');
      if (root && root.children.length > 0) {
        var s = document.getElementById('wittz-splash');
        if (s) { s.style.opacity = '0'; setTimeout(function () { s.remove(); }, 300); }
        var seo = document.getElementById('wittz-seo');
        if (seo) seo.remove();
        obs.disconnect();
      }
    }).observe(document.body, { childList: true, subtree: true });
  </script>
`;
html = html.replace('</head>', `${META}${GLOBAL_CSS}</head>`);
html = html.replace('</body>', `${SPLASH}</body>`);
fs.writeFileSync(indexPath, html);

console.log('public/ rebuilt from', DIST, '+ metadata injected');
