/**
 * Starred Phrases Service
 * Fetches and manages starred phrases from the dedicated starredPhrases collection.
 * Phrases are written by Cloud Functions when a round winner receives 4+ votes.
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
    const q = query(
      collection(firestore, 'starredPhrases'),
      where('userId', '==', userId),
      orderBy('earnedAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(docSnap => {
        const data = docSnap.data();
        return {
          matchId: docSnap.id,
          phrase: data.phrase || '',
          prompt: data.prompt || undefined,
          stars: data.voteCount || 0,
          totalVotes: data.voteCount || 0,
          playedAt: data.earnedAt?.toDate?.() || new Date(),
          roomName: data.roomName || 'Unknown Room',
          won: false,
        };
      })
      .filter(phrase => phrase.phrase);
  } catch (error: any) {
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
    const q = query(
      collection(firestore, 'starredPhrases'),
      orderBy('voteCount', 'desc'),
      orderBy('earnedAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);

    const phrasesWithUsers = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        let userAvatar = null;
        if (data.userId) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', data.userId));
            if (userDoc.exists()) {
              userAvatar = userDoc.data().avatar || null;
            }
          } catch {
            // Avatar fetch is best-effort
          }
        }

        return {
          matchId: docSnap.id,
          phrase: data.phrase || '',
          prompt: data.prompt || undefined,
          stars: data.voteCount || 0,
          totalVotes: data.voteCount || 0,
          playedAt: data.earnedAt?.toDate?.() || new Date(),
          roomName: data.roomName || 'Unknown Room',
          won: false,
          userId: data.userId,
          username: data.username || 'Unknown User',
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
      collection(firestore, 'starredPhrases'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting starred phrases count:', error);
    return 0;
  }
};
