/**
 * Casual Lobby bot intelligence.
 *
 * House bots write real answers to the round's prompt and genuinely judge the
 * table's answers, using Claude. Everything here is best-effort: when no API
 * key is configured, or a call is slow or malformed, the caller falls back to
 * the canned pool in casualLobby.js, so a game never stalls on this.
 *
 * Both calls run at the START of a phase (while the 20s timer is ticking) and
 * the result is parked in RTDB, so the deadline itself never waits on a model.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { z } = require('zod');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { isCleanForPublic } = require('./contentFilter');

// Opus 5.5 at low effort: fast enough for a 20s phase and strong at humour.
// Override with ANTHROPIC_BOT_MODEL (e.g. claude-haiku-4-5) to trade quality
// for cost.
const MODEL = process.env.ANTHROPIC_BOT_MODEL || 'claude-opus-5-5';
const CALL_TIMEOUT_MS = 12000;
const MAX_ANSWER_CHARS = 90;

const ANSWER_SCHEMA = z.object({
  answers: z.array(z.object({ bot: z.string(), answer: z.string() })),
});
const VOTE_SCHEMA = z.object({
  votes: z.array(z.object({ bot: z.string(), pick: z.string() })),
});

let client = null;
const isEnabled = () => !!process.env.ANTHROPIC_API_KEY;
function getClient() {
  if (!isEnabled()) return null;
  if (!client) client = new Anthropic({ timeout: CALL_TIMEOUT_MS, maxRetries: 1 });
  return client;
}

const ANSWER_SYSTEM = [
  'You write answers for the house bots in Wittz, a party word game where players',
  'answer a prompt and then vote for the funniest answer.',
  '',
  'Rules for every answer:',
  '- Actually answer the prompt. Specific beats generic, and a real answer that is',
  '  funny beats a random non-sequitur.',
  '- Short: at most 90 characters, usually far less. No quotation marks around it.',
  '- Keep each bot in its own voice, and make the answers clearly different from',
  '  each other.',
  '- Keep it broadly playable: no profanity, slurs, sexual content, or real people',
  '  being insulted. Being weird is fine; being offensive is not.',
  '- Never mention being a bot or an AI, and never explain the joke.',
].join('\n');

const VOTE_SYSTEM = [
  'You are judging a round of Wittz, a party word game. Each bot votes for the one',
  'answer it finds funniest.',
  '',
  'Judge honestly, on merit:',
  '- Reward answers that fit the prompt and land a real joke: surprise, specificity,',
  '  wordplay, a perfect mundane detail.',
  '- Ignore who wrote an answer, and ignore length. A two-word answer can win.',
  '- Low-effort entries (lol, idk, keyboard mash) should never win a vote.',
  '- A bot must never pick its own answer. Bots may agree with each other.',
].join('\n');

/** Bot answers for this round: { botId: phrase }, or null when unavailable. */
async function generateAnswers({ roomId, round, prompt, bots }) {
  const api = getClient();
  if (!api || !prompt || !bots || bots.length === 0) return null;

  const roster = bots.map((b) => `- ${b.username}: ${b.persona}`).join('\n');
  try {
    const response = await api.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(ANSWER_SCHEMA) },
      system: ANSWER_SYSTEM,
      messages: [{
        role: 'user',
        content: `Prompt for this round:\n"${prompt}"\n\nWrite one answer for each of these players, using the name exactly as given:\n${roster}`,
      }],
    });

    if (response.stop_reason === 'refusal') {
      console.log(`🤖 Bot answers declined for ${roomId} r${round} — using the canned pool`);
      return null;
    }
    const parsed = response.parsed_output;
    if (!parsed || !Array.isArray(parsed.answers)) return null;

    const byName = new Map(bots.map((b) => [b.username.toLowerCase(), b.userId]));
    const out = {};
    const seen = new Set();
    for (const row of parsed.answers) {
      const userId = byName.get(String(row.bot || '').trim().toLowerCase());
      const answer = String(row.answer || '').trim().replace(/^["']+|["']+$/g, '');
      if (!userId || !answer || answer.length > MAX_ANSWER_CHARS) continue;
      if (seen.has(answer.toLowerCase())) continue;     // never two identical cards
      if (!isCleanForPublic(answer)) {                  // same filter as the gallery
        console.log('🤖 A bot answer failed the content filter — falling back for that bot');
        continue;
      }
      seen.add(answer.toLowerCase());
      out[userId] = answer;
    }
    console.log(`🤖 ${Object.keys(out).length}/${bots.length} bot answers written for ${roomId} r${round}`);
    return Object.keys(out).length > 0 ? out : null;
  } catch (error) {
    console.error(`⚠️ Bot answer generation failed for ${roomId} r${round}:`, error.message);
    return null;
  }
}

/**
 * Bot votes for this round: { botId: targetUserId }, or null when unavailable.
 * Answers are shown under opaque letters, so the judgement is about the writing
 * rather than about who wrote it.
 */
async function chooseVotes({ roomId, round, prompt, validSubmissions, bots }) {
  const api = getClient();
  if (!api || !prompt || !bots || bots.length === 0) return null;

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const entries = Object.entries(validSubmissions || {});
  if (entries.length < 2) return null;

  const letterOf = new Map();   // userId  -> letter
  const idOf = new Map();       // letter  -> userId
  entries.forEach(([userId], i) => {
    const letter = LETTERS[i] || `Z${i}`;
    letterOf.set(userId, letter);
    idOf.set(letter, userId);
  });

  const board = entries.map(([userId, phrase]) => `${letterOf.get(userId)}. ${phrase}`).join('\n');
  const voters = bots
    .filter((b) => letterOf.has(b.userId))
    .map((b) => `- ${b.username} (wrote ${letterOf.get(b.userId)})`)
    .join('\n');
  if (!voters) return null;

  try {
    const response = await api.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(VOTE_SCHEMA) },
      system: VOTE_SYSTEM,
      messages: [{
        role: 'user',
        content: `Prompt:\n"${prompt}"\n\nAnswers:\n${board}\n\nVoters, each picking a letter that is not their own:\n${voters}\n\nReturn one pick per voter, using the name exactly as given and a single letter.`,
      }],
    });

    if (response.stop_reason === 'refusal') {
      console.log(`🤖 Bot voting declined for ${roomId} r${round} — using the fallback`);
      return null;
    }
    const parsed = response.parsed_output;
    if (!parsed || !Array.isArray(parsed.votes)) return null;

    const byName = new Map(bots.map((b) => [b.username.toLowerCase(), b.userId]));
    const out = {};
    for (const row of parsed.votes) {
      const voter = byName.get(String(row.bot || '').trim().toLowerCase());
      const target = idOf.get(String(row.pick || '').trim().toUpperCase().charAt(0));
      if (!voter || !target || voter === target) continue;   // never a self-vote
      out[voter] = target;
    }
    console.log(`🤖 ${Object.keys(out).length} bot votes judged for ${roomId} r${round}`);
    return Object.keys(out).length > 0 ? out : null;
  } catch (error) {
    console.error(`⚠️ Bot voting failed for ${roomId} r${round}:`, error.message);
    return null;
  }
}

module.exports = { isEnabled, generateAnswers, chooseVotes, MODEL };
