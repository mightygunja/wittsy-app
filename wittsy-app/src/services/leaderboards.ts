import { firestore } from './firebase';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';

/**
 * Leaderboard Service
 * Manages multiple leaderboard types: Global, Regional, Friends, Specialized
 */

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: any;
  rating: number;
  rank: string;
  tier: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  position: number;
  change?: number; // Position change from last update
}

export interface SpecializedLeaderboardEntry extends LeaderboardEntry {
  specialStat: number; // The stat this leaderboard is based on
  specialStatLabel: string;
}

export type LeaderboardType = 
  | 'global' 
  | 'regional' 
  | 'friends' 
  | 'hall_of_fame' 
  | 'star_leaders' 
  | 'win_streak' 
  | 'most_games'
  | 'season';

/**
 * Get global leaderboard (top players by rating)
 */
export const getGlobalLeaderboard = async (
  limitCount: number = 100
): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      collection(firestore, 'users'),
      orderBy('rating', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        avatar: data.avatar,
        rating: data.rating || 0,
        rank: data.rank || 'Bronze III',
        tier: data.tier || 'Bronze',
        gamesPlayed: data.stats?.gamesPlayed || 0,
        gamesWon: data.stats?.gamesWon || 0,
        winRate: data.stats?.gamesPlayed > 0 
          ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
          : 0,
        position: 0,
      };
    });
    
    // Assign positions with tie handling
    let currentPosition = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].rating === entries[i - 1].rating) {
        // Same rating as previous entry - same position
        entries[i].position = entries[i - 1].position;
      } else {
        // Different rating - assign current position
        entries[i].position = currentPosition;
      }
      currentPosition++;
    }
    
    return entries;
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'failed-precondition') {
      console.warn('Leaderboard requires Firestore permissions. Returning empty.');
      return [];
    }
    console.error('Error fetching global leaderboard:', error);
    return [];
  }
};

/**
 * Get regional leaderboard (top players in a region)
 */
export const getRegionalLeaderboard = async (
  region: string,
  limitCount: number = 100
): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      collection(firestore, 'users'),
      where('region', '==', region),
      orderBy('rating', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        avatar: data.avatar,
        rating: data.rating || 0,
        rank: data.rank || 'Bronze III',
        tier: data.tier || 'Bronze',
        gamesPlayed: data.stats?.gamesPlayed || 0,
        gamesWon: data.stats?.gamesWon || 0,
        winRate: data.stats?.gamesPlayed > 0 
          ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
          : 0,
        position: 0,
      };
    });
    
    // Assign positions with tie handling
    let currentPosition = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].rating === entries[i - 1].rating) {
        entries[i].position = entries[i - 1].position;
      } else {
        entries[i].position = currentPosition;
      }
      currentPosition++;
    }
    
    return entries;
  } catch (error) {
    console.error('Error fetching regional leaderboard:', error);
    return [];
  }
};

/**
 * Get friends leaderboard
 */
export const getFriendsLeaderboard = async (
  userId: string
): Promise<LeaderboardEntry[]> => {
  try {
    // Get user's friends list
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const friendIds = userDoc.data().friends || [];
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Fetch all friends' data
    const friendsData: LeaderboardEntry[] = [];
    
    for (const friendId of friendIds) {
      const friendRef = doc(firestore, 'users', friendId);
      const friendDoc = await getDoc(friendRef);
      
      if (friendDoc.exists()) {
        const data = friendDoc.data();
        friendsData.push({
          userId: friendDoc.id,
          username: data.username,
          avatar: data.avatar,
          rating: data.rating || 0,
          rank: data.rank || 'Bronze III',
          tier: data.tier || 'Bronze',
          gamesPlayed: data.stats?.gamesPlayed || 0,
          gamesWon: data.stats?.gamesWon || 0,
          winRate: data.stats?.gamesPlayed > 0 
            ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
            : 0,
          position: 0, // Will be set after sorting
        });
      }
    }
    
    // Add current user
    const currentUserData = userDoc.data();
    friendsData.push({
      userId: userDoc.id,
      username: currentUserData.username,
      avatar: currentUserData.avatar,
      rating: currentUserData.rating || 0,
      rank: currentUserData.rank || 'Bronze III',
      tier: currentUserData.tier || 'Bronze',
      gamesPlayed: currentUserData.stats?.gamesPlayed || 0,
      gamesWon: currentUserData.stats?.gamesWon || 0,
      winRate: currentUserData.stats?.gamesPlayed > 0 
        ? Math.round((currentUserData.stats.gamesWon / currentUserData.stats.gamesPlayed) * 100) 
        : 0,
      position: 0,
    });
    
    // Sort by rating and assign positions with tie handling
    friendsData.sort((a, b) => b.rating - a.rating);
    let currentPosition = 1;
    for (let i = 0; i < friendsData.length; i++) {
      if (i > 0 && friendsData[i].rating === friendsData[i - 1].rating) {
        friendsData[i].position = friendsData[i - 1].position;
      } else {
        friendsData[i].position = currentPosition;
      }
      currentPosition++;
    }
    
    return friendsData;
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    return [];
  }
};

/**
 * Get Hall of Fame leaderboard (all-time greats)
 */
export const getHallOfFameLeaderboard = async (
  limitCount: number = 50
): Promise<SpecializedLeaderboardEntry[]> => {
  try {
    const q = query(
      collection(firestore, 'users'),
      orderBy('stats.gamesWon', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        avatar: data.avatar,
        rating: data.rating || 0,
        rank: data.rank || 'Bronze III',
        tier: data.tier || 'Bronze',
        gamesPlayed: data.stats?.gamesPlayed || 0,
        gamesWon: data.stats?.gamesWon || 0,
        winRate: data.stats?.gamesPlayed > 0 
          ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
          : 0,
        position: index + 1,
        specialStat: data.stats?.gamesWon || 0,
        specialStatLabel: 'Total Wins',
      };
    });
  } catch (error) {
    console.error('Error fetching Hall of Fame leaderboard:', error);
    return [];
  }
};

/**
 * Get Star Leaders leaderboard (most stars earned)
 */
export const getStarLeadersLeaderboard = async (
  limitCount: number = 50
): Promise<SpecializedLeaderboardEntry[]> => {
  try {
    const q = query(
      collection(firestore, 'users'),
      orderBy('stats.starsEarned', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        avatar: data.avatar,
        rating: data.rating || 0,
        rank: data.rank || 'Bronze III',
        tier: data.tier || 'Bronze',
        gamesPlayed: data.stats?.gamesPlayed || 0,
        gamesWon: data.stats?.gamesWon || 0,
        winRate: data.stats?.gamesPlayed > 0 
          ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
          : 0,
        position: index + 1,
        specialStat: data.stats?.starsEarned || 0,
        specialStatLabel: 'Stars Earned',
      };
    });
  } catch (error) {
    console.error('Error fetching Star Leaders leaderboard:', error);
    return [];
  }
};

/**
 * Get Win Streak leaderboard (best current streaks)
 */
export const getWinStreakLeaderboard = async (
  limitCount: number = 50
): Promise<SpecializedLeaderboardEntry[]> => {
  try {
    const q = query(
      collection(firestore, 'users'),
      orderBy('stats.bestStreak', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        avatar: data.avatar,
        rating: data.rating || 0,
        rank: data.rank || 'Bronze III',
        tier: data.tier || 'Bronze',
        gamesPlayed: data.stats?.gamesPlayed || 0,
        gamesWon: data.stats?.gamesWon || 0,
        winRate: data.stats?.gamesPlayed > 0 
          ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
          : 0,
        position: index + 1,
        specialStat: data.stats?.bestStreak || 0,
        specialStatLabel: 'Best Streak',
      };
    });
  } catch (error) {
    console.error('Error fetching Win Streak leaderboard:', error);
    return [];
  }
};

/**
 * Get Most Games leaderboard (most active players)
 */
export const getMostGamesLeaderboard = async (
  limitCount: number = 50
): Promise<SpecializedLeaderboardEntry[]> => {
  try {
    const q = query(
      collection(firestore, 'users'),
      orderBy('stats.gamesPlayed', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        avatar: data.avatar,
        rating: data.rating || 0,
        rank: data.rank || 'Bronze III',
        tier: data.tier || 'Bronze',
        gamesPlayed: data.stats?.gamesPlayed || 0,
        gamesWon: data.stats?.gamesWon || 0,
        winRate: data.stats?.gamesPlayed > 0 
          ? Math.round((data.stats.gamesWon / data.stats.gamesPlayed) * 100) 
          : 0,
        position: index + 1,
        specialStat: data.stats?.gamesPlayed || 0,
        specialStatLabel: 'Games Played',
      };
    });
  } catch (error) {
    console.error('Error fetching Most Games leaderboard:', error);
    return [];
  }
};

/**
 * Get user's position in global leaderboard
 */
export const getUserGlobalPosition = async (userId: string): Promise<number> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return -1;
    }
    
    const userRating = userDoc.data().rating || 0;
    
    // Count users with higher rating
    const q = query(
      collection(firestore, 'users'),
      where('rating', '>', userRating)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size + 1;
  } catch (error) {
    console.error('Error fetching user position:', error);
    return -1;
  }
};

/**
 * Get leaderboard by type
 */
export const getLeaderboard = async (
  type: LeaderboardType,
  userId?: string,
  region?: string,
  limitCount: number = 100
): Promise<LeaderboardEntry[] | SpecializedLeaderboardEntry[]> => {
  switch (type) {
    case 'global':
      return getGlobalLeaderboard(limitCount);
    
    case 'regional':
      if (!region) throw new Error('Region required for regional leaderboard');
      return getRegionalLeaderboard(region, limitCount);
    
    case 'friends':
      if (!userId) throw new Error('User ID required for friends leaderboard');
      return getFriendsLeaderboard(userId);
    
    case 'hall_of_fame':
      return getHallOfFameLeaderboard(limitCount);
    
    case 'star_leaders':
      return getStarLeadersLeaderboard(limitCount);
    
    case 'win_streak':
      return getWinStreakLeaderboard(limitCount);
    
    case 'most_games':
      return getMostGamesLeaderboard(limitCount);
    
    default:
      return getGlobalLeaderboard(limitCount);
  }
};

/**
 * Get available regions for regional leaderboards
 */
export const getAvailableRegions = (): string[] => {
  return [
    'North America',
    'South America',
    'Europe',
    'Asia',
    'Africa',
    'Oceania',
  ];
};
