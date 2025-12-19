import { firestore } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { Achievement } from '../types';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Starter Achievements
  { id: 'first_game', name: 'First Game', description: 'Play your first game', icon: '🎮', category: 'starter', requirement: 1 },
  { id: 'first_win', name: 'First Win', description: 'Win your first game', icon: '🏆', category: 'starter', requirement: 1 },
  { id: 'first_star', name: 'First Star', description: 'Earn your first star (6+ votes)', icon: '⭐', category: 'starter', requirement: 1 },
  { id: 'voter_badge', name: "Voter's Badge", description: 'Cast 100 votes', icon: '🗳️', category: 'starter', requirement: 100 },
  
  // Skill Achievements
  { id: 'superstar', name: 'Superstar', description: 'Earn 10 stars', icon: '🌟', category: 'skill', requirement: 10 },
  { id: 'unanimous', name: 'Unanimous', description: 'Win a round with all votes', icon: '💯', category: 'skill', requirement: 1 },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Win a game without losing a round', icon: '✨', category: 'skill', requirement: 1 },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Submit in under 5 seconds', icon: '⚡', category: 'skill', requirement: 1 },
  { id: 'comeback_king', name: 'Comeback King', description: 'Win after being behind by 5 rounds', icon: '👑', category: 'skill', requirement: 1 },
  { id: 'wordsmith', name: 'Wordsmith', description: 'Win with phrases under 20 characters', icon: '📝', category: 'skill', requirement: 10 },
  
  // Social Achievements
  { id: 'host_master', name: 'Host with the Most', description: 'Host 25 games', icon: '🎪', category: 'social', requirement: 25 },
  { id: 'friend_maker', name: 'Friend Maker', description: 'Play with 10 different friends', icon: '👥', category: 'social', requirement: 10 },
  { id: 'crowd_pleaser', name: 'Crowd Pleaser', description: 'Get 1000 total votes', icon: '👏', category: 'social', requirement: 1000 },
  
  // Milestone Achievements
  { id: 'veteran_100', name: 'Veteran', description: 'Play 100 games', icon: '🎖️', category: 'milestone', requirement: 100 },
  { id: 'veteran_500', name: 'Seasoned Veteran', description: 'Play 500 games', icon: '🏅', category: 'milestone', requirement: 500 },
  { id: 'veteran_1000', name: 'Legend', description: 'Play 1000 games', icon: '🦸', category: 'milestone', requirement: 1000 },
  { id: 'champion_50', name: 'Champion', description: 'Win 50 games', icon: '👑', category: 'milestone', requirement: 50 },
  { id: 'champion_100', name: 'Grand Champion', description: 'Win 100 games', icon: '💎', category: 'milestone', requirement: 100 },
  { id: 'champion_250', name: 'Ultimate Champion', description: 'Win 250 games', icon: '🔱', category: 'milestone', requirement: 250 },
  { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', icon: '🌠', category: 'milestone', requirement: 10 },
  { id: 'level_25', name: 'Experienced', description: 'Reach level 25', icon: '🔆', category: 'milestone', requirement: 25 },
  { id: 'level_50', name: 'Master', description: 'Reach level 50', icon: '👨‍🎓', category: 'milestone', requirement: 50 },
  { id: 'level_100', name: 'Grandmaster', description: 'Reach level 100', icon: '🎓', category: 'milestone', requirement: 100 },
];

// Get user achievements from Firestore
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  const achievementsRef = collection(firestore, 'achievements');
  const q = query(achievementsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Initialize achievements for new user
    return await initializeUserAchievements(userId);
  }
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Achievement));
};

// Initialize achievements for a new user
export const initializeUserAchievements = async (userId: string): Promise<Achievement[]> => {
  const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    progress: 0,
    unlocked: false
  }));
  
  const batch: Promise<void>[] = [];
  
  for (const achievement of achievements) {
    const achievementRef = doc(firestore, 'achievements', `${userId}_${achievement.id}`);
    batch.push(setDoc(achievementRef, {
      ...achievement,
      userId
    }));
  }
  
  await Promise.all(batch);
  return achievements;
};

// Check and unlock achievements based on user stats
export const checkAchievements = async (userId: string, stats: any): Promise<string[]> => {
  const achievements = await getUserAchievements(userId);
  const newlyUnlocked: string[] = [];
  
  for (const achievement of achievements) {
    if (achievement.unlocked) continue;
    
    let currentProgress = 0;
    
    // Calculate progress based on achievement type
    switch (achievement.id) {
      case 'first_game':
        currentProgress = stats.gamesPlayed;
        break;
      case 'first_win':
        currentProgress = stats.gamesWon;
        break;
      case 'first_star':
        currentProgress = stats.starsEarned;
        break;
      case 'voter_badge':
        currentProgress = stats.totalVotes;
        break;
      case 'superstar':
        currentProgress = stats.starsEarned;
        break;
      case 'unanimous':
        currentProgress = stats.unanimousVotes || 0;
        break;
      case 'perfectionist':
        currentProgress = stats.perfectGames || 0;
        break;
      case 'comeback_king':
        currentProgress = stats.comebackWins || 0;
        break;
      case 'wordsmith':
        currentProgress = stats.shortestWinningPhraseLength <= 20 ? 1 : 0;
        break;
      case 'crowd_pleaser':
        currentProgress = stats.totalVotes;
        break;
      case 'veteran_100':
      case 'veteran_500':
      case 'veteran_1000':
        currentProgress = stats.gamesPlayed;
        break;
      case 'champion_50':
      case 'champion_100':
      case 'champion_250':
        currentProgress = stats.gamesWon;
        break;
      case 'level_10':
      case 'level_25':
      case 'level_50':
      case 'level_100':
        currentProgress = stats.level || 1;
        break;
      default:
        currentProgress = achievement.progress;
    }
    
    // Check if achievement should be unlocked
    if (currentProgress >= achievement.requirement) {
      const achievementRef = doc(firestore, 'achievements', `${userId}_${achievement.id}`);
      await updateDoc(achievementRef, {
        progress: currentProgress,
        unlocked: true,
        unlockedAt: new Date().toISOString()
      });
      newlyUnlocked.push(achievement.name);
    } else if (currentProgress > achievement.progress) {
      // Update progress
      const achievementRef = doc(firestore, 'achievements', `${userId}_${achievement.id}`);
      await updateDoc(achievementRef, {
        progress: currentProgress
      });
    }
  }
  
  return newlyUnlocked;
};

// Unlock a specific achievement
export const unlockAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
  const achievementRef = doc(firestore, 'achievements', `${userId}_${achievementId}`);
  const achievementDoc = await getDoc(achievementRef);
  
  if (!achievementDoc.exists()) {
    console.error('Achievement not found:', achievementId);
    return false;
  }
  
  const achievement = achievementDoc.data() as Achievement;
  
  if (achievement.unlocked) {
    return false; // Already unlocked
  }
  
  await updateDoc(achievementRef, {
    unlocked: true,
    unlockedAt: new Date().toISOString(),
    progress: achievement.requirement
  });
  
  return true;
};

// Get achievement progress
export const getAchievementProgress = async (userId: string, achievementId: string): Promise<Achievement | null> => {
  const achievementRef = doc(firestore, 'achievements', `${userId}_${achievementId}`);
  const achievementDoc = await getDoc(achievementRef);
  
  if (!achievementDoc.exists()) {
    return null;
  }
  
  return achievementDoc.data() as Achievement;
};
