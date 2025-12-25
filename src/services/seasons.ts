import { firestore } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';

/**
 * Season System
 * Manages competitive seasons with rewards and resets
 */

export interface Season {
  id: string;
  number: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  rewards: SeasonReward[];
  theme?: string;
  description?: string;
}

export interface SeasonReward {
  rank: string;
  tier: string;
  minRating: number;
  rewards: {
    title?: string;
    badge?: string;
    xp?: number;
    avatarItem?: string;
  };
}

export interface UserSeasonStats {
  userId: string;
  seasonId: string;
  startRating: number;
  currentRating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  rank: string;
  tier: string;
}

// Season duration in days
const SEASON_DURATION_DAYS = 90; // 3 months

// Cache to prevent repeated permission errors
let seasonCache: Season | null | undefined = undefined;
let seasonCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Get current active season
 */
export const getCurrentSeason = async (): Promise<Season | null> => {
  // Return cached result if available and fresh
  if (seasonCache !== undefined && Date.now() - seasonCacheTime < CACHE_DURATION) {
    return seasonCache;
  }

  try {
    const q = query(
      collection(firestore, 'seasons'),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      seasonCache = null;
      seasonCacheTime = Date.now();
      return null;
    }
    
    const season = snapshot.docs[0].data() as Season;
    seasonCache = season;
    seasonCacheTime = Date.now();
    return season;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      // Only log once by caching the null result
      if (seasonCache === undefined) {
        console.warn('Season feature requires Firestore permissions. Seasons disabled.');
      }
      seasonCache = null;
      seasonCacheTime = Date.now();
      return null;
    }
    console.error('Error fetching current season:', error);
    seasonCache = null;
    seasonCacheTime = Date.now();
    return null;
  }
};

/**
 * Get all seasons
 */
export const getAllSeasons = async (): Promise<Season[]> => {
  try {
    const q = query(
      collection(firestore, 'seasons'),
      orderBy('number', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Season);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
};

/**
 * Create a new season
 */
export const createSeason = async (
  number: number,
  name: string,
  theme?: string,
  description?: string
): Promise<Season> => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + SEASON_DURATION_DAYS);
  
  const season: Season = {
    id: `season_${number}`,
    number,
    name,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    theme,
    description,
    rewards: generateSeasonRewards(),
  };
  
  const seasonRef = doc(firestore, 'seasons', season.id);
  await setDoc(seasonRef, season);
  
  return season;
};

/**
 * Generate season rewards based on rank tiers
 */
const generateSeasonRewards = (): SeasonReward[] => {
  return [
    {
      rank: 'Legend',
      tier: 'Legend',
      minRating: 4000,
      rewards: {
        title: 'Legendary Champion',
        badge: 'legendary_season',
        xp: 5000,
        avatarItem: 'legendary_crown',
      },
    },
    {
      rank: 'Grandmaster',
      tier: 'Grandmaster',
      minRating: 3500,
      rewards: {
        title: 'Season Grandmaster',
        badge: 'grandmaster_season',
        xp: 3000,
        avatarItem: 'grandmaster_cape',
      },
    },
    {
      rank: 'Master',
      tier: 'Master',
      minRating: 3000,
      rewards: {
        title: 'Season Master',
        badge: 'master_season',
        xp: 2000,
        avatarItem: 'master_emblem',
      },
    },
    {
      rank: 'Diamond I',
      tier: 'Diamond',
      minRating: 2500,
      rewards: {
        badge: 'diamond_season',
        xp: 1500,
      },
    },
    {
      rank: 'Platinum I',
      tier: 'Platinum',
      minRating: 2000,
      rewards: {
        badge: 'platinum_season',
        xp: 1000,
      },
    },
    {
      rank: 'Gold I',
      tier: 'Gold',
      minRating: 1500,
      rewards: {
        badge: 'gold_season',
        xp: 500,
      },
    },
  ];
};

/**
 * Get user's season stats
 */
export const getUserSeasonStats = async (
  userId: string,
  seasonId: string
): Promise<UserSeasonStats | null> => {
  try {
    const statsRef = doc(firestore, 'seasonStats', `${userId}_${seasonId}`);
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      return null;
    }
    
    return statsDoc.data() as UserSeasonStats;
  } catch (error) {
    console.error('Error fetching user season stats:', error);
    return null;
  }
};

/**
 * Initialize user for current season
 */
export const initializeUserSeason = async (
  userId: string,
  seasonId: string,
  startRating: number,
  rank: string,
  tier: string
): Promise<void> => {
  const statsRef = doc(firestore, 'seasonStats', `${userId}_${seasonId}`);
  
  const stats: UserSeasonStats = {
    userId,
    seasonId,
    startRating,
    currentRating: startRating,
    peakRating: startRating,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    rank,
    tier,
  };
  
  await setDoc(statsRef, stats);
};

/**
 * Update user's season stats after a game
 */
export const updateUserSeasonStats = async (
  userId: string,
  seasonId: string,
  newRating: number,
  won: boolean,
  rank: string,
  tier: string
): Promise<void> => {
  const statsRef = doc(firestore, 'seasonStats', `${userId}_${seasonId}`);
  const statsDoc = await getDoc(statsRef);
  
  if (!statsDoc.exists()) {
    // Initialize if doesn't exist
    await initializeUserSeason(userId, seasonId, newRating, rank, tier);
    return;
  }
  
  const currentStats = statsDoc.data() as UserSeasonStats;
  const peakRating = Math.max(currentStats.peakRating, newRating);
  
  await updateDoc(statsRef, {
    currentRating: newRating,
    peakRating,
    gamesPlayed: currentStats.gamesPlayed + 1,
    wins: currentStats.wins + (won ? 1 : 0),
    losses: currentStats.losses + (won ? 0 : 1),
    rank,
    tier,
  });
};

/**
 * End current season and distribute rewards
 */
export const endSeason = async (seasonId: string): Promise<void> => {
  // Update season status
  const seasonRef = doc(firestore, 'seasons', seasonId);
  await updateDoc(seasonRef, {
    status: 'ended',
  });
  
  // Get all users' season stats
  const q = query(
    collection(firestore, 'seasonStats'),
    where('seasonId', '==', seasonId)
  );
  
  const snapshot = await getDocs(q);
  const season = await getDoc(seasonRef);
  const seasonData = season.data() as Season;
  
  // Distribute rewards based on final rating
  for (const doc of snapshot.docs) {
    const stats = doc.data() as UserSeasonStats;
    await distributeSeasonRewards(stats.userId, stats.peakRating, seasonData.rewards);
  }
};

/**
 * Distribute season rewards to user
 */
const distributeSeasonRewards = async (
  userId: string,
  peakRating: number,
  rewards: SeasonReward[]
): Promise<void> => {
  // Find highest reward tier user qualifies for
  const qualifiedReward = rewards
    .filter(r => peakRating >= r.minRating)
    .sort((a, b) => b.minRating - a.minRating)[0];
  
  if (!qualifiedReward) {
    return;
  }
  
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return;
  }
  
  const updates: any = {};
  
  // Award title
  if (qualifiedReward.rewards.title) {
    const currentTitles = userDoc.data().unlockedTitles || [];
    updates.unlockedTitles = [...currentTitles, qualifiedReward.rewards.title];
  }
  
  // Award XP
  if (qualifiedReward.rewards.xp) {
    updates.xp = (userDoc.data().xp || 0) + qualifiedReward.rewards.xp;
  }
  
  // Award badge
  if (qualifiedReward.rewards.badge) {
    const currentBadges = userDoc.data().badges || [];
    updates.badges = [...currentBadges, qualifiedReward.rewards.badge];
  }
  
  await updateDoc(userRef, updates);
};

/**
 * Get season leaderboard (top players)
 */
export const getSeasonLeaderboard = async (
  seasonId: string,
  limitCount: number = 100
): Promise<UserSeasonStats[]> => {
  try {
    const q = query(
      collection(firestore, 'seasonStats'),
      where('seasonId', '==', seasonId),
      orderBy('peakRating', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserSeasonStats);
  } catch (error) {
    // Expected when seasonStats collection is empty - silently return empty array
    console.warn('Season leaderboard not yet populated (expected on first run)');
    return [];
  }
};

/**
 * Calculate days remaining in season
 */
export const getDaysRemainingInSeason = (season: Season): number => {
  const endDate = new Date(season.endDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Check if season should end and create new one
 */
export const checkAndRotateSeason = async (): Promise<void> => {
  const currentSeason = await getCurrentSeason();
  
  if (!currentSeason) {
    // No active season, create first one
    await createSeason(1, 'Season 1: The Beginning', 'launch', 'The inaugural season of WITTSY!');
    return;
  }
  
  const daysRemaining = getDaysRemainingInSeason(currentSeason);
  
  if (daysRemaining <= 0) {
    // End current season
    await endSeason(currentSeason.id);
    
    // Create new season
    const newSeasonNumber = currentSeason.number + 1;
    await createSeason(
      newSeasonNumber,
      `Season ${newSeasonNumber}`,
      undefined,
      `Season ${newSeasonNumber} of competitive WITTSY!`
    );
  }
};
