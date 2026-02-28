/**
 * Starred Phrases Service
 * Fetches and manages starred phrases from match history
 */

import { firestore } from './firebase';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';

export interface StarredPhrase {
  matchId: string;
  phrase: string;
  prompt?: string;
  stars: number;
  totalVotes: number;
  playedAt: Date;
  roomName: string;
  won: boolean;
  userId?: string;
  username?: string;
  userAvatar?: any;
}

/**
 * Get all starred phrases for a user
 * A phrase is "starred" if it received 4+ votes (STAR_THRESHOLD)
 */
export const getUserStarredPhrases = async (
  userId: string,
  maxResults: number = 50
): Promise<StarredPhrase[]> => {
  try {
    // Query matches where user earned stars
    const q = query(
      collection(firestore, 'matches'),
      where('userId', '==', userId),
      where('stars', '>', 0),
      orderBy('stars', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          matchId: doc.id,
          phrase: data.bestPhrase || '',
          prompt: data.prompt || undefined,
          stars: data.stars || 0,
          totalVotes: data.totalVotes || 0,
          playedAt: data.playedAt?.toDate?.() || new Date(data.createdAt),
          roomName: data.roomName || 'Unknown Room',
          won: data.won || false,
        };
      })
      .filter(phrase => phrase.phrase); // Only include matches with phrases
  } catch (error: any) {
    // Handle permissions or index errors gracefully
    if (error?.code === 'permission-denied' || error?.code === 'failed-precondition') {
      console.warn('Starred phrases requires Firestore permissions or index. Returning empty list.');
      return [];
    }
    console.error('Error fetching starred phrases:', error);
    throw error;
  }
};

/**
 * Get recent starred phrases across all users (community highlights)
 */
export const getCommunityStarredPhrases = async (
  maxResults: number = 50
): Promise<StarredPhrase[]> => {
  try {
    // Query recent matches with high star counts
    const q = query(
      collection(firestore, 'matches'),
      where('stars', '>', 0), // At least 1 star
      orderBy('stars', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    
    // Fetch user data for each phrase
    const phrasesWithUsers = await Promise.all(
      snapshot.docs.map(async (matchDoc) => {
        const data = matchDoc.data();
        
        // Fetch user profile
        let username = 'Unknown User';
        let userAvatar = null;
        
        if (data.userId) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              username = userData.username || 'Unknown User';
              userAvatar = userData.avatar || null;
            }
          } catch (error) {
            console.warn('Could not fetch user data for phrase:', error);
          }
        }
        
        return {
          matchId: matchDoc.id,
          phrase: data.bestPhrase || '',
          prompt: data.prompt || undefined,
          stars: data.stars || 0,
          totalVotes: data.totalVotes || 0,
          playedAt: data.playedAt?.toDate?.() || new Date(data.createdAt),
          roomName: data.roomName || 'Unknown Room',
          won: data.won || false,
          userId: data.userId,
          username,
          userAvatar,
        };
      })
    );
    
    return phrasesWithUsers.filter(phrase => phrase.phrase);
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'failed-precondition') {
      console.warn('Community starred phrases requires Firestore permissions or index. Returning empty list.');
      return [];
    }
    console.error('Error fetching community starred phrases:', error);
    throw error;
  }
};

/**
 * Get starred phrases count for a user
 */
export const getStarredPhrasesCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(firestore, 'matches'),
      where('userId', '==', userId),
      where('stars', '>', 0)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting starred phrases count:', error);
    return 0;
  }
};
