/**
 * Content filter for user-generated phrases.
 *
 * Gates what reaches PUBLIC surfaces (the community starred-phrases gallery).
 * In-room phrases between friends are not filtered — this only controls what
 * gets persisted and shown to strangers.
 *
 * Matching is word-boundary based on a normalized form (lowercased, common
 * leetspeak collapsed) to avoid the Scunthorpe problem while still catching
 * simple evasions like "h0rny" or "p·u·s·s·y".
 */

// Explicit sexual terms, slurs, and strong profanity. Deliberately focused on
// what is unacceptable on a public surface — mild profanity is allowed.
const BLOCKED_WORDS = [
  // sexual / explicit
  'anal', 'anus', 'blowjob', 'boner', 'clit', 'cock', 'cum', 'cunt',
  'dick', 'dildo', 'ejaculate', 'erection', 'fap', 'fellatio', 'handjob',
  'horny', 'jerkoff', 'jizz', 'masturbate', 'milf', 'orgasm', 'penis',
  'porn', 'porno', 'pussy', 'rimjob', 'semen', 'sex', 'sexual', 'slut',
  'tits', 'titties', 'vagina', 'wank', 'whore',
  // slurs (partial list of unambiguous ones)
  'fag', 'faggot', 'kike', 'nigga', 'nigger', 'retard', 'retarded',
  'spic', 'tranny',
  // strong profanity
  'fuck', 'fucked', 'fucker', 'fucking', 'motherfucker', 'shit', 'shitty',
  // violence / self-harm on a public surface
  'rape', 'rapist', 'kys',
  // common Dutch/German explicit terms seen in the wild
  'geil', 'hoer', 'kanker', 'neuken', 'ficken',
];

const LEET_MAP = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };

function normalize(text) {
  let t = String(text || '').toLowerCase();
  t = t.replace(/[0134578@$!]/g, (c) => LEET_MAP[c] || c);
  t = t.replace(/[^a-z\s]/g, ' '); // strip punctuation/separators used for evasion
  return t;
}

const BLOCKED_SET = new Set(BLOCKED_WORDS);

/**
 * Returns true when the text is acceptable for public display.
 */
function isCleanForPublic(text) {
  const words = normalize(text).split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (BLOCKED_SET.has(w)) return false;
  }
  // Also catch words glued together with punctuation stripped ("p.u.s.s.y" → "p u s s y")
  const collapsed = normalize(text).replace(/\s+/g, '');
  for (const bad of BLOCKED_WORDS) {
    if (bad.length >= 5 && collapsed.includes(bad)) return false;
  }
  return true;
}

module.exports = { isCleanForPublic, BLOCKED_WORDS };
