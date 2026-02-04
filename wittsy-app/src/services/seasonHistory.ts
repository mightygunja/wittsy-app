/**
 * Season History Service
 * Tracks user performance across seasons for ranked games
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';

export interface SeasonStats {
  seasonId: string;
  seasonNumber: number;
  seasonName: string;
  gamesPlayed: number;
  gamesWon: number;
  totalVotes: number;
  bestRank: number;
  finalRank: number;
  finalElo: number;
  startElo: number;
  topPhrases: string[];
  achievements: string[];
}

/**
 * Update user's season stats after a ranked game finishes
 */
export const updateSeasonStats = async (
  userId: string,
  seasonId: string,
  seasonNumber: number,
  seasonName: string,
  gameData: {
    won: boolean;
    votesReceived: number;
    finalRank: number;
    topPhrase?: string;
  }
): Promise<void> => {
  try {
    const seasonStatsRef = doc(firestore, 'users', userId, 'seasonHistory', seasonId);
    const seasonStatsDoc = await getDoc(seasonStatsRef);

    if (seasonStatsDoc.exists()) {
      // Update existing season stats
      const currentStats = seasonStatsDoc.data() as SeasonStats;
      const updates: Partial<SeasonStats> = {
        gamesPlayed: currentStats.gamesPlayed + 1,
        gamesWon: currentStats.gamesWon + (gameData.won ? 1 : 0),
        totalVotes: currentStats.totalVotes + gameData.votesReceived,
        bestRank: Math.min(currentStats.bestRank, gameData.finalRank),
      };

      // Add top phrase if provided
      if (gameData.topPhrase && !currentStats.topPhrases.includes(gameData.topPhrase)) {
        updates.topPhrases = [...currentStats.topPhrases.slice(0, 9), gameData.topPhrase];
      }

      await updateDoc(seasonStatsRef, updates);
    } else {
      // Create new season stats
      const newStats: SeasonStats = {
        seasonId,
        seasonNumber,
        seasonName,
        gamesPlayed: 1,
        gamesWon: gameData.won ? 1 : 0,
        totalVotes: gameData.votesReceived,
        bestRank: gameData.finalRank,
        finalRank: gameData.finalRank,
        finalElo: 1000, // Will be updated when season ends
        startElo: 1000,
        topPhrases: gameData.topPhrase ? [gameData.topPhrase] : [],
        achievements: [],
      };

      await setDoc(seasonStatsRef, newStats);
    }

    console.log(`✅ Updated season stats for user ${userId} in season ${seasonName}`);
  } catch (error) {
    console.error('❌ Error updating season stats:', error);
  }
};

/**
 * Get user's season history
 */
export const getUserSeasonHistory = async (userId: string): Promise<SeasonStats[]> => {
  try {
    const seasonHistoryRef = collection(firestore, 'users', userId, 'seasonHistory');
    const snapshot = await getDocs(seasonHistoryRef);
    
    const history = snapshot.docs
      .map(doc => doc.data() as SeasonStats)
      .sort((a, b) => b.seasonNumber - a.seasonNumber); // Most recent first

    return history;
  } catch (error) {
    console.error('❌ Error fetching season history:', error);
    return [];
  }
};

/**
 * Get user's stats for a specific season
 */
export const getSeasonStats = async (userId: string, seasonId: string): Promise<SeasonStats | null> => {
  try {
    const seasonStatsRef = doc(firestore, 'users', userId, 'seasonHistory', seasonId);
    const seasonStatsDoc = await getDoc(seasonStatsRef);

    if (seasonStatsDoc.exists()) {
      return seasonStatsDoc.data() as SeasonStats;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching season stats:', error);
    return null;
  }
};

/**
 * Finalize season stats when a season ends (called by admin)
 */
export const finalizeSeasonStats = async (
  userId: string,
  seasonId: string,
  finalElo: number,
  finalRank: number
): Promise<void> => {
  try {
    const seasonStatsRef = doc(firestore, 'users', userId, 'seasonHistory', seasonId);
    await updateDoc(seasonStatsRef, {
      finalElo,
      finalRank,
    });

    console.log(`✅ Finalized season stats for user ${userId}`);
  } catch (error) {
    console.error('❌ Error finalizing season stats:', error);
  }
};
