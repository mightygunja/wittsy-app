/**
 * ELO Rating Service
 * Professional rating system based on Glicko-2 and modern competitive games
 * Used by Chess.com, League of Legends, Overwatch, etc.
 */

import { doc, updateDoc, addDoc, collection, getDoc, increment } from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';

// Rating constants based on industry standards
export const RATING_CONSTANTS = {
  // Starting rating for new players
  INITIAL_RATING: 1200,
  
  // K-factor determines how much ratings change per game
  // Higher K = more volatile ratings
  K_FACTOR_NEW: 40,        // First 30 games (provisional)
  K_FACTOR_NORMAL: 24,     // Standard players
  K_FACTOR_HIGH: 16,       // High-rated players (2000+)
  K_FACTOR_MASTER: 12,     // Master tier (2400+)
  
  // Provisional period
  PROVISIONAL_GAMES: 30,
  
  // Rating floors and ceilings
  MIN_RATING: 100,
  MAX_RATING: 3000,
  
  // Rating tiers (for K-factor adjustment)
  HIGH_RATING_THRESHOLD: 2000,
  MASTER_RATING_THRESHOLD: 2400,
  
  // Bonus for winning streaks
  WIN_STREAK_BONUS: 2,
  MAX_STREAK_BONUS: 10,
  
  // Rating deviation (uncertainty)
  INITIAL_RD: 350,
  MIN_RD: 50,
  MAX_RD: 350,
  RD_DECAY_PER_DAY: 1, // RD increases over time without playing
};

export interface RatingUpdate {
  oldRating: number;
  newRating: number;
  ratingChange: number;
  expectedScore: number;
  actualScore: number;
  kFactor: number;
  gamesPlayed: number;
  winStreak: number;
  lossStreak: number;
}

export interface PlayerRatingData {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
  peakRating: number;
  ratingDeviation: number;
  lastGameDate: string;
}

/**
 * Calculate expected score using ELO formula
 * Returns probability of player A winning against player B
 */
const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Get K-factor based on player's rating and experience
 */
const getKFactor = (rating: number, gamesPlayed: number): number => {
  // Provisional period - higher K for faster calibration
  if (gamesPlayed < RATING_CONSTANTS.PROVISIONAL_GAMES) {
    return RATING_CONSTANTS.K_FACTOR_NEW;
  }
  
  // Master tier - lower K for stability
  if (rating >= RATING_CONSTANTS.MASTER_RATING_THRESHOLD) {
    return RATING_CONSTANTS.K_FACTOR_MASTER;
  }
  
  // High rating - reduced K
  if (rating >= RATING_CONSTANTS.HIGH_RATING_THRESHOLD) {
    return RATING_CONSTANTS.K_FACTOR_HIGH;
  }
  
  // Normal K-factor
  return RATING_CONSTANTS.K_FACTOR_NORMAL;
};

/**
 * Calculate win streak bonus
 */
const getStreakBonus = (winStreak: number): number => {
  if (winStreak < 3) return 0;
  
  const bonus = (winStreak - 2) * RATING_CONSTANTS.WIN_STREAK_BONUS;
  return Math.min(bonus, RATING_CONSTANTS.MAX_STREAK_BONUS);
};

/**
 * Update rating deviation based on time since last game
 */
const updateRatingDeviation = (
  currentRD: number,
  lastGameDate: string
): number => {
  const daysSinceLastGame = Math.floor(
    (Date.now() - new Date(lastGameDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const newRD = Math.min(
    currentRD + (daysSinceLastGame * RATING_CONSTANTS.RD_DECAY_PER_DAY),
    RATING_CONSTANTS.MAX_RD
  );
  
  return newRD;
};

/**
 * Calculate new rating after a game
 */
export const calculateNewRating = (
  playerRating: number,
  opponentRating: number,
  playerWon: boolean,
  gamesPlayed: number,
  winStreak: number = 0
): RatingUpdate => {
  // Calculate expected score (probability of winning)
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  
  // Actual score (1 for win, 0 for loss)
  const actualScore = playerWon ? 1 : 0;
  
  // Get K-factor
  const kFactor = getKFactor(playerRating, gamesPlayed);
  
  // Calculate base rating change
  let ratingChange = kFactor * (actualScore - expectedScore);
  
  // Add win streak bonus
  if (playerWon && winStreak >= 3) {
    const streakBonus = getStreakBonus(winStreak);
    ratingChange += streakBonus;
  }
  
  // Round to nearest integer
  ratingChange = Math.round(ratingChange);
  
  // Calculate new rating
  let newRating = playerRating + ratingChange;
  
  // Enforce rating bounds
  newRating = Math.max(RATING_CONSTANTS.MIN_RATING, newRating);
  newRating = Math.min(RATING_CONSTANTS.MAX_RATING, newRating);
  
  return {
    oldRating: playerRating,
    newRating,
    ratingChange,
    expectedScore,
    actualScore,
    kFactor,
    gamesPlayed: gamesPlayed + 1,
    winStreak: playerWon ? winStreak + 1 : 0,
    lossStreak: playerWon ? 0 : (winStreak > 0 ? 1 : winStreak + 1),
  };
};

/**
 * Get player's rating data
 */
export const getPlayerRatingData = async (userId: string): Promise<PlayerRatingData> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    return {
      rating: userData.rating || RATING_CONSTANTS.INITIAL_RATING,
      gamesPlayed: userData.gamesPlayed || 0,
      wins: userData.gamesWon || 0,
      losses: userData.gamesLost || 0,
      winStreak: userData.winStreak || 0,
      lossStreak: userData.lossStreak || 0,
      peakRating: userData.peakRating || RATING_CONSTANTS.INITIAL_RATING,
      ratingDeviation: userData.ratingDeviation || RATING_CONSTANTS.INITIAL_RD,
      lastGameDate: userData.lastGameDate || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get player rating data:', error);
    throw error;
  }
};

/**
 * Update player rating after a game
 */
export const updatePlayerRating = async (
  winnerId: string,
  loserId: string
): Promise<{ winner: RatingUpdate; loser: RatingUpdate }> => {
  try {
    // Get both players' rating data
    const [winnerData, loserData] = await Promise.all([
      getPlayerRatingData(winnerId),
      getPlayerRatingData(loserId),
    ]);
    
    // Update rating deviation based on inactivity
    const winnerRD = updateRatingDeviation(winnerData.ratingDeviation, winnerData.lastGameDate);
    const loserRD = updateRatingDeviation(loserData.ratingDeviation, loserData.lastGameDate);
    
    // Calculate new ratings
    const winnerUpdate = calculateNewRating(
      winnerData.rating,
      loserData.rating,
      true,
      winnerData.gamesPlayed,
      winnerData.winStreak
    );
    
    const loserUpdate = calculateNewRating(
      loserData.rating,
      winnerData.rating,
      false,
      loserData.gamesPlayed,
      loserData.lossStreak
    );
    
    // Update winner's data
    const winnerRef = doc(firestore, 'users', winnerId);
    await updateDoc(winnerRef, {
      rating: winnerUpdate.newRating,
      gamesPlayed: increment(1),
      gamesWon: increment(1),
      winStreak: winnerUpdate.winStreak,
      lossStreak: 0,
      peakRating: Math.max(winnerData.peakRating, winnerUpdate.newRating),
      ratingDeviation: Math.max(winnerRD - 10, RATING_CONSTANTS.MIN_RD),
      lastGameDate: new Date().toISOString(),
    });
    
    // Update loser's data
    const loserRef = doc(firestore, 'users', loserId);
    await updateDoc(loserRef, {
      rating: loserUpdate.newRating,
      gamesPlayed: increment(1),
      gamesLost: increment(1),
      winStreak: 0,
      lossStreak: loserUpdate.lossStreak,
      ratingDeviation: Math.max(loserRD - 10, RATING_CONSTANTS.MIN_RD),
      lastGameDate: new Date().toISOString(),
    });
    
    // Record rating history
    await Promise.all([
      addDoc(collection(firestore, 'ratingHistory'), {
        userId: winnerId,
        oldRating: winnerUpdate.oldRating,
        newRating: winnerUpdate.newRating,
        ratingChange: winnerUpdate.ratingChange,
        result: 'win',
        opponentId: loserId,
        opponentRating: loserData.rating,
        kFactor: winnerUpdate.kFactor,
        expectedScore: winnerUpdate.expectedScore,
        timestamp: new Date().toISOString(),
      }),
      addDoc(collection(firestore, 'ratingHistory'), {
        userId: loserId,
        oldRating: loserUpdate.oldRating,
        newRating: loserUpdate.newRating,
        ratingChange: loserUpdate.ratingChange,
        result: 'loss',
        opponentId: winnerId,
        opponentRating: winnerData.rating,
        kFactor: loserUpdate.kFactor,
        expectedScore: loserUpdate.expectedScore,
        timestamp: new Date().toISOString(),
      }),
    ]);
    
    // Track analytics
    analytics.logEvent('rating_updated', {
      winner_id: winnerId,
      winner_rating_change: winnerUpdate.ratingChange,
      winner_new_rating: winnerUpdate.newRating,
      loser_id: loserId,
      loser_rating_change: loserUpdate.ratingChange,
      loser_new_rating: loserUpdate.newRating,
    });
    
    console.log('✅ Ratings updated:', {
      winner: `${winnerUpdate.oldRating} → ${winnerUpdate.newRating} (${winnerUpdate.ratingChange > 0 ? '+' : ''}${winnerUpdate.ratingChange})`,
      loser: `${loserUpdate.oldRating} → ${loserUpdate.newRating} (${loserUpdate.ratingChange > 0 ? '+' : ''}${loserUpdate.ratingChange})`,
    });
    
    return { winner: winnerUpdate, loser: loserUpdate };
  } catch (error) {
    console.error('Failed to update player ratings:', error);
    throw error;
  }
};

/**
 * Update ratings for multiplayer game (3+ players)
 * Uses pairwise comparisons for all player combinations
 */
export const updateMultiplayerRatings = async (
  playerIds: string[],
  finalScores: Record<string, number>
): Promise<Record<string, RatingUpdate>> => {
  try {
    // Get all players' rating data
    const playersData = await Promise.all(
      playerIds.map(id => getPlayerRatingData(id))
    );
    
    const playerRatings = Object.fromEntries(
      playerIds.map((id, i) => [id, playersData[i].rating])
    );
    
    // Sort players by final score (descending)
    const sortedPlayers = [...playerIds].sort(
      (a, b) => finalScores[b] - finalScores[a]
    );
    
    // Calculate rating changes using pairwise comparisons
    const ratingChanges: Record<string, number> = {};
    const updates: Record<string, RatingUpdate> = {};
    
    for (const playerId of playerIds) {
      ratingChanges[playerId] = 0;
    }
    
    // Compare each player against all others
    for (let i = 0; i < sortedPlayers.length; i++) {
      const playerA = sortedPlayers[i];
      const playerAData = playersData[playerIds.indexOf(playerA)];
      
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const playerB = sortedPlayers[j];
        const playerBData = playersData[playerIds.indexOf(playerB)];
        
        // Player A beat player B (higher score)
        const updateA = calculateNewRating(
          playerRatings[playerA],
          playerRatings[playerB],
          true,
          playerAData.gamesPlayed,
          playerAData.winStreak
        );
        
        const updateB = calculateNewRating(
          playerRatings[playerB],
          playerRatings[playerA],
          false,
          playerBData.gamesPlayed,
          playerBData.lossStreak
        );
        
        // Accumulate rating changes (divided by number of comparisons)
        ratingChanges[playerA] += updateA.ratingChange / (sortedPlayers.length - 1);
        ratingChanges[playerB] += updateB.ratingChange / (sortedPlayers.length - 1);
      }
    }
    
    // Apply rating changes
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const playerData = playersData[i];
      const ratingChange = Math.round(ratingChanges[playerId]);
      const newRating = Math.max(
        RATING_CONSTANTS.MIN_RATING,
        Math.min(RATING_CONSTANTS.MAX_RATING, playerData.rating + ratingChange)
      );
      
      const isWinner = sortedPlayers.indexOf(playerId) === 0;
      
      updates[playerId] = {
        oldRating: playerData.rating,
        newRating,
        ratingChange,
        expectedScore: 0.5, // Approximate for multiplayer
        actualScore: isWinner ? 1 : 0,
        kFactor: getKFactor(playerData.rating, playerData.gamesPlayed),
        gamesPlayed: playerData.gamesPlayed + 1,
        winStreak: isWinner ? playerData.winStreak + 1 : 0,
        lossStreak: isWinner ? 0 : playerData.lossStreak + 1,
      };
      
      // Update in Firestore
      const playerRef = doc(firestore, 'users', playerId);
      await updateDoc(playerRef, {
        rating: newRating,
        gamesPlayed: increment(1),
        ...(isWinner ? { gamesWon: increment(1) } : { gamesLost: increment(1) }),
        winStreak: updates[playerId].winStreak,
        lossStreak: updates[playerId].lossStreak,
        peakRating: Math.max(playerData.peakRating, newRating),
        lastGameDate: new Date().toISOString(),
      });
      
      // Record rating history
      await addDoc(collection(firestore, 'ratingHistory'), {
        userId: playerId,
        oldRating: playerData.rating,
        newRating,
        ratingChange,
        result: isWinner ? 'win' : 'loss',
        gameType: 'multiplayer',
        playerCount: playerIds.length,
        finalScore: finalScores[playerId],
        placement: sortedPlayers.indexOf(playerId) + 1,
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log('✅ Multiplayer ratings updated:', updates);
    
    return updates;
  } catch (error) {
    console.error('Failed to update multiplayer ratings:', error);
    throw error;
  }
};

/**
 * Get rating tier based on rating value
 */
export const getRatingTier = (rating: number): string => {
  if (rating >= 2400) return 'Master';
  if (rating >= 2200) return 'Diamond';
  if (rating >= 2000) return 'Platinum';
  if (rating >= 1800) return 'Gold';
  if (rating >= 1600) return 'Silver';
  if (rating >= 1400) return 'Bronze';
  return 'Iron';
};

/**
 * Get rating color based on tier
 */
export const getRatingColor = (rating: number): string => {
  const tier = getRatingTier(rating);
  const colors: Record<string, string> = {
    Master: '#FF6B6B',
    Diamond: '#4ECDC4',
    Platinum: '#95E1D3',
    Gold: '#FFD93D',
    Silver: '#C0C0C0',
    Bronze: '#CD7F32',
    Iron: '#808080',
  };
  return colors[tier] || '#808080';
};
