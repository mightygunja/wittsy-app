/**
 * Challenges Service
 * Daily challenges, weekly challenges, special events
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Challenge, UserChallengeProgress, ChallengeReward } from '../types/social';

// ==================== CHALLENGE MANAGEMENT ====================

/**
 * Get active challenges for user
 */
export const getActiveChallenges = async (userId: string): Promise<Challenge[]> => {
  // Simplified query - just get all challenges and filter client-side
  const q = query(
    collection(firestore, 'challenges')
  );

  const snapshot = await getDocs(q);
  const now = new Date().toISOString();
  
  // Filter active challenges client-side
  const challenges = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
    .filter(challenge => challenge.startDate <= now && challenge.endDate >= now);

  // Get user progress for each challenge
  const progressPromises = challenges.map(challenge => 
    getUserChallengeProgress(userId, challenge.id)
  );
  const progressData = await Promise.all(progressPromises);

  // Merge progress with challenges
  return challenges.map((challenge, index) => ({
    ...challenge,
    progress: progressData[index]?.progress || 0,
    completed: progressData[index]?.completed || false,
    completedAt: progressData[index]?.completedAt,
    claimed: progressData[index]?.claimed || false,
  }));
};

/**
 * Get daily challenges
 */
export const getDailyChallenges = async (userId: string): Promise<Challenge[]> => {
  const challenges = await getActiveChallenges(userId);
  return challenges.filter(c => c.type === 'daily');
};

/**
 * Get weekly challenges
 */
export const getWeeklyChallenges = async (userId: string): Promise<Challenge[]> => {
  const challenges = await getActiveChallenges(userId);
  return challenges.filter(c => c.type === 'weekly');
};

/**
 * Get user challenge progress
 */
export const getUserChallengeProgress = async (
  userId: string,
  challengeId: string
): Promise<UserChallengeProgress | null> => {
  const q = query(
    collection(firestore, 'challengeProgress'),
    where('userId', '==', userId),
    where('challengeId', '==', challengeId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return snapshot.docs[0].data() as UserChallengeProgress;
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (
  userId: string,
  challengeId: string,
  progress: number
): Promise<void> => {
  const q = query(
    collection(firestore, 'challengeProgress'),
    where('userId', '==', userId),
    where('challengeId', '==', challengeId)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create new progress entry
    await addDoc(collection(firestore, 'challengeProgress'), {
      userId,
      challengeId,
      progress,
      completed: false,
      claimed: false,
    });
  } else {
    // Update existing progress
    const progressDoc = snapshot.docs[0];
    const currentProgress = progressDoc.data().progress || 0;
    const newProgress = Math.max(currentProgress, progress);
    
    // Check if challenge is completed
    const challengeDoc = await getDoc(doc(firestore, 'challenges', challengeId));
    const challenge = challengeDoc.data() as Challenge;
    const completed = newProgress >= challenge.requirement;
    
    await updateDoc(progressDoc.ref, {
      progress: newProgress,
      completed,
      completedAt: completed ? new Date().toISOString() : null,
    });
    
    // Send notification if just completed
    if (completed && !progressDoc.data().completed) {
      await createChallengeCompletedNotification(userId, challenge);
    }
  }
};

/**
 * Claim challenge reward
 */
export const claimChallengeReward = async (
  userId: string,
  challengeId: string
): Promise<ChallengeReward> => {
  const progressQuery = query(
    collection(firestore, 'challengeProgress'),
    where('userId', '==', userId),
    where('challengeId', '==', challengeId)
  );

  const progressSnapshot = await getDocs(progressQuery);
  if (progressSnapshot.empty) {
    throw new Error('Challenge progress not found');
  }

  const progressDoc = progressSnapshot.docs[0];
  const progressData = progressDoc.data();

  if (!progressData.completed) {
    throw new Error('Challenge not completed');
  }

  if (progressData.claimed) {
    throw new Error('Reward already claimed');
  }

  // Get challenge details
  const challengeDoc = await getDoc(doc(firestore, 'challenges', challengeId));
  if (!challengeDoc.exists()) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeDoc.data() as Challenge;
  const reward = challenge.reward;

  // Award rewards to user
  const userRef = doc(firestore, 'users', userId);
  const updates: any = {};

  if (reward.xp) {
    updates.xp = Timestamp.now(); // Use increment in actual implementation
  }
  if (reward.coins) {
    updates.coins = Timestamp.now(); // Use increment
  }
  if (reward.title) {
    updates.unlockedTitles = Timestamp.now(); // Use arrayUnion
  }
  if (reward.badge) {
    updates.badges = Timestamp.now(); // Use arrayUnion
  }

  await updateDoc(userRef, updates);

  // Mark as claimed
  await updateDoc(progressDoc.ref, {
    claimed: true,
    claimedAt: new Date().toISOString(),
  });

  return reward;
};

/**
 * Check and update challenge progress based on game event
 */
export const checkChallengeProgress = async (
  userId: string,
  eventType: string,
  eventData: any
): Promise<void> => {
  const challenges = await getActiveChallenges(userId);
  
  for (const challenge of challenges) {
    if (challenge.completed) continue;
    
    let newProgress = challenge.progress || 0;
    
    switch (challenge.category) {
      case 'wins':
        if (eventType === 'game_won') {
          newProgress += 1;
        }
        break;
        
      case 'votes':
        if (eventType === 'votes_received') {
          newProgress += eventData.votes || 0;
        }
        break;
        
      case 'creativity':
        if (eventType === 'star_earned') {
          newProgress += 1;
        }
        break;
        
      case 'social':
        if (eventType === 'friend_added') {
          newProgress += 1;
        } else if (eventType === 'game_with_friend') {
          newProgress += 1;
        }
        break;
        
      case 'skill':
        if (eventType === 'perfect_round') {
          newProgress += 1;
        } else if (eventType === 'comeback_win') {
          newProgress += 1;
        }
        break;
    }
    
    if (newProgress > (challenge.progress || 0)) {
      await updateChallengeProgress(userId, challenge.id, newProgress);
    }
  }
};

// ==================== PREDEFINED CHALLENGES ====================

export const DAILY_CHALLENGES_TEMPLATE: Omit<Challenge, 'id' | 'startDate' | 'endDate'>[] = [
  {
    type: 'daily',
    category: 'wins',
    title: 'Daily Victor',
    description: 'Win 3 games today',
    icon: '🏆',
    requirement: 3,
    reward: { xp: 100, coins: 50 },
  },
  {
    type: 'daily',
    category: 'votes',
    title: 'Vote Collector',
    description: 'Earn 20 votes today',
    icon: '⭐',
    requirement: 20,
    reward: { xp: 75, coins: 30 },
  },
  {
    type: 'daily',
    category: 'creativity',
    title: 'Star Power',
    description: 'Get 2 star responses today',
    icon: '✨',
    requirement: 2,
    reward: { xp: 150, coins: 75 },
  },
  {
    type: 'daily',
    category: 'social',
    title: 'Social Butterfly',
    description: 'Play 5 games with friends',
    icon: '🦋',
    requirement: 5,
    reward: { xp: 100, coins: 50 },
  },
  {
    type: 'daily',
    category: 'skill',
    title: 'Perfect Streak',
    description: 'Win 3 rounds in a row',
    icon: '🔥',
    requirement: 3,
    reward: { xp: 200, coins: 100 },
  },
];

export const WEEKLY_CHALLENGES_TEMPLATE: Omit<Challenge, 'id' | 'startDate' | 'endDate'>[] = [
  {
    type: 'weekly',
    category: 'wins',
    title: 'Weekly Champion',
    description: 'Win 15 games this week',
    icon: '👑',
    requirement: 15,
    reward: { xp: 500, coins: 250, badge: 'weekly_champion' },
  },
  {
    type: 'weekly',
    category: 'votes',
    title: 'Vote Master',
    description: 'Earn 100 votes this week',
    icon: '💯',
    requirement: 100,
    reward: { xp: 400, coins: 200 },
  },
  {
    type: 'weekly',
    category: 'creativity',
    title: 'Star Collector',
    description: 'Get 10 star responses this week',
    icon: '🌟',
    requirement: 10,
    reward: { xp: 600, coins: 300, emote: 'star_power' },
  },
  {
    type: 'weekly',
    category: 'social',
    title: 'Friend Zone',
    description: 'Add 5 new friends this week',
    icon: '👥',
    requirement: 5,
    reward: { xp: 300, coins: 150 },
  },
  {
    type: 'weekly',
    category: 'skill',
    title: 'Comeback King',
    description: 'Win 5 games from behind',
    icon: '🎯',
    requirement: 5,
    reward: { xp: 750, coins: 400, title: 'Comeback King' },
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Create notification for completed challenge
 */
const createChallengeCompletedNotification = async (
  userId: string,
  challenge: Challenge
): Promise<void> => {
  await addDoc(collection(firestore, 'notifications'), {
    userId,
    type: 'challenge_completed',
    title: 'Challenge Completed!',
    message: `You completed "${challenge.title}"! Claim your reward.`,
    data: { challengeId: challenge.id },
    read: false,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Generate daily challenges for today
 */
export const generateDailyChallenges = async (): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Select 3 random daily challenges
  const selectedChallenges = DAILY_CHALLENGES_TEMPLATE
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  for (const challengeTemplate of selectedChallenges) {
    await addDoc(collection(firestore, 'challenges'), {
      ...challengeTemplate,
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });
  }
};

/**
 * Generate weekly challenges
 */
export const generateWeeklyChallenges = async (): Promise<void> => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  // Select 2 random weekly challenges
  const selectedChallenges = WEEKLY_CHALLENGES_TEMPLATE
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  for (const challengeTemplate of selectedChallenges) {
    await addDoc(collection(firestore, 'challenges'), {
      ...challengeTemplate,
      startDate: monday.toISOString(),
      endDate: nextMonday.toISOString(),
    });
  }
};
