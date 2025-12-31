import { firestore } from './firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Ranking & Rating System
 * Implements Elo-style rating with rank tiers
 */

// Rank Tiers Configuration
export const RANK_TIERS = {
  BRONZE: {
    id: 'bronze',
    name: 'Bronze',
    divisions: ['Bronze III', 'Bronze II', 'Bronze I'],
    minRating: 0,
    maxRating: 999,
    color: '#CD7F32',
    icon: '🥉',
  },
  SILVER: {
    id: 'silver',
    name: 'Silver',
    divisions: ['Silver III', 'Silver II', 'Silver I'],
    minRating: 1000,
    maxRating: 1499,
    color: '#C0C0C0',
    icon: '🥈',
  },
  GOLD: {
    id: 'gold',
    name: 'Gold',
    divisions: ['Gold III', 'Gold II', 'Gold I'],
    minRating: 1500,
    maxRating: 1999,
    color: '#FFD700',
    icon: '🥇',
  },
  PLATINUM: {
    id: 'platinum',
    name: 'Platinum',
    divisions: ['Platinum III', 'Platinum II', 'Platinum I'],
    minRating: 2000,
    maxRating: 2499,
    color: '#E5E4E2',
    icon: '💎',
  },
  DIAMOND: {
    id: 'diamond',
    name: 'Diamond',
    divisions: ['Diamond III', 'Diamond II', 'Diamond I'],
    minRating: 2500,
    maxRating: 2999,
    color: '#B9F2FF',
    icon: '💠',
  },
  MASTER: {
    id: 'master',
    name: 'Master',
    divisions: ['Master'],
    minRating: 3000,
    maxRating: 3499,
    color: '#9B59B6',
    icon: '👑',
  },
  GRANDMASTER: {
    id: 'grandmaster',
    name: 'Grandmaster',
    divisions: ['Grandmaster'],
    minRating: 3500,
    maxRating: 3999,
    color: '#E74C3C',
    icon: '🔥',
  },
  LEGEND: {
    id: 'legend',
    name: 'Legend',
    divisions: ['Legend'],
    minRating: 4000,
    maxRating: 999999,
    color: '#F39C12',
    icon: '⭐',
  },
};

// Starting rating for new players
export const STARTING_RATING = 1200;

// K-factor for Elo calculation (higher = more volatile)
const K_FACTOR = 32;

/**
 * Get rank tier from rating
 */
export const getRankFromRating = (rating: number): { tier: string; division: string; tierData: any } => {
  for (const [key, tier] of Object.entries(RANK_TIERS)) {
    if (rating >= tier.minRating && rating <= tier.maxRating) {
      // Calculate division within tier
      const tierRange = tier.maxRating - tier.minRating;
      const divisionSize = tierRange / tier.divisions.length;
      const divisionIndex = Math.min(
        Math.floor((rating - tier.minRating) / divisionSize),
        tier.divisions.length - 1
      );
      
      return {
        tier: tier.name,
        division: tier.divisions[divisionIndex],
        tierData: tier,
      };
    }
  }
  
  // Default to Bronze III
  return {
    tier: RANK_TIERS.BRONZE.name,
    division: RANK_TIERS.BRONZE.divisions[0],
    tierData: RANK_TIERS.BRONZE,
  };
};

/**
 * Calculate expected score (probability of winning)
 */
const calculateExpectedScore = (playerRating: number, opponentRating: number): number => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

/**
 * Calculate new Elo rating after a game
 */
export const calculateNewRating = (
  currentRating: number,
  opponentRating: number,
  actualScore: number, // 1 for win, 0.5 for draw, 0 for loss
  kFactor: number = K_FACTOR
): number => {
  const expectedScore = calculateExpectedScore(currentRating, opponentRating);
  const newRating = currentRating + kFactor * (actualScore - expectedScore);
  
  // Ensure rating doesn't go below 0
  return Math.max(0, Math.round(newRating));
};

/**
 * Calculate rating change for multiplayer game (average opponent rating)
 */
export const calculateMultiplayerRating = (
  playerRating: number,
  opponentRatings: number[],
  placement: number, // 1 = first place, 2 = second, etc.
  totalPlayers: number
): number => {
  // Calculate average opponent rating
  const avgOpponentRating = opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length;
  
  // Convert placement to score (1st = 1.0, last = 0.0, linear interpolation)
  const actualScore = (totalPlayers - placement) / (totalPlayers - 1);
  
  // Use higher K-factor for multiplayer to account for more variance
  const multiplayerKFactor = K_FACTOR * 1.5;
  
  return calculateNewRating(playerRating, avgOpponentRating, actualScore, multiplayerKFactor);
};

/**
 * Update user's rating and rank
 */
export const updateUserRating = async (
  userId: string,
  newRating: number
): Promise<{ rank: string; tier: string; ratingChange: number }> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const currentRating = userDoc.data().rating || STARTING_RATING;
  const ratingChange = newRating - currentRating;
  const rankInfo = getRankFromRating(newRating);
  
  await updateDoc(userRef, {
    rating: newRating,
    rank: rankInfo.division,
    tier: rankInfo.tier,
    lastRatingUpdate: new Date().toISOString(),
  });
  
  // Update rating history
  await updateRatingHistory(userId, newRating, ratingChange);
  
  return {
    rank: rankInfo.division,
    tier: rankInfo.tier,
    ratingChange,
  };
};

/**
 * Update rating history for tracking
 */
const updateRatingHistory = async (
  userId: string,
  rating: number,
  change: number
): Promise<void> => {
  const historyRef = doc(collection(firestore, 'ratingHistory'), `${userId}_${Date.now()}`);
  
  await setDoc(historyRef, {
    userId,
    rating,
    change,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get user's rating history
 */
export const getRatingHistory = async (
  userId: string,
  limit_count: number = 50
): Promise<Array<{ rating: number; change: number; timestamp: string }>> => {
  try {
    const q = query(
      collection(firestore, 'ratingHistory'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as any);
  } catch (error) {
    console.warn('Error fetching rating history:', error);
    return [];
  }
};

/**
 * Get rating change for game result
 */
export const calculateGameRatingChange = (
  playerRating: number,
  opponentRatings: number[],
  won: boolean,
  placement?: number,
  totalPlayers?: number
): number => {
  if (totalPlayers && placement) {
    // Multiplayer game
    return calculateMultiplayerRating(playerRating, opponentRatings, placement, totalPlayers);
  } else {
    // 1v1 or simple win/loss
    const avgOpponentRating = opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length;
    const actualScore = won ? 1 : 0;
    return calculateNewRating(playerRating, avgOpponentRating, actualScore);
  }
};

/**
 * Get rank progression info
 */
export const getRankProgression = (rating: number): {
  currentRank: string;
  currentTier: string;
  nextRank: string | null;
  nextTier: string | null;
  progressToNext: number;
  ratingToNext: number;
} => {
  const current = getRankFromRating(rating);
  const currentTierData = current.tierData;
  
  // Find current division index
  const currentDivisionIndex = currentTierData.divisions.indexOf(current.division);
  
  let nextRank: string | null = null;
  let nextTier: string | null = null;
  let ratingToNext = 0;
  
  // Check if there's a next division in current tier
  if (currentDivisionIndex < currentTierData.divisions.length - 1) {
    nextRank = currentTierData.divisions[currentDivisionIndex + 1];
    nextTier = current.tier;
    
    const tierRange = currentTierData.maxRating - currentTierData.minRating;
    const divisionSize = tierRange / currentTierData.divisions.length;
    const nextDivisionRating = currentTierData.minRating + ((currentDivisionIndex + 1) * divisionSize);
    ratingToNext = Math.ceil(nextDivisionRating - rating);
  } else {
    // Find next tier
    const tiers = Object.values(RANK_TIERS);
    const currentTierIndex = tiers.findIndex(t => t.id === currentTierData.id);
    
    if (currentTierIndex < tiers.length - 1) {
      const nextTierData = tiers[currentTierIndex + 1];
      nextRank = nextTierData.divisions[0];
      nextTier = nextTierData.name;
      ratingToNext = nextTierData.minRating - rating;
    }
  }
  
  const progressToNext = ratingToNext > 0 ? Math.max(0, 100 - (ratingToNext / 100) * 100) : 100;
  
  return {
    currentRank: current.division,
    currentTier: current.tier,
    nextRank,
    nextTier,
    progressToNext: Math.min(100, progressToNext),
    ratingToNext: Math.max(0, ratingToNext),
  };
};

/**
 * Initialize new user rating
 */
export const initializeUserRating = async (userId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const rankInfo = getRankFromRating(STARTING_RATING);
  
  await updateDoc(userRef, {
    rating: STARTING_RATING,
    rank: rankInfo.division,
    tier: rankInfo.tier,
  });
};
