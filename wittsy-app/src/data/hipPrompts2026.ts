/**
 * Hip, Funny, Clever Prompts for 2026
 * Current, trendy, and engaging prompts
 */

import { Prompt, PromptCategory, PromptDifficulty } from '../types/prompts';

export const HIP_PROMPTS_2026: Omit<Prompt, 'id' | 'timesUsed' | 'averageRating' | 'reportCount' | 'createdAt'>[] = [
  // GENERAL - Hip & Current (20 prompts)
  { text: 'My toxic trait that I refuse to fix', category: 'general', difficulty: 'easy', tags: ['personality', 'relatable', 'funny'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Red flags I ignore in myself', category: 'general', difficulty: 'medium', tags: ['self-aware', 'humor'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Things I do that give the ick', category: 'general', difficulty: 'medium', tags: ['dating', 'cringe'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My Roman Empire (thing I think about constantly)', category: 'general', difficulty: 'easy', tags: ['trending', 'obsession'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Unhinged thing I would do for $1 million', category: 'general', difficulty: 'medium', tags: ['hypothetical', 'wild'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My villain origin story', category: 'general', difficulty: 'medium', tags: ['funny', 'dramatic'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The hill I will die on', category: 'general', difficulty: 'medium', tags: ['opinions', 'passionate'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My biggest flex that sounds fake', category: 'general', difficulty: 'medium', tags: ['bragging', 'unbelievable'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Something I am gatekeeping', category: 'general', difficulty: 'medium', tags: ['secrets', 'exclusive'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most chronically online take', category: 'general', difficulty: 'medium', tags: ['internet', 'terminally-online'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The most unserious thing I take seriously', category: 'general', difficulty: 'medium', tags: ['funny', 'priorities'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My personality trait that is just trauma', category: 'general', difficulty: 'hard', tags: ['dark-humor', 'therapy'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Things I do that scream "millennial"', category: 'general', difficulty: 'easy', tags: ['generational', 'cringe'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My main character moment', category: 'general', difficulty: 'medium', tags: ['confidence', 'story'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The most delulu thing I believe', category: 'general', difficulty: 'medium', tags: ['delusional', 'funny'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My hot take that gets me cancelled', category: 'general', difficulty: 'hard', tags: ['controversial', 'brave'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Things I do when no one is watching', category: 'general', difficulty: 'medium', tags: ['embarrassing', 'honest'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My weirdest flex', category: 'general', difficulty: 'easy', tags: ['bragging', 'odd'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The most NPC thing I do daily', category: 'general', difficulty: 'medium', tags: ['gaming', 'routine'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My biggest ick in other people', category: 'general', difficulty: 'easy', tags: ['dating', 'pet-peeves'], status: 'active', isOfficial: true, isPremium: false },

  // POP CULTURE - 2026 Current (15 prompts)
  { text: 'The celebrity beef I am most invested in', category: 'pop-culture', difficulty: 'easy', tags: ['drama', 'celebrities'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most embarrassing parasocial relationship', category: 'pop-culture', difficulty: 'medium', tags: ['celebrities', 'obsession'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The TikTok sound living rent-free in my head', category: 'pop-culture', difficulty: 'easy', tags: ['tiktok', 'viral'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Celebrity I would defend with my life', category: 'pop-culture', difficulty: 'easy', tags: ['stan', 'loyalty'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The reality TV moment that changed me', category: 'pop-culture', difficulty: 'medium', tags: ['reality-tv', 'iconic'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most toxic fandom', category: 'pop-culture', difficulty: 'medium', tags: ['fandoms', 'obsessed'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The influencer drama I cannot stop following', category: 'pop-culture', difficulty: 'easy', tags: ['influencers', 'tea'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My comfort YouTuber', category: 'pop-culture', difficulty: 'easy', tags: ['youtube', 'comfort'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The podcast that radicalized me', category: 'pop-culture', difficulty: 'medium', tags: ['podcasts', 'opinions'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Celebrity couple I am manifesting', category: 'pop-culture', difficulty: 'easy', tags: ['shipping', 'celebrities'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The meme that defines my personality', category: 'pop-culture', difficulty: 'medium', tags: ['memes', 'identity'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most unhinged celebrity crush', category: 'pop-culture', difficulty: 'easy', tags: ['crushes', 'questionable'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The TV show I pretend not to watch', category: 'pop-culture', difficulty: 'medium', tags: ['guilty-pleasure', 'secret'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My Spotify Wrapped that I am hiding', category: 'pop-culture', difficulty: 'medium', tags: ['music', 'embarrassing'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The celebrity apology I am still waiting for', category: 'pop-culture', difficulty: 'hard', tags: ['drama', 'accountability'], status: 'active', isOfficial: true, isPremium: false },

  // TECHNOLOGY - 2026 Current (10 prompts)
  { text: 'My most embarrassing screen time app', category: 'technology', difficulty: 'easy', tags: ['phone-addiction', 'embarrassing'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The AI tool I am secretly addicted to', category: 'technology', difficulty: 'medium', tags: ['ai', 'current'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most unhinged Google search', category: 'technology', difficulty: 'medium', tags: ['search', 'weird'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The app I would delete if forced to choose one', category: 'technology', difficulty: 'easy', tags: ['apps', 'priorities'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My phone notification that gives me anxiety', category: 'technology', difficulty: 'easy', tags: ['anxiety', 'relatable'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The tech company I am beefing with', category: 'technology', difficulty: 'medium', tags: ['companies', 'beef'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most cursed algorithm', category: 'technology', difficulty: 'medium', tags: ['algorithm', 'for-you-page'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The subscription I forgot to cancel', category: 'technology', difficulty: 'easy', tags: ['money', 'regret'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most chaotic group chat', category: 'technology', difficulty: 'easy', tags: ['messaging', 'friends'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The tech trend I am too old for', category: 'technology', difficulty: 'medium', tags: ['aging', 'trends'], status: 'active', isOfficial: true, isPremium: false },

  // FOOD - Hip & Funny (10 prompts)
  { text: 'My most controversial food opinion', category: 'food', difficulty: 'medium', tags: ['opinions', 'hot-takes'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The food combo that makes people judge me', category: 'food', difficulty: 'easy', tags: ['weird', 'combinations'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My toxic relationship with a food', category: 'food', difficulty: 'medium', tags: ['addiction', 'funny'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The restaurant order that is my entire personality', category: 'food', difficulty: 'easy', tags: ['restaurants', 'identity'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'Food I will defend to the death', category: 'food', difficulty: 'medium', tags: ['passionate', 'loyalty'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most chaotic drunk food order', category: 'food', difficulty: 'medium', tags: ['drunk', 'wild'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The food trend I am gatekeeping', category: 'food', difficulty: 'medium', tags: ['trends', 'hipster'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My red flag food take', category: 'food', difficulty: 'hard', tags: ['controversial', 'opinions'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The food that is my love language', category: 'food', difficulty: 'easy', tags: ['romantic', 'comfort'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most unhinged food craving', category: 'food', difficulty: 'easy', tags: ['cravings', 'weird'], status: 'active', isOfficial: true, isPremium: false },

  // RELATIONSHIPS & DATING - Current (10 prompts)
  { text: 'My biggest dating app red flag', category: 'general', difficulty: 'easy', tags: ['dating', 'red-flags'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The text that would make me block someone', category: 'general', difficulty: 'medium', tags: ['texting', 'boundaries'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most toxic dating pattern', category: 'general', difficulty: 'hard', tags: ['dating', 'self-aware'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The ick that ended a situationship', category: 'general', difficulty: 'medium', tags: ['dating', 'ick'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My love language that is actually a trauma response', category: 'general', difficulty: 'hard', tags: ['therapy', 'dark-humor'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The dating advice I refuse to follow', category: 'general', difficulty: 'medium', tags: ['dating', 'stubborn'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most delusional relationship fantasy', category: 'general', difficulty: 'medium', tags: ['romance', 'delulu'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The emoji that gives me the ick', category: 'general', difficulty: 'easy', tags: ['texting', 'cringe'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My attachment style in one phrase', category: 'general', difficulty: 'hard', tags: ['psychology', 'dating'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The thing I do that screams "single"', category: 'general', difficulty: 'easy', tags: ['single-life', 'funny'], status: 'active', isOfficial: true, isPremium: false },

  // WORK & CAREER - Relatable (8 prompts)
  { text: 'My most unhinged work email', category: 'general', difficulty: 'medium', tags: ['work', 'corporate'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The coworker behavior that sends me', category: 'general', difficulty: 'easy', tags: ['work', 'annoying'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My toxic work trait', category: 'general', difficulty: 'medium', tags: ['work', 'self-aware'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The meeting that could have been an email', category: 'general', difficulty: 'easy', tags: ['work', 'relatable'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most chaotic Slack message', category: 'general', difficulty: 'medium', tags: ['work', 'messaging'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The job I am manifesting', category: 'general', difficulty: 'easy', tags: ['career', 'dreams'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My work persona vs real me', category: 'general', difficulty: 'medium', tags: ['work', 'personality'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The corporate buzzword I hate most', category: 'general', difficulty: 'easy', tags: ['work', 'jargon'], status: 'active', isOfficial: true, isPremium: false },

  // SOCIAL MEDIA - Current (7 prompts)
  { text: 'My most embarrassing finsta post', category: 'technology', difficulty: 'hard', tags: ['instagram', 'embarrassing'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The tweet I think about deleting daily', category: 'technology', difficulty: 'medium', tags: ['twitter', 'regret'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My BeReal that I faked', category: 'technology', difficulty: 'medium', tags: ['bereal', 'fake'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The Instagram story I posted for one person', category: 'technology', difficulty: 'hard', tags: ['instagram', 'petty'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most unhinged comment I left', category: 'technology', difficulty: 'medium', tags: ['comments', 'wild'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'The account I stalk but do not follow', category: 'technology', difficulty: 'medium', tags: ['stalking', 'sneaky'], status: 'active', isOfficial: true, isPremium: false },
  { text: 'My most toxic social media habit', category: 'technology', difficulty: 'medium', tags: ['addiction', 'toxic'], status: 'active', isOfficial: true, isPremium: false },
];

// Total: 90 hip, funny, clever prompts for 2026
