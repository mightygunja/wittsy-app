/**
 * Casual Lobby — one always-open casual game anyone can drop into.
 *
 * - config/casualLobby { roomId } points at the current lobby room.
 * - Joins go through joinCasualLobby so seating, house bots, and starting
 *   the game happen server-side in one place (no join lock, no human host).
 * - House bots fill seats up to LOBBY_MIN_PARTICIPANTS so a game runs with
 *   any number of people, and step aside at the next game as people join.
 *   Bots never earn rewards, ratings, match history, or gallery stars.
 * - When someone wins, the game rolls into a fresh successor room with
 *   everyone still seated, so every game keeps its own settlement keys.
 * - The engine only advances when a connected player's timer fires, so a
 *   lobby with nobody in it simply pauses and costs nothing.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const LOBBY_MIN_PARTICIPANTS = 4;
const LOBBY_WINNING_VOTES = 20;
const NEXT_GAME_COUNTDOWN_SEC = 20;

const db = () => admin.firestore();
const pointerRef = () => db().doc('config/casualLobby');

const BOT_ROSTER = [
  { userId: 'bot_pixel', username: 'PixelBot', avatarConfig: { skin: 'skin_medium', eyes: 'eyes_happy', mouth: 'mouth_grin', hair: 'hair_short', accessories: ['acc_glasses'], clothing: 'clothing_casual', background: 'bg_blue', effects: [] } },
  { userId: 'bot_nova', username: 'NovaBot', avatarConfig: { skin: 'skin_light', eyes: 'eyes_normal', mouth: 'mouth_smile', hair: 'hair_long', accessories: [], clothing: 'clothing_casual', background: 'bg_purple', effects: [] } },
  { userId: 'bot_byte', username: 'ByteBot', avatarConfig: { skin: 'skin_dark', eyes: 'eyes_happy', mouth: 'mouth_smile', hair: 'hair_bald', accessories: ['acc_glasses'], clothing: 'clothing_casual', background: 'bg_white', effects: [] } },
  { userId: 'bot_echo', username: 'EchoBot', avatarConfig: { skin: 'skin_medium_dark', eyes: 'eyes_normal', mouth: 'mouth_grin', hair: 'hair_short', accessories: [], clothing: 'clothing_casual', background: 'bg_purple', effects: [] } },
  { userId: 'bot_zippy', username: 'ZippyBot', avatarConfig: { skin: 'skin_medium_light', eyes: 'eyes_happy', mouth: 'mouth_grin', hair: 'hair_long', accessories: [], clothing: 'clothing_casual', background: 'bg_blue', effects: [] } },
];

// Prompt-agnostic punchlines (party-card style): they read as funny
// non-sequiturs against any prompt.
const BOT_ANSWERS = [
  'A suspiciously confident raccoon',
  "My mom's Facebook comments",
  'Crying in the Costco parking lot',
  'Three kids in a trench coat',
  'The group chat at 3 AM',
  'Pretending to understand crypto',
  'An aggressively scented candle',
  'Accidentally liking a photo from 2014',
  'A motivational speech from a goose',
  'Microwaving fish at the office',
  "Dad's 45-minute voicemail",
  'A haunted Roomba',
  'Getting emotionally attached to a pigeon',
  'Winning an argument in the shower, three days later',
  "Saying 'you too' when the waiter says enjoy your meal",
  'A spreadsheet of my enemies',
  'Interpretive dance, but angry',
  'A LinkedIn post about gratitude',
  "Grandma's all-caps text messages",
  'Sneezing during a job interview',
  'An unskippable 30-second ad',
  'The Wi-Fi password taped to the fridge',
  'A victory lap nobody asked for',
  'A very polite pillow fight',
  'My search history, narrated dramatically',
  "Forgetting someone's name mid-hug",
  'A goat that knows too much',
  "Calling my failures 'pivots'",
  'Cereal for dinner, again',
  'A strongly worded Yelp review',
  'Parallel parking with an audience',
  'Laughing at my own joke before finishing it',
  'A fire drill during a nap',
  'A tiny hat for a very large dog',
  "Waving back at someone who wasn't waving at me",
  'The printer, sensing fear',
  'An emotional support burrito',
  'Reply-all to 400 coworkers',
  "Pretending to text so I don't have to talk",
  'The sock that vanished in 2009',
  'A mariachi band, for no reason',
  "Silently judging people's fonts",
  'A high five that turned into a handshake',
  'Houseplants I have named and disappointed',
  'Explaining memes to my parents',
  'A dramatic slow clap',
  'Stepping on a single Lego',
  'Two raccoons running a small business',
  'A karaoke version of the terms and conditions',
  'Opening the fridge to see if anything changed',
  'An inflatable tube man with big dreams',
  'Being extremely normal about it',
  'A fax machine, in this economy',
  'Autocorrect ruining my apology',
  'A seagull with a criminal record',
  'Setting 14 alarms and ignoring all of them',
  'Uncomfortably long eye contact',
  'A spoiler in the group chat',
  'The hold music, but louder',
  'A villain origin story at the DMV',
  'My music stats, exposed',
  'Socks with sandals, worn with confidence',
  'Screaming internally, but professionally',
  'A lukewarm pool party',
  "Accidentally calling the teacher 'Mom'",
  'One bar of Wi-Fi',
  'A cat knocking things off tables as a lifestyle',
  'Losing an argument to a toddler',
  'A treadmill I use as a coat rack',
  'An unreasonably large sandwich',
  'Reading the comments section',
  'A haunted doll with strong opinions',
  'The self-checkout machine judging me',
  'Moonwalking away from my responsibilities',
  'Pretending the pothole was on purpose',
  'A squirrel that has seen things',
  'Doing my taxes at 11:58 PM',
  'The kid who reminded the teacher about homework',
  'A banana in a tuxedo',
  "Talking to my car like it's a horse",
  'Pretending I love my new haircut',
  'A ceiling fan on the highest setting',
  'An extremely confident wrong answer',
  'A dramatic exit, then coming back for my keys',
  'Bread. Just so much bread.',
  'A shopping cart with one bad wheel',
  'Accidentally sending a voice memo of me chewing',
  'The tallest person at the concert',
  "Pretending I've seen the movie",
  'A llama with a premium LinkedIn account',
  "My neighbor's leaf blower at 7 AM",
  'A panic-bought air fryer',
  "Loudly agreeing with something I didn't hear",
  "Telling the barista my name is 'Thunder'",
  'A single, perfect french fry',
  'Walking into a spiderweb and fighting the air',
  "A motivational poster in a dentist's office",
  'Clapping when the plane lands',
  'A bouncy castle in a thunderstorm',
  'Whatever is in the back of the fridge',
  'An interpretive dance video about my feelings',
  'The vibe of a Monday',
];

const isBotId = (id) => typeof id === 'string' && id.startsWith('bot_');

// FNV-1a: deterministic picks, so concurrent advance calls agree exactly.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Themed lines, used for most of a bot's answers when the prompt's category
// has a theme — so bot answers land on-topic and compete for people's votes.
const THEMED_ANSWERS = {
  food: [
    'Gas station sushi, eaten confidently',
    'Expired ranch with big dreams',
    'The last slice nobody will claim',
    'Pineapple on pizza, just to start a fight',
    'A casserole my aunt refuses to explain',
    'Cold pizza at 4 AM',
    'Leftovers from an unknown year',
    "The free sample lady's favorite customer",
    'An avocado that was ripe for 11 minutes',
    'Unseasoned tofu with no regrets',
    'Kale chips pretending to be a snack',
    "Hot sauce I can't handle but won't admit it",
    'A charcuterie board for one',
    'Ketchup on a steak, in public',
    'A burrito that fell apart at the worst time',
    'Cereal with orange juice, for chaos',
    'Mayonnaise as a personality',
    'The fancy cheese I pretend to understand',
    'Crumbs in my keyboard from 2019',
    'A gluten-free croissant with trust issues',
    'Microwaving a whole rotisserie chicken at work',
    'A buffet plate engineered like a skyscraper',
    'A salad that is mostly croutons',
    'Soup in a bread bowl, then eating the bowl',
  ],
  tech: [
    'Autocorrect with a personal vendetta',
    '47 open browser tabs',
    "Replying 'lol' with a completely straight face",
    'A group chat muted since 2021',
    'Airplane mode as a lifestyle',
    'My weekly screen time jump scare',
    'Accidentally going live',
    "A password that's just my dog's name",
    'The spinning wheel of death',
    'Talking for ten minutes while muted',
    'Liking my own post by accident',
    'A smart fridge with opinions',
    'Turning it off and on again',
    'A charger that only works at one angle',
    'Seen at 2:14 AM',
    'An influencer unboxing air',
    '1% battery and a dream',
    'The terms and conditions nobody read',
    'Lag at the worst possible moment',
    'Sending the screenshot to the person in the screenshot',
    'Rage-quitting and immediately queuing again',
    'A ring light in a dark bedroom',
    'Posting a sunset nobody asked for',
    'Buffering at the best part',
  ],
  entertainment: [
    'A plot twist nobody asked for',
    'The sequel that should have stayed a rumor',
    'Skipping the intro like a legend',
    'Crying at a cartoon about a toaster',
    'A soundtrack playing in my head at the grocery store',
    'One more episode at 3 AM',
    'Karaoke with zero shame',
    'A villain who honestly has a point',
    'Spoiling the ending for everyone',
    "The director's cut of my bad decisions",
    'A laugh track for my entire life',
    'A dramatic slow-motion walk to the fridge',
    'A reunion tour nobody wanted',
    'Rewatching the same show for the ninth time',
    'The credits scene nobody waited for',
    'An air guitar solo in traffic',
    "An award speech I've practiced in the mirror",
    'Lip-syncing into a hairbrush',
    'A reality show about my group chat',
    'Guessing the killer in the first five minutes',
    'A musical number in the middle of an argument',
    'The remix nobody asked for',
    'My shower concert, completely sold out',
    'Reading the last page first',
  ],
  love: [
    "Texting 'wyd' at 2 AM",
    'A red flag I painted green',
    "Calling their mom 'dude' at the first dinner",
    'Double-texting with full confidence',
    "Deep-scrolling their cousin's dog's account",
    'Splitting the bill down to the cent',
    'A breakup announced in the group chat',
    "Saying 'love you' to the pizza delivery guy",
    'A second date at Costco',
    'Matching pajamas, aggressively',
    "Reading 'k' as a declaration of war",
    'Pretending to love hiking',
    'A love letter written entirely in memes',
    "The 'we need to talk' text",
    'A first date that turned into a job interview',
    'Flirting exclusively by roasting them',
    'Planning the wedding by date two',
    'Relationship advice from a horoscope app',
    'Accidentally liking their photo from 2016',
    'Their ex still on the family group chat',
    "A 'u up?' text sent to my boss",
    'Falling for someone because of their dog',
    'A candlelit dinner at a drive-thru',
    'Rehearsing a casual hello for three days',
  ],
  work: [
    'A meeting that could have been an email',
    'Pretending my camera is broken',
    "'Per my last email'",
    'A LinkedIn post about my breakfast',
    'Stalking the office birthday cake',
    'Calling in sick with a very fake cough',
    'A group project where I did everything',
    "Mispronouncing the boss's name for a year",
    'A standing desk I only sit at',
    "Nodding confidently in a meeting I don't understand",
    'Pajama pants on the video call',
    'The coffee machine being broken again',
    'Quiet quitting, but loudly',
    'Writing the whole essay the night before',
    'A pop quiz on a Monday',
    "Stealing someone's clearly labeled yogurt",
    "An out-of-office reply that's just a scream",
    'Promoted to the person who fixes the printer',
    'Asking the question the teacher just answered',
    "A resume that says 'proficient in vibes'",
    'Trust falls with people I do not trust',
    'Taking the long way back from the bathroom',
    'The fire drill that saved me from a presentation',
    'Replying all with just a thumbs up',
  ],
  nature: [
    'A pigeon who has seen everything',
    'A cat that is clearly plotting something',
    'A goose that chose violence',
    'A houseplant surviving purely out of spite',
    'A sloth on a deadline',
    'A dog who thinks he is a lap dog at 90 pounds',
    'A jellyfish just vibing',
    'A volcano with anger management issues',
    'Pluto, still bitter about the whole thing',
    'An octopus who cannot commit to one hobby',
    'A bee who is simply very tired',
    'A frog who knows all your secrets',
    'Mercury in retrograde, blamed for everything',
    'An asteroid running fashionably late',
    'A llama with a serious attitude',
    'A crab who walks away from every argument',
    'The most dramatic cactus in the world',
    'A penguin in a tuxedo, overdressed again',
    'A moth who found the porch light',
    'A hummingbird on its fourth espresso',
    'A tornado in a trench coat',
    'A squirrel running a very small heist',
    'A snail who refuses to be rushed',
    'A black hole where my paycheck goes',
  ],
};

// Prompt categories in the database are free-form and inconsistently cased;
// anything unmapped just uses the general pool.
const CATEGORY_THEMES = {
  'food': 'food', 'food & drink': 'food',
  'technology': 'tech', 'social media': 'tech', 'social-media': 'tech',
  'internet': 'tech', 'gaming': 'tech', 'innovation': 'tech',
  'entertainment': 'entertainment', 'music': 'entertainment', 'movies': 'entertainment',
  'pop-culture': 'entertainment', 'books': 'entertainment', 'art': 'entertainment',
  'sci-fi': 'entertainment', 'fantasy': 'entertainment',
  'relationships': 'love', 'dating': 'love',
  'work': 'work', 'career': 'work', 'school': 'work', 'skills': 'work',
  'animals': 'nature', 'nature': 'nature', 'science': 'nature',
};

const themeFor = (category) => CATEGORY_THEMES[String(category || '').trim().toLowerCase()] || null;

/** Answers for each bot this round: botId → phrase (distinct within the round). */
function botPhrases(roomId, round, botIds, category) {
  const themed = THEMED_ANSWERS[themeFor(category)] || [];
  const used = new Set();
  const out = {};
  botIds.forEach((botId) => {
    const h = hash(`${roomId}:${round}:${botId}:answer`);
    const pool = themed.length > 0 && h % 10 < 6 ? themed : BOT_ANSWERS;
    let idx = (h >>> 4) % pool.length;
    while (used.has(pool[idx])) idx = (idx + 1) % pool.length;
    used.add(pool[idx]);
    out[botId] = pool[idx];
  });
  return out;
}

const JUNK_ANSWERS = new Set(['lol', 'lmao', 'idk', 'ok', 'okay', 'k', 'no', 'yes', 'yea', 'yeah', 'nah', 'hi', 'hey', 'test', 'asdf', 'pass', 'skip', 'nothing', 'none', 'dunno']);

function isLowEffort(phrase) {
  const letters = String(phrase || '').toLowerCase().replace(/[^a-z]/g, '');
  return letters.length < 3 || JUNK_ANSWERS.has(letters) || /^(.)\1+$/.test(letters);
}

/**
 * Votes for every bot that answered: botId → target (never itself).
 * Bots are fair judges — no favoritism toward people or other bots — so a
 * lone player wins about their fair share (~1 in 4 games) instead of every
 * game. Junk answers ("lol", "idk") only get a bot vote when nothing else
 * is on the board.
 */
function botVotes(roomId, round, validSubmissions) {
  const votes = {};
  const ids = Object.keys(validSubmissions || {}).sort();
  ids.filter(isBotId).forEach((botId) => {
    const others = ids.filter((id) => id !== botId);
    if (others.length === 0) return;
    const serious = others.filter((id) => !isLowEffort(validSubmissions[id]));
    const pool = serious.length > 0 ? serious : others;
    const h = hash(`${roomId}:${round}:${botId}`);
    votes[botId] = pool[(h >>> 4) % pool.length];
  });
  return votes;
}

function makeBotSeat(bot) {
  return {
    userId: bot.userId,
    username: bot.username,
    avatar: null,
    avatarConfig: bot.avatarConfig,
    isReady: true,
    isConnected: true,
    joinedAt: new Date().toISOString(),
    isBot: true,
  };
}

/**
 * Seat bots so people + bots >= LOBBY_MIN_PARTICIPANTS.
 * mode 'full' (between games): add or remove bots to hit the target.
 * mode 'grow' (mid-game): only add — removing a bot mid-game would orphan
 * its score on the scoreboard.
 * With nobody seated, seats are left alone (the lobby is paused).
 */
function reconcileBots(players, mode) {
  const people = players.filter((p) => !p.isBot);
  let bots = players.filter((p) => p.isBot);
  if (people.length === 0) return { players, added: [] };

  const target = Math.max(0, LOBBY_MIN_PARTICIPANTS - people.length);
  if (mode === 'full' && bots.length > target) bots = bots.slice(0, target);

  const added = [];
  for (const bot of BOT_ROSTER) {
    if (bots.length >= target) break;
    if (bots.some((b) => b.userId === bot.userId)) continue;
    const seat = makeBotSeat(bot);
    bots.push(seat);
    added.push(seat.userId);
  }
  return { players: [...people, ...bots], added };
}

const emptyScore = () => ({ totalVotes: 0, roundWins: 0, stars: 0, phrases: [] });

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function newLobbyRoom(players, gameNumber) {
  const scores = {};
  players.forEach((p) => { scores[p.userId] = emptyScore(); });
  return {
    roomCode: generateRoomCode(),
    name: 'Casual Lobby',
    hostId: 'system',
    status: 'waiting',
    settings: {
      maxPlayers: 12,
      minPlayers: 3,
      submissionTime: 20,
      votingTime: 20,
      winningVotes: LOBBY_WINNING_VOTES,
      joinLockVoteThreshold: 999, // join anytime
      promptPacks: ['default'],
      isPrivate: false,
      profanityFilter: 'medium',
      spectatorChatEnabled: true,
      allowJoinMidGame: true,
      autoStart: false,
      countdownTriggerPlayers: 0,
    },
    players,
    spectators: [],
    currentRound: 0,
    currentPrompt: null,
    scores,
    gameState: 'lobby',
    createdAt: admin.firestore.Timestamp.now(),
    startedAt: null,
    isRanked: false,
    isLobby: true,
    gameNumber,
  };
}

/** Fields that flip a waiting lobby to active — the onGameStart trigger then starts the engine. */
function startFields(players) {
  const scores = {};
  players.forEach((p) => { scores[p.userId] = emptyScore(); });
  return {
    status: 'active',
    gameState: 'starting',
    currentRound: 0,
    startedAt: admin.firestore.Timestamp.now(),
    scores,
    countdownStartedAt: null,
    countdownDuration: null,
  };
}

/** Idempotent: starts a waiting lobby room if at least one person is seated. */
async function startLobbyIfWaiting(roomRef) {
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) return false;
    const room = snap.data();
    if (!room.isLobby || room.status !== 'waiting') return false;
    const { players } = reconcileBots(room.players || [], 'full');
    if (!players.some((p) => !p.isBot)) return false; // nobody here — don't start an empty game
    tx.update(roomRef, { players, ...startFields(players) });
    return true;
  });
}

/** Mid-game: people left, so seat bots to keep the table playable. */
async function topUpLobbyBots(roomId) {
  const roomRef = db().collection('rooms').doc(roomId);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) return;
    const room = snap.data();
    if (!room.isLobby || room.status !== 'active') return;
    const { players, added } = reconcileBots(room.players || [], 'grow');
    if (added.length === 0) return;
    const update = { players };
    added.forEach((id) => {
      if (!room.scores?.[id]) update[`scores.${id}`] = emptyScore();
    });
    tx.update(roomRef, update);
  });
}

/**
 * A lobby game was won: seat everyone still here in a fresh successor room
 * (countdown running), point the finished room at it, and move the lobby
 * pointer. Returns the new room id, or null when nobody is left to carry over.
 */
async function rollLobbyToNextGame(roomId, room) {
  const people = (room.players || []).filter((p) => !p.isBot);
  if (people.length === 0) return null; // the next joiner opens a fresh lobby

  const { players } = reconcileBots(people, 'full');
  const nextRef = db().collection('rooms').doc();
  const next = newLobbyRoom(players, (room.gameNumber || 1) + 1);
  next.countdownStartedAt = new Date().toISOString();
  next.countdownDuration = NEXT_GAME_COUNTDOWN_SEC;
  if (room.isSimulation) next.isSimulation = true;

  await db().runTransaction(async (tx) => {
    const pointer = await tx.get(pointerRef());
    tx.set(nextRef, next);
    tx.update(db().collection('rooms').doc(roomId), { nextRoomId: nextRef.id });
    // Only the real lobby moves the pointer — never a simulation/test room.
    if (!room.isSimulation && (!pointer.exists || pointer.data().roomId === roomId)) {
      tx.set(pointerRef(), { roomId: nextRef.id, updatedAt: admin.firestore.Timestamp.now() });
    }
  });
  return nextRef.id;
}

const joinCasualLobby = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in to join the Casual Lobby.');
  }
  const uid = context.auth.uid;
  const [userSnap, avatarSnap] = await Promise.all([
    db().doc(`users/${uid}`).get(),
    db().doc(`avatars/${uid}`).get(),
  ]);
  const me = {
    userId: uid,
    username: userSnap.data()?.username || context.auth.token.name || 'Player',
    avatar: null,
    avatarConfig: avatarSnap.data()?.config || null,
    isReady: true,
    isConnected: true,
    joinedAt: new Date().toISOString(),
  };

  const outcome = await db().runTransaction(async (tx) => {
    const pointer = await tx.get(pointerRef());
    const currentId = pointer.exists ? pointer.data().roomId : null;
    const roomRef = currentId ? db().collection('rooms').doc(currentId) : null;
    const snap = roomRef ? await tx.get(roomRef) : null;
    const room = snap && snap.exists ? snap.data() : null;
    const people = room ? (room.players || []).filter((p) => !p.isBot) : [];

    // Already seated in the live lobby — just go back in
    if (room && room.status !== 'finished' && people.some((p) => p.userId === uid)) {
      return { roomId: currentId, needsStart: false };
    }

    // Open a fresh lobby when there isn't one, it finished, or it's a stale
    // bots-only game nobody is playing (don't drop a newcomer into a game the
    // bots are about to win).
    const staleBotsOnly = !!room && room.status === 'active' && people.length === 0;
    if (!room || !room.isLobby || room.status === 'finished' || staleBotsOnly) {
      if (staleBotsOnly) {
        tx.update(roomRef, {
          status: 'finished',
          endedAt: admin.firestore.Timestamp.now(),
          endReason: 'lobby_reset',
        });
      }
      const { players } = reconcileBots([me], 'full');
      const newRef = db().collection('rooms').doc();
      tx.set(newRef, newLobbyRoom(players, (room?.gameNumber || 0) + 1));
      tx.set(pointerRef(), { roomId: newRef.id, updatedAt: admin.firestore.Timestamp.now() });
      return { roomId: newRef.id, needsStart: true };
    }

    const maxPlayers = room.settings?.maxPlayers || 12;
    if (people.length >= maxPlayers) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'The Casual Lobby is full right now — try again in a minute.'
      );
    }

    let players = [...(room.players || []), me];
    if (players.length > maxPlayers) {
      // Give a bot's seat to the person
      players.splice(players.findIndex((p) => p.isBot), 1);
    }
    if (room.status === 'waiting') players = reconcileBots(players, 'full').players;

    const update = { players };
    if (!room.scores?.[uid]) update[`scores.${uid}`] = emptyScore();
    tx.update(roomRef, update);

    // A waiting lobby with no countdown running (or one that ran out with
    // nobody left to start it) starts right away.
    const countdownEnd = room.countdownStartedAt
      ? new Date(room.countdownStartedAt).getTime() + (room.countdownDuration || 0) * 1000
      : 0;
    return { roomId: currentId, needsStart: room.status === 'waiting' && Date.now() >= countdownEnd };
  });

  if (outcome.needsStart) {
    await startLobbyIfWaiting(db().collection('rooms').doc(outcome.roomId));
  }
  return { roomId: outcome.roomId };
});

/** Called by clients when a successor lobby's countdown ends (idempotent). */
const startCasualLobby = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in first.');
  }
  const roomId = data && data.roomId;
  if (!roomId) {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID required');
  }
  const started = await startLobbyIfWaiting(db().collection('rooms').doc(roomId));
  return { started };
});

module.exports = {
  joinCasualLobby,
  startCasualLobby,
  isBotId,
  botPhrases,
  botVotes,
  themeFor,
  isLowEffort,
  THEMED_ANSWERS,
  reconcileBots,
  newLobbyRoom,
  startLobbyIfWaiting,
  topUpLobbyBots,
  rollLobbyToNextGame,
  LOBBY_MIN_PARTICIPANTS,
  BOT_ANSWERS,
};
