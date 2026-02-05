/**
 * ELO Rating Service
 * Professional rating system based on Glicko-2 and modern competitive games
 * Used by Chess.com, League of Legends, Overwatch, etc.
 */

import { doc, updateDoc, addDoc, collection, getDoc, increment } from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';

// Rating constants based on industry standards
// Tuned for party game dynamics (Recommendation 4)
export const RATING_CONSTANTS = {
  // Starting rating for new players
  INITIAL_RATING: 1200,
  
  // K-factor determines how much ratings change per game
  // Higher K = more volatile ratings
  // Tuned higher for party game dynamics (more variance than chess)
  K_FACTOR_PLACEMENT: 60,  // First 10 games (Recommendation 5)
  K_FACTOR_NEW: 50,        // Games 11-30 (provisional)
  K_FACTOR_NORMAL: 32,     // Standard players (increased from 24)
  K_FACTOR_HIGH: 20,       // High-rated players (2000+)
  K_FACTOR_MASTER: 16,     // Master tier (2400+)
  
  // Periods (Recommendation 5)
  PLACEMENT_GAMES: 10,     // Placement matches
  PROVISIONAL_GAMES: 30,   // Provisional period
  
  // Rating floors and ceilings
  MIN_RATING: 100,
  MAX_RATING: 4000,        // Increased ceiling
  
  // Rating tiers (for K-factor adjustment)
  HIGH_RATING_THRESHOLD: 2000,
  MASTER_RATING_THRESHOLD: 2400,
  
  // Bonus for winning streaks (Recommendation 3)
  WIN_STREAK_BONUS: 2,
  MAX_STREAK_BONUS: 10,
  
  // Margin of victory bonus (Recommendation 3)
  MARGIN_OF_VICTORY_MAX: 5,
  
  // Rating deviation (uncertainty) (Recommendation 6)
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
  marginBonus?: number;        // Margin of victory bonus (Recommendation 3)
  confidenceLevel?: string;    // Confidence indicator (Recommendation 6)
  isPlacement?: boolean;       // Placement match flag (Recommendation 5)
}

export interface PlayerRatingData {
  rating: number;
  rankedRating?: number;       // Separate ranked rating (Recommendation 2)
  casualRating?: number;       // Separate casual rating (Recommendation 2)
  gamesPlayed: number;
  rankedGamesPlayed?: number;  // Ranked games count (Recommendation 2)
  casualGamesPlayed?: number;  // Casual games count (Recommendation 2)
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
  peakRating: number;
  peakRankedRating?: number;   // Peak ranked rating (Recommendation 2)
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
 * Recommendation 4 & 5: Tuned for party game with placement matches
 */
const getKFactor = (rating: number, gamesPlayed: number): number => {
  // Placement period - very high K for fast calibration (Recommendation 5)
  if (gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES) {
    return RATING_CONSTANTS.K_FACTOR_PLACEMENT;
  }
  
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
  
  // Normal K-factor (tuned higher for party game)
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
 * Calculate margin of victory bonus (Recommendation 3)
 * Rewards dominant performances
 */
const getMarginOfVictoryBonus = (
  winnerVotes: number,
  secondPlaceVotes: number,
  totalVotes: number
): number => {
  if (totalVotes === 0) return 0;
  
  const margin = (winnerVotes - secondPlaceVotes) / totalVotes;
  const bonus = Math.round(margin * RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX);
  return Math.max(0, Math.min(bonus, RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX));
};

/**
 * Get confidence level based on rating deviation (Recommendation 6)
 */
const getConfidenceLevel = (ratingDeviation: number): string => {
  if (ratingDeviation >= 250) return 'Uncertain';
  if (ratingDeviation >= 150) return 'Developing';
  if (ratingDeviation >= 100) return 'Moderate';
  return 'Confident';
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
 * Enhanced with all recommendations
 */
export const calculateNewRating = (
  playerRating: number,
  opponentRating: number,
  playerWon: boolean,
  gamesPlayed: number,
  winStreak: number = 0,
  marginOfVictoryData?: { winnerVotes: number; secondPlaceVotes: number; totalVotes: number },
  ratingDeviation: number = RATING_CONSTANTS.INITIAL_RD
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
  let streakBonus = 0;
  if (playerWon && winStreak >= 3) {
    streakBonus = getStreakBonus(winStreak);
    ratingChange += streakBonus;
  }
  
  // Add margin of victory bonus (Recommendation 3)
  let marginBonus = 0;
  if (playerWon && marginOfVictoryData) {
    marginBonus = getMarginOfVictoryBonus(
      marginOfVictoryData.winnerVotes,
      marginOfVictoryData.secondPlaceVotes,
      marginOfVictoryData.totalVotes
    );
    ratingChange += marginBonus;
  }
  
  // Round to nearest integer
  ratingChange = Math.round(ratingChange);
  
  // Calculate new rating
  let newRating = playerRating + ratingChange;
  
  // Enforce rating bounds
  newRating = Math.max(RATING_CONSTANTS.MIN_RATING, newRating);
  newRating = Math.min(RATING_CONSTANTS.MAX_RATING, newRating);
  
  // Get confidence level (Recommendation 6)
  const confidenceLevel = getConfidenceLevel(ratingDeviation);
  
  // Check if placement match (Recommendation 5)
  const isPlacement = gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES;
  
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
    marginBonus: marginBonus > 0 ? marginBonus : undefined,
    confidenceLevel,
    isPlacement,
  };
};

/**
 * Get player's rating data
 * Enhanced with ranked/casual split (Recommendation 2)
 */
export const getPlayerRatingData = async (
  userId: string,
  isRanked: boolean = true
): Promise<PlayerRatingData> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Use appropriate rating based on game type (Recommendation 2)
    const rating = isRanked 
      ? (userData.rankedRating || userData.rating || RATING_CONSTANTS.INITIAL_RATING)
      : (userData.casualRating || userData.rating || RATING_CONSTANTS.INITIAL_RATING);
    
    const gamesPlayed = isRanked
      ? (userData.rankedGamesPlayed || 0)
      : (userData.casualGamesPlayed || 0);
    
    return {
      rating,
      rankedRating: userData.rankedRating || userData.rating || RATING_CONSTANTS.INITIAL_RATING,
      casualRating: userData.casualRating || userData.rating || RATING_CONSTANTS.INITIAL_RATING,
      gamesPlayed,
      rankedGamesPlayed: userData.rankedGamesPlayed || 0,
      casualGamesPlayed: userData.casualGamesPlayed || 0,
      wins: userData.gamesWon || 0,
      losses: userData.gamesLost || 0,
      winStreak: userData.winStreak || 0,
      lossStreak: userData.lossStreak || 0,
      peakRating: userData.peakRating || RATING_CONSTANTS.INITIAL_RATING,
      peakRankedRating: userData.peakRankedRating || RATING_CONSTANTS.INITIAL_RATING,
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
 * Enhanced with ranked/casual split and margin of victory (Recommendations 2 & 3)
 */
export const updatePlayerRating = async (
  winnerId: string,
  loserId: string,
  isRanked: boolean = true,
  marginOfVictoryData?: { winnerVotes: number; secondPlaceVotes: number; totalVotes: number }
): Promise<{ winner: RatingUpdate; loser: RatingUpdate }> => {
  try {
    // Get both players' rating data (with ranked/casual split)
    const [winnerData, loserData] = await Promise.all([
      getPlayerRatingData(winnerId, isRanked),
      getPlayerRatingData(loserId, isRanked),
    ]);
    
    // Update rating deviation based on inactivity
    const winnerRD = updateRatingDeviation(winnerData.ratingDeviation, winnerData.lastGameDate);
    const loserRD = updateRatingDeviation(loserData.ratingDeviation, loserData.lastGameDate);
    
    // Calculate new ratings with all enhancements
    const winnerUpdate = calculateNewRating(
      winnerData.rating,
      loserData.rating,
      true,
      winnerData.gamesPlayed,
      winnerData.winStreak,
      marginOfVictoryData,
      winnerRD
    );
    
    const loserUpdate = calculateNewRating(
      loserData.rating,
      winnerData.rating,
      false,
      loserData.gamesPlayed,
      loserData.lossStreak,
      undefined,
      loserRD
    );
    
    // Update winner's data with ranked/casual split (Recommendation 2)
    const winnerRef = doc(firestore, 'users', winnerId);
    const winnerUpdates: any = {
      winStreak: winnerUpdate.winStreak,
      lossStreak: 0,
      ratingDeviation: Math.max(winnerRD - 10, RATING_CONSTANTS.MIN_RD),
      lastGameDate: new Date().toISOString(),
    };
    
    if (isRanked) {
      winnerUpdates.rankedRating = winnerUpdate.newRating;
      winnerUpdates.rankedGamesPlayed = increment(1);
      winnerUpdates.peakRankedRating = Math.max(winnerData.peakRankedRating || 0, winnerUpdate.newRating);
      console.log(`🏆 Winner ranked rating update:`, {
        userId: winnerId,
        field: 'rankedRating',
        oldRating: winnerUpdate.oldRating,
        newRating: winnerUpdate.newRating,
        change: winnerUpdate.ratingChange,
        kFactor: winnerUpdate.kFactor,
        isPlacement: winnerUpdate.isPlacement,
        marginBonus: winnerUpdate.marginBonus,
      });
    } else {
      winnerUpdates.casualRating = winnerUpdate.newRating;
      winnerUpdates.casualGamesPlayed = increment(1);
      console.log(`🏆 Winner casual rating update:`, {
        userId: winnerId,
        field: 'casualRating',
        oldRating: winnerUpdate.oldRating,
        newRating: winnerUpdate.newRating,
        change: winnerUpdate.ratingChange,
        kFactor: winnerUpdate.kFactor,
      });
    }
    
    // Always update general stats
    winnerUpdates.gamesPlayed = increment(1);
    winnerUpdates.gamesWon = increment(1);
    winnerUpdates.peakRating = Math.max(winnerData.peakRating, winnerUpdate.newRating);
    
    await updateDoc(winnerRef, winnerUpdates);
    console.log(`✅ Winner Firestore update completed for user: ${winnerId}`);
    
    // Update loser's data with ranked/casual split (Recommendation 2)
    const loserRef = doc(firestore, 'users', loserId);
    const loserUpdates: any = {
      winStreak: 0,
      lossStreak: loserUpdate.lossStreak,
      ratingDeviation: Math.max(loserRD - 10, RATING_CONSTANTS.MIN_RD),
      lastGameDate: new Date().toISOString(),
    };
    
    if (isRanked) {
      loserUpdates.rankedRating = loserUpdate.newRating;
      loserUpdates.rankedGamesPlayed = increment(1);
      console.log(`📉 Loser ranked rating update:`, {
        userId: loserId,
        field: 'rankedRating',
        oldRating: loserUpdate.oldRating,
        newRating: loserUpdate.newRating,
        change: loserUpdate.ratingChange,
        kFactor: loserUpdate.kFactor,
        isPlacement: loserUpdate.isPlacement,
      });
    } else {
      loserUpdates.casualRating = loserUpdate.newRating;
      loserUpdates.casualGamesPlayed = increment(1);
      console.log(`📉 Loser casual rating update:`, {
        userId: loserId,
        field: 'casualRating',
        oldRating: loserUpdate.oldRating,
        newRating: loserUpdate.newRating,
        change: loserUpdate.ratingChange,
        kFactor: loserUpdate.kFactor,
      });
    }
    
    // Always update general stats
    loserUpdates.gamesPlayed = increment(1);
    loserUpdates.gamesLost = increment(1);
    
    await updateDoc(loserRef, loserUpdates);
    console.log(`✅ Loser Firestore update completed for user: ${loserId}`);
    
    // Record rating history with enhanced data
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
        isRanked,
        isPlacement: winnerUpdate.isPlacement,
        marginBonus: winnerUpdate.marginBonus,
        confidenceLevel: winnerUpdate.confidenceLevel,
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
        isRanked,
        isPlacement: loserUpdate.isPlacement,
        confidenceLevel: loserUpdate.confidenceLevel,
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
 * Enhanced with ranked/casual split and margin of victory (Recommendations 2 & 3)
 */
export const updateMultiplayerRatings = async (
  playerIds: string[],
  finalScores: Record<string, number>,
  isRanked: boolean = true,
  voteData?: Record<string, number>
): Promise<Record<string, RatingUpdate>> => {
  try {
    // Get all players' rating data with ranked/casual split
    const playersData = await Promise.all(
      playerIds.map(id => getPlayerRatingData(id, isRanked))
    );
    
    const playerRatings = Object.fromEntries(
      playerIds.map((id, i) => [id, playersData[i].rating])
    );
    
    // Sort players by final score (descending)
    const sortedPlayers = [...playerIds].sort(
      (a, b) => finalScores[b] - finalScores[a]
    );
    
    // Calculate margin of victory if vote data provided (Recommendation 3)
    let marginOfVictoryData: { winnerVotes: number; secondPlaceVotes: number; totalVotes: number } | undefined;
    if (voteData && sortedPlayers.length >= 2) {
      const winnerVotes = voteData[sortedPlayers[0]] || 0;
      const secondPlaceVotes = voteData[sortedPlayers[1]] || 0;
      const totalVotes = Object.values(voteData).reduce((sum, v) => sum + v, 0);
      marginOfVictoryData = { winnerVotes, secondPlaceVotes, totalVotes };
    }
    
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
        // Only winner gets margin bonus
        const isWinner = i === 0;
        const updateA = calculateNewRating(
          playerRatings[playerA],
          playerRatings[playerB],
          true,
          playerAData.gamesPlayed,
          playerAData.winStreak,
          isWinner ? marginOfVictoryData : undefined,
          playerAData.ratingDeviation
        );
        
        const updateB = calculateNewRating(
          playerRatings[playerB],
          playerRatings[playerA],
          false,
          playerBData.gamesPlayed,
          playerBData.lossStreak,
          undefined,
          playerBData.ratingDeviation
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
        marginBonus: isWinner && marginOfVictoryData ? getMarginOfVictoryBonus(
          marginOfVictoryData.winnerVotes,
          marginOfVictoryData.secondPlaceVotes,
          marginOfVictoryData.totalVotes
        ) : undefined,
        confidenceLevel: getConfidenceLevel(playerData.ratingDeviation),
        isPlacement: playerData.gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES,
      };
      
      // Update in Firestore with ranked/casual split (Recommendation 2)
      const playerRef = doc(firestore, 'users', playerId);
      const playerUpdates: any = {
        gamesPlayed: increment(1),
        winStreak: updates[playerId].winStreak,
        lossStreak: updates[playerId].lossStreak,
        peakRating: Math.max(playerData.peakRating, newRating),
        lastGameDate: new Date().toISOString(),
      };
      
      if (isRanked) {
        playerUpdates.rankedRating = newRating;
        playerUpdates.rankedGamesPlayed = increment(1);
        if (isWinner) {
          playerUpdates.peakRankedRating = Math.max(playerData.peakRankedRating || 0, newRating);
        }
      } else {
        playerUpdates.casualRating = newRating;
        playerUpdates.casualGamesPlayed = increment(1);
      }
      
      if (isWinner) {
        playerUpdates.gamesWon = increment(1);
      } else {
        playerUpdates.gamesLost = increment(1);
      }
      
      await updateDoc(playerRef, playerUpdates);
      
      console.log(`${isWinner ? '🏆' : '📉'} Multiplayer rating update:`, {
        userId: playerId,
        field: isRanked ? 'rankedRating' : 'casualRating',
        oldRating: playerData.rating,
        newRating,
        change: ratingChange,
        placement: sortedPlayers.indexOf(playerId) + 1,
        totalPlayers: playerIds.length,
        isWinner,
        marginBonus: updates[playerId].marginBonus,
      });
      
      // Record rating history with enhanced data
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
        isRanked,
        isPlacement: updates[playerId].isPlacement,
        marginBonus: updates[playerId].marginBonus,
        confidenceLevel: updates[playerId].confidenceLevel,
        kFactor: updates[playerId].kFactor,
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
