import { RANK_TIERS } from './constants';

/**
 * Get rank name based on rating
 */
export const getRankFromRating = (rating: number): string => {
  const tier = RANK_TIERS.find(t => rating >= t.min && rating <= t.max);
  if (!tier) return 'Bronze I';
  
  // Determine division within tier
  const rangeSize = tier.max - tier.min + 1;
  const divisionSize = rangeSize / 5;
  const positionInTier = rating - tier.min;
  const division = Math.min(4, Math.floor(positionInTier / divisionSize));
  
  const divisions = ['V', 'IV', 'III', 'II', 'I'];
  return `${tier.name} ${divisions[division]}`;
};

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Calculate level from XP
 */
export const getLevelFromXP = (xp: number): number => {
  let level = 1;
  let remainingXP = xp;
  
  while (remainingXP >= 100 && level < 10) {
    remainingXP -= 100;
    level++;
  }
  
  while (remainingXP >= 250 && level < 25) {
    remainingXP -= 250;
    level++;
  }
  
  while (remainingXP >= 500 && level < 50) {
    remainingXP -= 500;
    level++;
  }
  
  while (remainingXP >= 1000) {
    remainingXP -= 1000;
    level++;
  }
  
  return level;
};

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
};

/**
 * Generate a random room code
 */
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
