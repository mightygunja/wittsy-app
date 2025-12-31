import { firestore } from './firebase';
import { doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { awardXP, XP_VALUES } from './progression';
import { checkAchievements } from './achievements';

/**
 * Game Completion Service
 * Handles end-of-game logic: XP awards, stat updates, achievements, match history
 */

interface GameResult {
  roomId: string;
  roomName: string;
  winnerId: string;
  winnerUsername: string;
  players: Array<{
    userId: string;
    username: string;
    score: number;
    stars: number;
    totalVotes: number;
    roundsWon: number;
    bestPhrase?: string;
  }>;
  totalRounds: number;
  playerCount: number;
}

/**
 * Process game completion for all players
 */
export const processGameCompletion = async (gameResult: GameResult): Promise<void> => {
  const { roomId, roomName, winnerId, players, totalRounds, playerCount } = gameResult;

  for (const player of players) {
    try {
      await processPlayerGameResult(
        player.userId,
        player.username,
        winnerId === player.userId,
        player.score,
        player.stars,
        player.totalVotes,
        player.roundsWon,
        roomId,
        roomName,
        playerCount,
        player.bestPhrase
      );
    } catch (error) {
      console.error(`Error processing game result for player ${player.userId}:`, error);
    }
  }
};

/**
 * Process individual player's game result
 */
const processPlayerGameResult = async (
  userId: string,
  username: string,
  won: boolean,
  score: number,
  stars: number,
  totalVotes: number,
  roundsWon: number,
  roomId: string,
  roomName: string,
  playerCount: number,
  bestPhrase?: string
): Promise<void> => {
  // Calculate XP
  let xpEarned = 0;
  
  // Base XP for participation
  xpEarned += XP_VALUES.ROUND_PARTICIPATION * roundsWon;
  
  // XP for round wins
  xpEarned += XP_VALUES.ROUND_WIN * roundsWon;
  
  // XP for game win
  if (won) {
    xpEarned += XP_VALUES.GAME_WIN;
  }
  
  // XP for stars
  xpEarned += XP_VALUES.STAR_ACHIEVEMENT * stars;
  
  // Award XP
  const xpResult = await awardXP(userId, xpEarned, `Game completion: ${roomName}`);
  
  // Update user stats
  await updateUserStats(userId, {
    gamesPlayed: 1,
    gamesWon: won ? 1 : 0,
    roundsWon,
    starsEarned: stars,
    totalVotes,
    currentStreak: won ? 1 : -1, // Will be handled properly in updateUserStats
  });
  
  // Save match to history
  await saveMatchHistory(userId, {
    roomId,
    roomName,
    won,
    score,
    stars,
    totalVotes,
    roundsWon,
    playerCount,
    bestPhrase,
    xpEarned,
    leveledUp: xpResult.leveledUp,
    playedAt: new Date(),
  });
  
  // Check for achievements
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userStats = userDoc.data().stats;
    await checkAchievements(userId, userStats);
  }
};

/**
 * Update user statistics
 */
const updateUserStats = async (
  userId: string,
  updates: {
    gamesPlayed?: number;
    gamesWon?: number;
    roundsWon?: number;
    starsEarned?: number;
    totalVotes?: number;
    currentStreak?: number;
  }
): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const currentStats = userDoc.data().stats || {};
  
  // Handle streak logic
  let newStreak = currentStats.currentStreak || 0;
  if (updates.currentStreak !== undefined) {
    if (updates.currentStreak === 1) {
      newStreak = (currentStats.currentStreak || 0) + 1;
    } else if (updates.currentStreak === -1) {
      newStreak = 0;
    }
  }
  
  const bestStreak = Math.max(currentStats.bestStreak || 0, newStreak);
  
  // Calculate new stats
  const newStats = {
    gamesPlayed: (currentStats.gamesPlayed || 0) + (updates.gamesPlayed || 0),
    gamesWon: (currentStats.gamesWon || 0) + (updates.gamesWon || 0),
    roundsWon: (currentStats.roundsWon || 0) + (updates.roundsWon || 0),
    starsEarned: (currentStats.starsEarned || 0) + (updates.starsEarned || 0),
    totalVotes: (currentStats.totalVotes || 0) + (updates.totalVotes || 0),
    currentStreak: newStreak,
    bestStreak,
    // Preserve other stats
    averageVotes: currentStats.averageVotes || 0,
    votingAccuracy: currentStats.votingAccuracy || 0,
    submissionRate: currentStats.submissionRate || 100,
    longestPhraseLength: currentStats.longestPhraseLength || 0,
    shortestWinningPhraseLength: currentStats.shortestWinningPhraseLength || 0,
    comebackWins: currentStats.comebackWins || 0,
    closeCallWins: currentStats.closeCallWins || 0,
    unanimousVotes: currentStats.unanimousVotes || 0,
    perfectGames: currentStats.perfectGames || 0,
  };
  
  // Calculate average votes
  if (newStats.roundsWon > 0) {
    newStats.averageVotes = newStats.totalVotes / newStats.roundsWon;
  }
  
  await updateDoc(userRef, {
    stats: newStats,
    lastActive: new Date().toISOString(),
  });
};

/**
 * Save match to user's history
 */
const saveMatchHistory = async (
  userId: string,
  matchData: {
    roomId: string;
    roomName: string;
    won: boolean;
    score: number;
    stars: number;
    totalVotes: number;
    roundsWon: number;
    playerCount: number;
    bestPhrase?: string;
    xpEarned: number;
    leveledUp: boolean;
    playedAt: Date;
  }
): Promise<void> => {
  const matchId = `${userId}_${matchData.roomId}_${Date.now()}`;
  const matchRef = doc(firestore, 'matches', matchId);
  
  await setDoc(matchRef, {
    userId,
    ...matchData,
    createdAt: matchData.playedAt.toISOString(),
  });
};

/**
 * Award XP for specific actions during gameplay
 */
export const awardActionXP = async (
  userId: string,
  action: 'vote' | 'star' | 'perfect_game' | 'comeback' | 'unanimous'
): Promise<void> => {
  let xp = 0;
  let reason = '';
  
  switch (action) {
    case 'vote':
      xp = XP_VALUES.VOTING_PARTICIPATION;
      reason = 'Voting participation';
      break;
    case 'star':
      xp = XP_VALUES.STAR_ACHIEVEMENT;
      reason = 'Star achievement (4+ votes)';
      break;
    case 'perfect_game':
      xp = XP_VALUES.PERFECT_GAME;
      reason = 'Perfect game bonus';
      break;
    case 'comeback':
      xp = XP_VALUES.COMEBACK_WIN;
      reason = 'Comeback win bonus';
      break;
    case 'unanimous':
      xp = XP_VALUES.UNANIMOUS_VOTE;
      reason = 'Unanimous vote bonus';
      break;
  }
  
  if (xp > 0) {
    await awardXP(userId, xp, reason);
  }
};
