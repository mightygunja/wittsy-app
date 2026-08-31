/**
 * Chat Service
 * In-game chat, quick chat, emotes, and reactions
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, push, set, onValue, query as rtQuery, orderByChild, limitToLast } from 'firebase/database';
import { firestore, realtimeDb } from './firebase';
import { ChatMessage, QuickChatOption, Emote, Reaction } from '../types/social';

// ==================== CHAT MESSAGES ====================

/**
 * Send a chat message
 */
export const sendChatMessage = async (
  roomId: string,
  userId: string,
  username: string,
  content: string,
  type: 'text' | 'emote' = 'text',
  replyTo?: string
): Promise<string> => {
  const messageData = {
    roomId,
    userId,
    username,
    type,
    // Mask slurs/explicit terms before the message ever reaches other players
    content: type === 'text' ? filterProfanity(content) : content,
    timestamp: Date.now(),
    replyTo: replyTo || null,
    reactions: {},
  };

  const messagesRef = ref(realtimeDb, `chat/${roomId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, messageData);

  return newMessageRef.key!;
};

/**
 * Send quick chat message
 */
export const sendQuickChat = async (
  roomId: string,
  userId: string,
  username: string,
  quickChatId: string
): Promise<string> => {
  const quickChatOption = QUICK_CHAT_OPTIONS.find(opt => opt.id === quickChatId);
  if (!quickChatOption) {
    throw new Error('Quick chat option not found');
  }

  return sendChatMessage(
    roomId,
    userId,
    username,
    `${quickChatOption.emoji} ${quickChatOption.text}`,
    'emote'
  );
};

/**
 * Send emote
 */
export const sendEmote = async (
  roomId: string,
  userId: string,
  username: string,
  emoteId: string
): Promise<string> => {
  console.log('😊 Sending emote:', { roomId, userId, username, emoteId });
  const emote = EMOTES.find(e => e.id === emoteId);
  if (!emote) {
    console.error('❌ Emote not found:', emoteId);
    throw new Error('Emote not found');
  }

  console.log('✅ Found emote:', emote);
  const messageId = await sendChatMessage(
    roomId,
    userId,
    username,
    emote.emoji,
    'emote'
  );
  console.log('✅ Emote message sent with ID:', messageId);
  return messageId;
};

/**
 * Add reaction to message
 */
export const addReaction = async (
  roomId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  const messageRef = ref(realtimeDb, `chat/${roomId}/messages/${messageId}`);
  
  // Get current reactions
  const snapshot = await new Promise<any>((resolve) => {
    onValue(messageRef, (snap) => resolve(snap.val()), { onlyOnce: true });
  });

  const reactions = snapshot.reactions || {};
  const userReactions = reactions[emoji] || [];

  if (!userReactions.includes(userId)) {
    userReactions.push(userId);
    reactions[emoji] = userReactions;

    await set(ref(realtimeDb, `chat/${roomId}/messages/${messageId}/reactions`), reactions);
  }
};

/**
 * Remove reaction from message
 */
export const removeReaction = async (
  roomId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  const messageRef = ref(realtimeDb, `chat/${roomId}/messages/${messageId}`);
  
  const snapshot = await new Promise<any>((resolve) => {
    onValue(messageRef, (snap) => resolve(snap.val()), { onlyOnce: true });
  });

  const reactions = snapshot.reactions || {};
  const userReactions = reactions[emoji] || [];

  const index = userReactions.indexOf(userId);
  if (index > -1) {
    userReactions.splice(index, 1);
    
    if (userReactions.length === 0) {
      delete reactions[emoji];
    } else {
      reactions[emoji] = userReactions;
    }

    await set(ref(realtimeDb, `chat/${roomId}/messages/${messageId}/reactions`), reactions);
  }
};

/**
 * Subscribe to chat messages
 */
export const subscribeToChatMessages = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
  messageLimit: number = 50
): (() => void) => {
  console.log('💬 Subscribing to chat messages for room:', roomId);
  const messagesRef = ref(realtimeDb, `chat/${roomId}/messages`);
  const messagesQuery = rtQuery(messagesRef, orderByChild('timestamp'), limitToLast(messageLimit));

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        id: childSnapshot.key!,
        ...childSnapshot.val(),
        timestamp: new Date(childSnapshot.val().timestamp).toISOString(),
      });
    });
    console.log('📨 Received chat messages:', messages.length);
    callback(messages);
  });

  return unsubscribe;
};

/**
 * Clear chat for room
 */
export const clearRoomChat = async (roomId: string): Promise<void> => {
  const messagesRef = ref(realtimeDb, `chat/${roomId}/messages`);
  await set(messagesRef, null);
};

/**
 * Send system message
 */
export const sendSystemMessage = async (
  roomId: string,
  content: string
): Promise<string> => {
  const messageData = {
    roomId,
    userId: 'system',
    username: 'System',
    type: 'system',
    content,
    timestamp: Date.now(),
    reactions: {},
  };

  const messagesRef = ref(realtimeDb, `chat/${roomId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, messageData);

  return newMessageRef.key!;
};

// ==================== QUICK CHAT OPTIONS ====================

export const QUICK_CHAT_OPTIONS: QuickChatOption[] = [
  // Greetings
  { id: 'hello', text: 'Hello!', emoji: '👋', category: 'greeting' },
  { id: 'hi', text: 'Hi there!', emoji: '😊', category: 'greeting' },
  { id: 'glhf', text: 'Good luck, have fun!', emoji: '🎮', category: 'greeting' },
  { id: 'gg', text: 'Good game!', emoji: '🎯', category: 'greeting' },
  
  // Reactions
  { id: 'nice', text: 'Nice one!', emoji: '👍', category: 'reaction' },
  { id: 'wow', text: 'Wow!', emoji: '😮', category: 'reaction' },
  { id: 'lol', text: 'LOL', emoji: '😂', category: 'reaction' },
  { id: 'omg', text: 'OMG!', emoji: '😱', category: 'reaction' },
  { id: 'genius', text: 'Genius!', emoji: '🧠', category: 'reaction' },
  { id: 'fire', text: 'Fire!', emoji: '🔥', category: 'reaction' },
  
  // Strategy
  { id: 'thinking', text: 'Thinking...', emoji: '🤔', category: 'strategy' },
  { id: 'hurry', text: 'Hurry up!', emoji: '⏰', category: 'strategy' },
  { id: 'wait', text: 'Wait for me!', emoji: '⏸️', category: 'strategy' },
  { id: 'ready', text: "I'm ready!", emoji: '✅', category: 'strategy' },
  
  // Emotions
  { id: 'happy', text: "I'm happy!", emoji: '😄', category: 'emotion' },
  { id: 'sad', text: 'Aww...', emoji: '😢', category: 'emotion' },
  { id: 'angry', text: 'Argh!', emoji: '😠', category: 'emotion' },
  { id: 'love', text: 'Love it!', emoji: '❤️', category: 'emotion' },
  { id: 'confused', text: 'Confused...', emoji: '😕', category: 'emotion' },
  { id: 'celebrate', text: 'Celebrate!', emoji: '🎉', category: 'emotion' },
];

// ==================== EMOTES ====================

export const EMOTES: Emote[] = [
  // Basic emotes (free)
  { id: 'wave', name: 'Wave', emoji: '👋' },
  { id: 'thumbsup', name: 'Thumbs Up', emoji: '👍' },
  { id: 'thumbsdown', name: 'Thumbs Down', emoji: '👎' },
  { id: 'clap', name: 'Clap', emoji: '👏' },
  { id: 'fire', name: 'Fire', emoji: '🔥' },
  { id: 'star', name: 'Star', emoji: '⭐' },
  { id: 'heart', name: 'Heart', emoji: '❤️' },
  { id: 'laugh', name: 'Laugh', emoji: '😂' },
  { id: 'cry', name: 'Cry', emoji: '😭' },
  { id: 'cool', name: 'Cool', emoji: '😎' },
  
  // Premium emotes
  { id: 'crown', name: 'Crown', emoji: '👑', premium: true },
  { id: 'trophy', name: 'Trophy', emoji: '🏆', premium: true },
  { id: 'diamond', name: 'Diamond', emoji: '💎', premium: true },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', premium: true },
  { id: 'lightning', name: 'Lightning', emoji: '⚡', premium: true },
  
  // Unlockable emotes
  { id: 'brain', name: 'Big Brain', emoji: '🧠', unlockCondition: 'Win 10 games' },
  { id: 'ninja', name: 'Ninja', emoji: '🥷', unlockCondition: 'Reach Gold rank' },
  { id: 'wizard', name: 'Wizard', emoji: '🧙', unlockCondition: 'Get 100 stars' },
  { id: 'alien', name: 'Alien', emoji: '👽', unlockCondition: 'Complete 50 challenges' },
];

// ==================== REACTIONS ====================

export const REACTIONS: Reaction[] = [
  { emoji: '👍', name: 'Like' },
  { emoji: '❤️', name: 'Love' },
  { emoji: '😂', name: 'Laugh' },
  { emoji: '😮', name: 'Wow' },
  { emoji: '😢', name: 'Sad' },
  { emoji: '😠', name: 'Angry' },
  { emoji: '🔥', name: 'Fire' },
  { emoji: '⭐', name: 'Star' },
  { emoji: '🎯', name: 'Bullseye' },
  { emoji: '💯', name: 'Perfect' },
];

// ==================== CHAT FILTERS ====================

/**
 * Filter profanity from message.
 * Masks slurs and explicit terms (word-boundary, case-insensitive, common
 * leetspeak collapsed). Mirrors the word list in functions/contentFilter.js —
 * the server list remains the gate for public surfaces (starred gallery);
 * this masks in-room chat, which previously had NO live moderation at all.
 */
const BLOCKED_WORDS = [
  'anal', 'anus', 'blowjob', 'boner', 'clit', 'cock', 'cum', 'cunt',
  'dick', 'dildo', 'ejaculate', 'erection', 'fap', 'fellatio', 'handjob',
  'horny', 'jerkoff', 'jizz', 'masturbate', 'milf', 'orgasm', 'penis',
  'porn', 'porno', 'pussy', 'rimjob', 'semen', 'slut',
  'tits', 'titties', 'vagina', 'wank', 'whore',
  'fag', 'faggot', 'kike', 'nigga', 'nigger', 'retard', 'retarded',
  'spic', 'tranny',
  'motherfucker',
  'rape', 'rapist', 'kys',
  'hoer', 'kanker', 'neuken', 'ficken',
];

const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i',
};

const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/[0134578@$!]/g, (c) => LEET_MAP[c] || c).replace(/[^a-z]/g, '');

const BLOCKED_SET = new Set(BLOCKED_WORDS);

export const filterProfanity = (message: string): string => {
  return message
    .split(/(\s+)/)
    .map(token => {
      if (/^\s+$/.test(token)) return token;
      return BLOCKED_SET.has(normalizeWord(token)) ? '*'.repeat(token.length) : token;
    })
    .join('');
};

/**
 * Check if message is spam
 */
export const isSpam = (
  message: string,
  recentMessages: ChatMessage[],
  userId: string
): boolean => {
  // Check for repeated messages
  const userRecentMessages = recentMessages
    .filter(msg => msg.userId === userId)
    .slice(-5);
  
  const duplicateCount = userRecentMessages.filter(msg => msg.content === message).length;
  if (duplicateCount >= 3) return true;
  
  // Check for rapid messaging
  const now = Date.now();
  const messagesInLastMinute = userRecentMessages.filter(
    msg => now - new Date(msg.timestamp).getTime() < 60000
  ).length;
  
  if (messagesInLastMinute >= 10) return true;
  
  return false;
};

/**
 * Get chat statistics
 */
export const getChatStats = (messages: ChatMessage[]): {
  totalMessages: number;
  uniqueUsers: number;
  mostActiveUser: string;
  mostUsedEmoji: string;
} => {
  const userMessageCounts: { [userId: string]: number } = {};
  const emojiCounts: { [emoji: string]: number } = {};
  
  messages.forEach(msg => {
    userMessageCounts[msg.userId] = (userMessageCounts[msg.userId] || 0) + 1;
    
    // Count emojis in reactions
    if (msg.reactions) {
      Object.keys(msg.reactions).forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + msg.reactions![emoji].length;
      });
    }
  });
  
  const mostActiveUser = Object.entries(userMessageCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
  
  const mostUsedEmoji = Object.entries(emojiCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
  
  return {
    totalMessages: messages.length,
    uniqueUsers: Object.keys(userMessageCounts).length,
    mostActiveUser,
    mostUsedEmoji,
  };
};
