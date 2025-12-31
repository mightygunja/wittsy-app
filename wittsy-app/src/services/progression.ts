import { firestore } from './firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * XP and Leveling System
 * Handles user progression, level-ups, and XP calculations
 */

// XP Sources and Values
export const XP_VALUES = {
  ROUND_PARTICIPATION: 10,
  ROUND_WIN: 25,
  GAME_WIN: 100,
  STAR_ACHIEVEMENT: 50,
  FIRST_GAME_OF_DAY: 20,
  VOTING_PARTICIPATION: 5,
  PERFECT_GAME: 75,
  COMEBACK_WIN: 40,
  UNANIMOUS_VOTE: 30,
};

// Level Requirements
export const getXPForLevel = (level: number): number => {
  if (level <= 10) return 100;
  if (level <= 25) return 250;
  if (level <= 50) return 500;
  return 1000;
};

// Calculate total XP needed to reach a level
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

// Calculate level from total XP
export const getLevelFromXP = (xp: number): number => {
  let level = 1;
  let requiredXP = 0;
  
  while (xp >= requiredXP + getXPForLevel(level)) {
    requiredXP += getXPForLevel(level);
    level++;
  }
  
  return level;
};

// Get XP progress for current level
export const getXPProgress = (xp: number, level: number): { current: number; required: number; percentage: number } => {
  const totalXPForCurrentLevel = getTotalXPForLevel(level);
  const totalXPForNextLevel = getTotalXPForLevel(level + 1);
  const currentLevelXP = xp - totalXPForCurrentLevel;
  const requiredXP = totalXPForNextLevel - totalXPForCurrentLevel;
  
  return {
    current: currentLevelXP,
    required: requiredXP,
    percentage: Math.round((currentLevelXP / requiredXP) * 100),
  };
};

// Award XP to user
export const awardXP = async (
  userId: string,
  amount: number,
  reason: string
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> => {
  console.log(`⭐ awardXP called: userId=${userId}, amount=${amount}, reason=${reason}`);
  
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.error(`❌ User ${userId} not found!`);
    throw new Error('User not found');
  }
  
  const currentXP = userDoc.data().xp || 0;
  const currentLevel = userDoc.data().level || 1;
  const newXP = currentXP + amount;
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > currentLevel;
  
  console.log(`📊 XP Update: ${currentXP} → ${newXP}, Level: ${currentLevel} → ${newLevel}, Leveled up: ${leveledUp}`);
  
  try {
    await updateDoc(userRef, {
      xp: newXP,
      level: newLevel,
      lastActive: new Date().toISOString(),
    });
    console.log(`✅ Successfully updated user ${userId} XP and level`);
  } catch (error) {
    console.error(`❌ Failed to update user ${userId}:`, error);
    throw error;
  }
  
  return { newXP, newLevel, leveledUp };
};

// Get level rewards/unlocks
export const getLevelRewards = (level: number): string[] => {
  const rewards: string[] = [];
  
  if (level === 5) rewards.push('🎨 New avatar customization options');
  if (level === 10) rewards.push('⭐ "Rising Star" title unlocked');
  if (level === 15) rewards.push('🎭 Advanced prompt packs unlocked');
  if (level === 20) rewards.push('👑 Custom room themes unlocked');
  if (level === 25) rewards.push('🌟 "Experienced" title unlocked');
  if (level === 30) rewards.push('🎪 Host special events');
  if (level === 40) rewards.push('💎 Premium avatar items');
  if (level === 50) rewards.push('🎓 "Master" title unlocked');
  if (level === 75) rewards.push('🔥 Legendary prompt pack');
  if (level === 100) rewards.push('👨‍🎓 "Grandmaster" title unlocked');
  
  return rewards;
};

// Title system
export const TITLES = {
  NEWBIE: { id: 'newbie', name: 'Newbie', requirement: 'Start playing', icon: '🆕' },
  RISING_STAR: { id: 'rising_star', name: 'Rising Star', requirement: 'Reach level 10', icon: '🌠' },
  EXPERIENCED: { id: 'experienced', name: 'Experienced', requirement: 'Reach level 25', icon: '🔆' },
  MASTER: { id: 'master', name: 'Master', requirement: 'Reach level 50', icon: '👨‍🎓' },
  GRANDMASTER: { id: 'grandmaster', name: 'Grandmaster', requirement: 'Reach level 100', icon: '🎓' },
  CHAMPION: { id: 'champion', name: 'Champion', requirement: 'Win 50 games', icon: '👑' },
  LEGEND: { id: 'legend', name: 'Legend', requirement: 'Reach Legend rank', icon: '🦸' },
  WORDSMITH: { id: 'wordsmith', name: 'Wordsmith', requirement: 'Win 10 rounds with short phrases', icon: '📝' },
  COMEDIAN: { id: 'comedian', name: 'Comedian', requirement: 'Earn 100 stars', icon: '😂' },
  PERFECTIONIST: { id: 'perfectionist', name: 'Perfectionist', requirement: 'Win 5 perfect games', icon: '✨' },
};

// Get available titles for user
export const getAvailableTitles = (userProfile: any): string[] => {
  const titles: string[] = [TITLES.NEWBIE.id];
  
  if (userProfile.level >= 10) titles.push(TITLES.RISING_STAR.id);
  if (userProfile.level >= 25) titles.push(TITLES.EXPERIENCED.id);
  if (userProfile.level >= 50) titles.push(TITLES.MASTER.id);
  if (userProfile.level >= 100) titles.push(TITLES.GRANDMASTER.id);
  if (userProfile.stats.gamesWon >= 50) titles.push(TITLES.CHAMPION.id);
  if (userProfile.rank?.includes('Legend')) titles.push(TITLES.LEGEND.id);
  if (userProfile.stats.shortestWinningPhraseLength > 0 && userProfile.stats.shortestWinningPhraseLength <= 20) {
    titles.push(TITLES.WORDSMITH.id);
  }
  if (userProfile.stats.starsEarned >= 100) titles.push(TITLES.COMEDIAN.id);
  if (userProfile.stats.perfectGames >= 5) titles.push(TITLES.PERFECTIONIST.id);
  
  return titles;
};

// Update user's selected title
export const updateUserTitle = async (userId: string, titleId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    selectedTitle: titleId,
  });
};
