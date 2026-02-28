import { firestore } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { Achievement, AchievementReward } from '../types';
import { rewards } from './rewardsService';
import { avatarService } from './avatarService';
import { analytics } from './analytics';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Starter Achievements
  { id: 'first_game', name: 'First Game', description: 'Play your first game', icon: '🎮', category: 'starter', requirement: 1, reward: { coins: 50 } },
  { id: 'first_win', name: 'First Win', description: 'Win your first game', icon: '🏆', category: 'starter', requirement: 1, reward: { coins: 100, title: 'Winner' } },
  { id: 'first_star', name: 'First Star', description: 'Earn your first star (4+ votes)', icon: '⭐', category: 'starter', requirement: 1, reward: { coins: 75 } },
  { id: 'voter_badge', name: "Voter's Badge", description: 'Cast 100 votes', icon: '🗳️', category: 'starter', requirement: 100, reward: { coins: 200, badge: 'voter' } },
  
  // Skill Achievements
  { id: 'superstar', name: 'Superstar', description: 'Earn 10 stars', icon: '🌟', category: 'skill', requirement: 10, reward: { coins: 300, title: 'Superstar' } },
  { id: 'unanimous', name: 'Unanimous', description: 'Win a round with all votes', icon: '💯', category: 'skill', requirement: 1, reward: { coins: 150, badge: 'unanimous' } },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Win a game without losing a round', icon: '✨', category: 'skill', requirement: 1, reward: { coins: 250, title: 'Perfectionist' } },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Submit in under 5 seconds', icon: '⚡', category: 'skill', requirement: 1, reward: { coins: 100, badge: 'speed_demon' } },
  { id: 'comeback_king', name: 'Comeback King', description: 'Win after being behind by 5 rounds', icon: '👑', category: 'skill', requirement: 1, reward: { coins: 300, title: 'Comeback King', avatarItem: 'acc_crown' } },
  { id: 'wordsmith', name: 'Wordsmith', description: 'Win with phrases under 20 characters', icon: '📝', category: 'skill', requirement: 10, reward: { coins: 200, title: 'Wordsmith' } },
  
  // Social Achievements
  { id: 'host_master', name: 'Host with the Most', description: 'Host 25 games', icon: '🎪', category: 'social', requirement: 25, reward: { coins: 400, title: 'Host Master' } },
  { id: 'friend_maker', name: 'Friend Maker', description: 'Play with 10 different friends', icon: '👥', category: 'social', requirement: 10, reward: { coins: 250, badge: 'friend_maker' } },
  { id: 'crowd_pleaser', name: 'Crowd Pleaser', description: 'Get 1000 total votes', icon: '👏', category: 'social', requirement: 1000, reward: { coins: 500, title: 'Crowd Pleaser', avatarItem: 'acc_megaphone' } },
  
  // Milestone Achievements
  { id: 'veteran_100', name: 'Veteran', description: 'Play 100 games', icon: '🎖️', category: 'milestone', requirement: 100, reward: { coins: 500, title: 'Veteran', badge: 'veteran' } },
  { id: 'veteran_500', name: 'Seasoned Veteran', description: 'Play 500 games', icon: '🏅', category: 'milestone', requirement: 500, reward: { coins: 1000, title: 'Seasoned Veteran', avatarItem: 'acc_medal' } },
  { id: 'veteran_1000', name: 'Legend', description: 'Play 1000 games', icon: '🦸', category: 'milestone', requirement: 1000, reward: { coins: 2000, title: 'Legend', avatarItem: 'acc_legendary_aura' } },
  { id: 'champion_50', name: 'Champion', description: 'Win 50 games', icon: '👑', category: 'milestone', requirement: 50, reward: { coins: 600, title: 'Champion' } },
  { id: 'champion_100', name: 'Grand Champion', description: 'Win 100 games', icon: '💎', category: 'milestone', requirement: 100, reward: { coins: 1200, title: 'Grand Champion', avatarItem: 'acc_diamond_crown' } },
  { id: 'champion_250', name: 'Ultimate Champion', description: 'Win 250 games', icon: '🔱', category: 'milestone', requirement: 250, reward: { coins: 2500, title: 'Ultimate Champion', avatarItem: 'acc_trident' } },
  { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', icon: '🌠', category: 'milestone', requirement: 10, reward: { coins: 300, title: 'Rising Star' } },
  { id: 'level_25', name: 'Experienced', description: 'Reach level 25', icon: '🔆', category: 'milestone', requirement: 25, reward: { coins: 600, title: 'Experienced' } },
  { id: 'level_50', name: 'Master', description: 'Reach level 50', icon: '👨‍🎓', category: 'milestone', requirement: 50, reward: { coins: 1000, title: 'Master', avatarItem: 'acc_graduation_cap' } },
  { id: 'level_100', name: 'Grandmaster', description: 'Reach level 100', icon: '🎓', category: 'milestone', requirement: 100, reward: { coins: 2000, title: 'Grandmaster', avatarItem: 'acc_master_robe' } },
];

// Get user achievements from Firestore
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
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
  } catch (error: any) {
    // Handle permissions errors gracefully
    if (error?.code === 'permission-denied') {
      console.warn('Achievements feature requires Firestore permissions. Returning empty achievements.');
      return [];
    }
    throw error;
  }
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
      
      // Grant rewards and create notification
      await grantAchievementRewards(userId, achievement);
      await createAchievementNotification(userId, achievement);
      
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

/**
 * Grant achievement rewards to user
 */
const grantAchievementRewards = async (userId: string, achievement: Achievement): Promise<void> => {
  if (!achievement.reward) return;

  const reward = achievement.reward;

  try {
    // Grant coins
    if (reward.coins) {
      await rewards.grantCoins(userId, reward.coins, `achievement_${achievement.id}`);
      console.log(`✅ Granted ${reward.coins} coins for achievement: ${achievement.name}`);
    }

    // Unlock avatar item
    if (reward.avatarItem) {
      await avatarService.unlockItem(userId, reward.avatarItem, 'achievement');
      console.log(`✅ Unlocked avatar item ${reward.avatarItem} for achievement: ${achievement.name}`);
    }

    // Grant title
    if (reward.title) {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const unlockedTitles = userData.unlockedTitles || [];
        
        if (!unlockedTitles.includes(reward.title)) {
          await updateDoc(userRef, {
            unlockedTitles: [...unlockedTitles, reward.title]
          });
          console.log(`✅ Unlocked title "${reward.title}" for achievement: ${achievement.name}`);
        }
      }
    }

    // Grant badge
    if (reward.badge) {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const badges = userData.badges || [];
        
        if (!badges.includes(reward.badge)) {
          await updateDoc(userRef, {
            badges: [...badges, reward.badge]
          });
          console.log(`✅ Unlocked badge "${reward.badge}" for achievement: ${achievement.name}`);
        }
      }
    }

    // Track analytics
    analytics.logEvent('achievement_reward_granted', {
      user_id: userId,
      achievement_id: achievement.id,
      achievement_name: achievement.name,
      coins: reward.coins || 0,
      has_avatar_item: !!reward.avatarItem,
      has_title: !!reward.title,
      has_badge: !!reward.badge,
    });
  } catch (error) {
    console.error('Failed to grant achievement rewards:', error);
  }
};

/**
 * Create notification for achievement unlock
 */
const createAchievementNotification = async (userId: string, achievement: Achievement): Promise<void> => {
  try {
    const notificationsRef = collection(firestore, 'notifications');
    
    // Build reward message
    const rewardParts: string[] = [];
    if (achievement.reward?.coins) rewardParts.push(`${achievement.reward.coins} coins`);
    if (achievement.reward?.title) rewardParts.push(`"${achievement.reward.title}" title`);
    if (achievement.reward?.avatarItem) rewardParts.push('avatar item');
    if (achievement.reward?.badge) rewardParts.push('badge');
    
    const rewardMessage = rewardParts.length > 0 
      ? ` You earned: ${rewardParts.join(', ')}!`
      : '';

    await setDoc(doc(notificationsRef), {
      userId,
      type: 'achievement',
      title: `🏆 Achievement Unlocked!`,
      message: `${achievement.name}${rewardMessage}`,
      data: {
        achievementId: achievement.id,
        achievementName: achievement.name,
        reward: achievement.reward,
      },
      read: false,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Created notification for achievement: ${achievement.name}`);
  } catch (error) {
    console.error('Failed to create achievement notification:', error);
  }
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

  // Grant rewards
  await grantAchievementRewards(userId, achievement);

  // Create notification
  await createAchievementNotification(userId, achievement);
  
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
