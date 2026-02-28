/**
 * Rating Integration Service
 * Connects game completion with enhanced ELO rating system
 * Implements all 6 recommendations from ELO analysis
 */

import { updatePlayerRating, updateMultiplayerRatings, RATING_CONSTANTS } from './eloRatingService';
import { getRankFromRating } from './ranking';

export interface GameCompletionData {
  roomId: string;
  roomName: string;
  isRanked: boolean;
  players: Array<{
    userId: string;
    username: string;
    score: number;
    totalVotes: number;
    placement: number;
  }>;
}

/**
 * Process rating updates after game completion
 * Handles both 1v1 and multiplayer games with all enhancements
 */
export const processGameRatings = async (
  gameData: GameCompletionData
): Promise<void> => {
  const { players, isRanked } = gameData;
  
  // Sort players by placement
  const sortedPlayers = [...players].sort((a, b) => a.placement - b.placement);
  
  if (sortedPlayers.length < 2) {
    console.warn('Not enough players to process ratings');
    return;
  }
  
  // Calculate vote data for margin of victory
  const voteData: Record<string, number> = {};
  sortedPlayers.forEach(player => {
    voteData[player.userId] = player.totalVotes;
  });
  
  // Calculate margin of victory data
  const winnerVotes = sortedPlayers[0].totalVotes;
  const secondPlaceVotes = sortedPlayers.length > 1 ? sortedPlayers[1].totalVotes : 0;
  const totalVotes = sortedPlayers.reduce((sum, p) => sum + p.totalVotes, 0);
  
  const marginOfVictoryData = {
    winnerVotes,
    secondPlaceVotes,
    totalVotes,
  };
  
  try {
    if (sortedPlayers.length === 2) {
      // 1v1 game - use updatePlayerRating
      await updatePlayerRating(
        sortedPlayers[0].userId,
        sortedPlayers[1].userId,
        isRanked,
        marginOfVictoryData
      );
      
      console.log('✅ 1v1 ratings updated:', {
        winner: sortedPlayers[0].username,
        loser: sortedPlayers[1].username,
        isRanked,
        marginBonus: marginOfVictoryData,
      });
    } else {
      // Multiplayer game - use updateMultiplayerRatings
      const finalScores: Record<string, number> = {};
      sortedPlayers.forEach(player => {
        finalScores[player.userId] = player.score;
      });
      
      const playerIds = sortedPlayers.map(p => p.userId);
      
      await updateMultiplayerRatings(
        playerIds,
        finalScores,
        isRanked,
        voteData
      );
      
      console.log('✅ Multiplayer ratings updated:', {
        playerCount: sortedPlayers.length,
        winner: sortedPlayers[0].username,
        isRanked,
        marginBonus: marginOfVictoryData,
      });
    }
  } catch (error) {
    console.error('Failed to process game ratings:', error);
    throw error;
  }
};

/**
 * Get rating display info for UI
 * Includes confidence level and placement status
 */
export const getRatingDisplayInfo = (
  rating: number,
  gamesPlayed: number,
  ratingDeviation: number
): {
  rating: number;
  rank: string;
  tier: string;
  confidenceLevel: string;
  isPlacement: boolean;
  placementProgress?: string;
} => {
  const rankInfo = getRankFromRating(rating);
  
  // Confidence level
  let confidenceLevel = 'Confident';
  if (ratingDeviation >= 250) confidenceLevel = 'Uncertain';
  else if (ratingDeviation >= 150) confidenceLevel = 'Developing';
  else if (ratingDeviation >= 100) confidenceLevel = 'Moderate';
  
  // Placement status
  const isPlacement = gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES;
  const placementProgress = isPlacement 
    ? `${gamesPlayed}/${RATING_CONSTANTS.PLACEMENT_GAMES}`
    : undefined;
  
  return {
    rating,
    rank: rankInfo.division,
    tier: rankInfo.tier,
    confidenceLevel,
    isPlacement,
    placementProgress,
  };
};

/**
 * Format rating change for display
 * Shows placement status, margin bonus, and confidence
 */
export const formatRatingChange = (
  ratingChange: number,
  isPlacement: boolean,
  marginBonus?: number,
  confidenceLevel?: string
): string => {
  let message = `${ratingChange > 0 ? '+' : ''}${ratingChange}`;
  
  if (isPlacement) {
    message += ' (Placement)';
  }
  
  if (marginBonus && marginBonus > 0) {
    message += ` [+${marginBonus} margin bonus]`;
  }
  
  if (confidenceLevel && confidenceLevel !== 'Confident') {
    message += ` (${confidenceLevel})`;
  }
  
  return message;
};

/**
 * Check if user should see placement progress
 */
export const shouldShowPlacementProgress = (
  rankedGamesPlayed: number
): boolean => {
  return rankedGamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES;
};

/**
 * Get placement completion message
 */
export const getPlacementCompletionMessage = (
  rankedGamesPlayed: number
): string | null => {
  if (rankedGamesPlayed === RATING_CONSTANTS.PLACEMENT_GAMES) {
    return '🎉 Placement matches complete! Your ranked rating is now established.';
  }
  return null;
};
