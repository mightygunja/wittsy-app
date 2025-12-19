import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  Timestamp,
  increment
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Room, RoomSettings, Player, Prompt } from '../types';
import { generateRoomCode } from '../utils/helpers';

// ==================== ROOM OPERATIONS ====================

/**
 * Create a new game room
 */
export const createRoom = async (
  hostId: string,
  hostUsername: string,
  roomName: string,
  settings: Partial<RoomSettings> = {}
): Promise<string> => {
  const defaultSettings: RoomSettings = {
    maxPlayers: 12,
    submissionTime: 25,
    votingTime: 10,
    winningScore: 10,
    promptPacks: ['default'],
    isPrivate: false,
    profanityFilter: 'medium',
    spectatorChatEnabled: true,
    allowJoinMidGame: false,
    ...settings
  };

  const roomCode = generateRoomCode();
  const roomData = {
    roomCode,
    name: roomName,
    hostId,
    status: 'waiting' as const,
    settings: defaultSettings,
    players: [{
      userId: hostId,
      username: hostUsername,
      isReady: false,
      isConnected: true,
      joinedAt: new Date().toISOString()
    }],
    spectators: [],
    currentRound: 0,
    currentPrompt: null,
    scores: { [hostId]: { roundWins: 0, totalVotes: 0, stars: 0, phrases: [] } },
    gameState: 'lobby' as const,
    createdAt: Timestamp.now(),
    startedAt: null
  };

  const docRef = await addDoc(collection(firestore, 'rooms'), roomData);
  return docRef.id;
};

/**
 * Get a room by ID
 */
export const getRoom = async (roomId: string): Promise<Room | null> => {
  const roomDoc = await getDoc(doc(firestore, 'rooms', roomId));
  if (!roomDoc.exists()) return null;
  
  return {
    roomId: roomDoc.id,
    ...roomDoc.data()
  } as Room;
};

/**
 * Get all active rooms (waiting or in progress)
 */
export const getActiveRooms = async (filters: {
  status?: 'waiting' | 'active';
  isPrivate?: boolean;
  maxResults?: number;
} = {}): Promise<Room[]> => {
  const constraints: QueryConstraint[] = [];
  
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  } else {
    constraints.push(where('status', 'in', ['waiting', 'active']));
  }
  
  if (filters.isPrivate !== undefined) {
    constraints.push(where('settings.isPrivate', '==', filters.isPrivate));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  
  if (filters.maxResults) {
    constraints.push(limit(filters.maxResults));
  }

  const q = query(collection(firestore, 'rooms'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    roomId: doc.id,
    ...doc.data()
  } as Room));
};

/**
 * Join a room as a player
 */
export const joinRoom = async (
  roomId: string,
  userId: string,
  username: string
): Promise<void> => {
  const roomRef = doc(firestore, 'rooms', roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists()) {
    throw new Error('Room not found');
  }
  
  const roomData = roomDoc.data();
  const players = roomData.players || [];
  
  if (players.length >= roomData.settings.maxPlayers) {
    throw new Error('Room is full');
  }
  
  if (players.find((p: Player) => p.userId === userId)) {
    throw new Error('Already in room');
  }
  
  const newPlayer = {
    userId,
    username,
    isReady: false,
    isConnected: true,
    joinedAt: new Date().toISOString()
  };
  
  await updateDoc(roomRef, {
    players: [...players, newPlayer],
    [`scores.${userId}`]: { roundWins: 0, totalVotes: 0, stars: 0, phrases: [] }
  });
};

/**
 * Leave a room
 */
export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
  const roomRef = doc(firestore, 'rooms', roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists()) return;
  
  const roomData = roomDoc.data();
  const players = roomData.players || [];
  const updatedPlayers = players.filter((p: Player) => p.userId !== userId);
  
  // If host leaves and there are other players, assign new host
  if (roomData.hostId === userId && updatedPlayers.length > 0) {
    await updateDoc(roomRef, {
      players: updatedPlayers,
      hostId: updatedPlayers[0].userId
    });
  } else if (updatedPlayers.length === 0) {
    // Delete room if no players left
    await deleteDoc(roomRef);
  } else {
    await updateDoc(roomRef, {
      players: updatedPlayers
    });
  }
};

/**
 * Update room settings (host only)
 */
export const updateRoomSettings = async (
  roomId: string,
  settings: Partial<RoomSettings>
): Promise<void> => {
  const roomRef = doc(firestore, 'rooms', roomId);
  await updateDoc(roomRef, {
    settings
  });
};

/**
 * Start the game
 */
export const startGame = async (roomId: string): Promise<void> => {
  const roomRef = doc(firestore, 'rooms', roomId);
  const prompt = await getRandomPrompt();
  
  await updateDoc(roomRef, {
    status: 'active',
    gameState: 'submission',
    currentRound: 1,
    currentPrompt: prompt,
    startedAt: Timestamp.now()
  });
};

/**
 * Update player ready status
 */
export const setPlayerReady = async (
  roomId: string,
  userId: string,
  isReady: boolean
): Promise<void> => {
  const roomRef = doc(firestore, 'rooms', roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists()) return;
  
  const roomData = roomDoc.data();
  const players = roomData.players || [];
  const updatedPlayers = players.map((p: Player) => 
    p.userId === userId ? { ...p, isReady } : p
  );
  
  await updateDoc(roomRef, {
    players: updatedPlayers
  });
};

// ==================== PROMPT OPERATIONS ====================

/**
 * Get a random prompt from the database
 */
export const getRandomPrompt = async (category?: string): Promise<Prompt | null> => {
  const constraints: QueryConstraint[] = [
    where('isActive', '==', true)
  ];
  
  if (category) {
    constraints.push(where('category', '==', category));
  }
  
  const q = query(collection(firestore, 'prompts'), ...constraints);
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const randomIndex = Math.floor(Math.random() * snapshot.docs.length);
  const doc = snapshot.docs[randomIndex];
  
  return {
    id: doc.id,
    ...doc.data()
  } as Prompt;
};

/**
 * Get all prompts (with optional filters)
 */
export const getPrompts = async (filters: {
  category?: string;
  difficulty?: string;
  pack?: string;
  limit?: number;
} = {}): Promise<Prompt[]> => {
  const constraints: QueryConstraint[] = [
    where('isActive', '==', true)
  ];
  
  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }
  
  if (filters.difficulty) {
    constraints.push(where('difficulty', '==', filters.difficulty));
  }
  
  if (filters.pack) {
    constraints.push(where('pack', '==', filters.pack));
  }
  
  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }
  
  const q = query(collection(firestore, 'prompts'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Prompt));
};

// ==================== USER PROFILE OPERATIONS ====================

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string): Promise<DocumentData | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  if (!userDoc.exists()) return null;
  return userDoc.data();
};

/**
 * Update user stats after a game
 */
export const updateUserStats = async (
  userId: string,
  stats: {
    gamesPlayed?: number;
    gamesWon?: number;
    roundsWon?: number;
    starsEarned?: number;
    totalVotes?: number;
  }
): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const updates: any = {
    lastActive: Timestamp.now()
  };
  
  if (stats.gamesPlayed) {
    updates['stats.gamesPlayed'] = increment(stats.gamesPlayed);
  }
  if (stats.gamesWon) {
    updates['stats.gamesWon'] = increment(stats.gamesWon);
  }
  if (stats.roundsWon) {
    updates['stats.roundsWon'] = increment(stats.roundsWon);
  }
  if (stats.starsEarned) {
    updates['stats.starsEarned'] = increment(stats.starsEarned);
  }
  if (stats.totalVotes) {
    updates['stats.totalVotes'] = increment(stats.totalVotes);
  }
  
  await updateDoc(userRef, updates);
};

/**
 * Update user XP and level
 */
export const addUserXP = async (userId: string, xpAmount: number): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    xp: increment(xpAmount)
  });
};

// ==================== LEADERBOARD OPERATIONS ====================

/**
 * Get global leaderboard
 */
export const getLeaderboard = async (
  sortBy: 'rating' | 'wins' | 'stars' = 'rating',
  maxResults: number = 100
): Promise<any[]> => {
  let orderByField = 'rating';
  
  switch (sortBy) {
    case 'wins':
      orderByField = 'stats.gamesWon';
      break;
    case 'stars':
      orderByField = 'stats.starsEarned';
      break;
  }
  
  const q = query(
    collection(firestore, 'users'),
    orderBy(orderByField, 'desc'),
    limit(maxResults)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    userId: doc.id,
    ...doc.data()
  }));
};

// ==================== MATCH HISTORY OPERATIONS ====================

/**
 * Save completed match to history
 */
export const saveMatchHistory = async (roomData: Room): Promise<void> => {
  const matchData = {
    roomName: roomData.name,
    players: roomData.players,
    scores: roomData.scores,
    totalRounds: roomData.currentRound,
    winner: Object.entries(roomData.scores)
      .sort(([, a], [, b]) => (b as any).roundWins - (a as any).roundWins)[0]?.[0],
    duration: roomData.startedAt 
      ? Date.now() - (roomData.startedAt as any).toDate().getTime()
      : 0,
    createdAt: Timestamp.now()
  };
  
  await addDoc(collection(firestore, 'matches'), matchData);
};

/**
 * Get user's match history
 */
export const getUserMatches = async (
  userId: string,
  maxResults: number = 20
): Promise<any[]> => {
  const q = query(
    collection(firestore, 'matches'),
    where('players', 'array-contains', { userId }),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    matchId: doc.id,
    ...doc.data()
  }));
};

// Update advanced user stats
export const updateAdvancedStats = async (
  userId: string,
  updates: Partial<{
    currentStreak: number;
    bestStreak: number;
    longestPhraseLength: number;
    shortestWinningPhraseLength: number;
    comebackWins: number;
    closeCallWins: number;
    unanimousVotes: number;
    perfectGames: number;
  }>
): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const currentStats = userDoc.data().stats || {};
  const updatedStats = {
    ...currentStats,
    ...updates
  };
  
  await updateDoc(userRef, {
    stats: updatedStats
  });
};

// Track phrase submission
export const trackPhraseStats = async (
  userId: string,
  phraseLength: number,
  isWinner: boolean,
  voteCount: number,
  totalPlayers: number
): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const currentStats = userDoc.data().stats || {};
  const updates: any = {};
  
  // Track longest phrase
  if (phraseLength > (currentStats.longestPhraseLength || 0)) {
    updates.longestPhraseLength = phraseLength;
  }
  
  // Track shortest winning phrase
  if (isWinner) {
    if (!currentStats.shortestWinningPhraseLength || 
        phraseLength < currentStats.shortestWinningPhraseLength) {
      updates.shortestWinningPhraseLength = phraseLength;
    }
    
    // Track unanimous votes (all players voted for this phrase)
    if (voteCount === totalPlayers - 1) {
      updates.unanimousVotes = (currentStats.unanimousVotes || 0) + 1;
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await updateAdvancedStats(userId, updates);
  }
};

// Track game result with advanced stats
export const trackGameResult = async (
  userId: string,
  won: boolean,
  _finalScore: { player: number; opponent: number },
  wasPerfectGame: boolean,
  wasComeback: boolean,
  wasCloseCall: boolean
): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const currentStats = userDoc.data().stats || {};
  const updates: any = {};
  
  if (won) {
    // Update streak
    const newStreak = (currentStats.currentStreak || 0) + 1;
    updates.currentStreak = newStreak;
    
    if (newStreak > (currentStats.bestStreak || 0)) {
      updates.bestStreak = newStreak;
    }
    
    // Track perfect games
    if (wasPerfectGame) {
      updates.perfectGames = (currentStats.perfectGames || 0) + 1;
    }
    
    // Track comeback wins (opponent was ahead by 5+)
    if (wasComeback) {
      updates.comebackWins = (currentStats.comebackWins || 0) + 1;
    }
    
    // Track close call wins (won by 1-2 rounds)
    if (wasCloseCall) {
      updates.closeCallWins = (currentStats.closeCallWins || 0) + 1;
    }
  } else {
    // Reset streak on loss
    updates.currentStreak = 0;
  }
  
  if (Object.keys(updates).length > 0) {
    await updateAdvancedStats(userId, updates);
  }
};
