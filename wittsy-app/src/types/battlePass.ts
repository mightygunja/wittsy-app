/**
 * Battle Pass System Types
 * Seasonal progression and rewards
 */

export interface BattlePassReward {
  level: number;
  free?: RewardItem;
  premium?: RewardItem;
}

export interface RewardItem {
  type: 'coins' | 'premium' | 'avatar' | 'title' | 'badge' | 'xp_boost';
  amount?: number;
  itemId?: string;
  name?: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
}

export interface BattlePassSeason {
  id: string;
  name: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  price: number;
  maxLevel: number;
  xpPerLevel: number;
  rewards: BattlePassReward[];
  featured?: boolean;
}

export interface UserBattlePass {
  userId: string;
  seasonId: string;
  isPremium: boolean;
  currentLevel: number;
  currentXP: number;
  claimedRewards: number[];
  purchaseDate?: Date;
  lastXPGain?: Date;
}

export interface BattlePassChallenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'seasonal';
  xpReward: number;
  requirement: {
    type: 'games_played' | 'games_won' | 'votes_received' | 'friends_invited' | 'login_streak';
    target: number;
  };
  progress: number;
  completed: boolean;
  expiresAt?: Date;
}

export interface BattlePassStats {
  totalXP: number;
  currentLevel: number;
  nextLevelXP: number;
  progressPercent: number;
  claimedRewards: number;
  totalRewards: number;
  daysRemaining: number;
  isPremium: boolean;
}

// Season 1: Founders Pass
export const SEASON_1: BattlePassSeason = {
  id: 'season_1',
  name: 'Founders Pass',
  description: 'Exclusive rewards for our founding players!',
  theme: 'Launch',
  startDate: new Date('2025-12-22'),
  endDate: new Date('2026-02-20'),
  price: 4.99,
  maxLevel: 100,
  xpPerLevel: 100,
  featured: true,
  rewards: [
    // Level 1 - Welcome Rewards
    {
      level: 1,
      free: { type: 'coins', amount: 50, name: 'Starter Coins', icon: '🪙' },
      premium: { type: 'coins', amount: 200, name: 'Premium Welcome Bonus', icon: '💰' },
    },
    // Level 3
    {
      level: 3,
      free: { type: 'avatar', itemId: 'eyes_happy', name: 'Joyful Eyes', icon: '😊', rarity: 'common' },
      premium: { type: 'avatar', itemId: 'hair_spiky', name: 'Anime Spikes', icon: '⚡', rarity: 'rare' },
    },
    // Level 5 - First Major Reward
    {
      level: 5,
      free: { type: 'avatar', itemId: 'hair_short_blue', name: 'Electric Blue Hair', icon: '💇', rarity: 'rare' },
      premium: { type: 'avatar', itemId: 'hair_fire', name: 'Inferno Blaze', icon: '🔥', rarity: 'legendary' },
    },
    // Level 7
    {
      level: 7,
      premium: { type: 'coins', amount: 300, name: 'Coin Boost', icon: '🪙' },
    },
    // Level 10 - Milestone
    {
      level: 10,
      free: { type: 'coins', amount: 100, name: 'Milestone Bonus', icon: '🎯' },
      premium: { type: 'coins', amount: 500, name: 'Premium Milestone', icon: '💎' },
    },
    // Level 12
    {
      level: 12,
      premium: { type: 'avatar', itemId: 'acc_sunglasses', name: 'Cool Shades', icon: '🕶️', rarity: 'rare' },
    },
    // Level 15 - Exclusive Skin
    {
      level: 15,
      free: { type: 'avatar', itemId: 'bg_gradient_sunset', name: 'Golden Sunset', icon: '🌅', rarity: 'rare' },
      premium: { type: 'avatar', itemId: 'skin_founder', name: 'Founder\'s Mark', icon: '👤', rarity: 'exclusive' },
    },
    // Level 18
    {
      level: 18,
      premium: { type: 'avatar', itemId: 'eyes_star', name: 'Starstruck', icon: '🤩', rarity: 'epic' },
    },
    // Level 20 - Premium Currency
    {
      level: 20,
      free: { type: 'coins', amount: 150, name: 'Progress Reward', icon: '🪙' },
      premium: { type: 'premium', amount: 10, name: 'Premium Gems', icon: '💎' },
    },
    // Level 25 - Quarter Mark
    {
      level: 25,
      free: { type: 'avatar', itemId: 'bg_gradient_founder', name: 'Founder\'s Glory', icon: '🎨', rarity: 'epic' },
      premium: { type: 'avatar', itemId: 'bg_animated_founder', name: 'Founder\'s Radiance', icon: '✨', rarity: 'legendary' },
    },
    // Level 28
    {
      level: 28,
      premium: { type: 'avatar', itemId: 'hair_galaxy', name: 'Galaxy Hair', icon: '🌌', rarity: 'epic' },
    },
    // Level 30
    {
      level: 30,
      free: { type: 'coins', amount: 200, name: 'Dedication Bonus', icon: '🏅' },
      premium: { type: 'coins', amount: 750, name: 'Elite Reward', icon: '💰' },
    },
    // Level 35 - XP Boost
    {
      level: 35,
      free: { type: 'avatar', itemId: 'acc_crown', name: 'Royal Crown', icon: '👑', rarity: 'epic' },
      premium: { type: 'xp_boost', amount: 50, name: 'Legendary XP Boost', icon: '⚡' },
    },
    // Level 40 - Midpoint
    {
      level: 40,
      free: { type: 'coins', amount: 250, name: 'Halfway Bonus', icon: '🎯' },
      premium: { type: 'avatar', itemId: 'eyes_founder', name: 'Founder\'s Gaze', icon: '👁️', rarity: 'epic' },
    },
    // Level 45
    {
      level: 45,
      premium: { type: 'avatar', itemId: 'acc_phoenix_crown', name: 'Phoenix Crown', icon: '🔥', rarity: 'legendary' },
    },
    // Level 50 - Major Milestone
    {
      level: 50,
      free: { type: 'title', itemId: 'dedicated', name: 'The Dedicated', icon: '🏅' },
      premium: { type: 'avatar', itemId: 'hair_phoenix', name: 'Phoenix Flames', icon: '🔥', rarity: 'legendary' },
    },
    // Level 55
    {
      level: 55,
      premium: { type: 'coins', amount: 1000, name: 'Elite Cache', icon: '💰' },
    },
    // Level 60
    {
      level: 60,
      free: { type: 'coins', amount: 300, name: 'Champion\'s Reward', icon: '🏆' },
      premium: { type: 'avatar', itemId: 'bg_animated_lightning', name: 'Thunder Storm', icon: '⚡', rarity: 'legendary' },
    },
    // Level 65
    {
      level: 65,
      premium: { type: 'avatar', itemId: 'fx_phoenix', name: 'Phoenix Wings', icon: '🔥', rarity: 'legendary' },
    },
    // Level 70
    {
      level: 70,
      free: { type: 'coins', amount: 400, name: 'Mastery Bonus', icon: '💎' },
      premium: { type: 'premium', amount: 25, name: 'Premium Treasure', icon: '💎' },
    },
    // Level 75 - Legendary Aura
    {
      level: 75,
      free: { type: 'avatar', itemId: 'fx_sparkles', name: 'Sparkle Trail', icon: '✨', rarity: 'rare' },
      premium: { type: 'avatar', itemId: 'fx_founder_aura', name: 'Founder\'s Radiance', icon: '✨', rarity: 'exclusive' },
    },
    // Level 80
    {
      level: 80,
      free: { type: 'coins', amount: 500, name: 'Elite Cache', icon: '🪙' },
      premium: { type: 'coins', amount: 1500, name: 'Legendary Hoard', icon: '💰' },
    },
    // Level 85
    {
      level: 85,
      premium: { type: 'avatar', itemId: 'eyes_galaxy', name: 'Cosmic Eyes', icon: '🌌', rarity: 'legendary' },
    },
    // Level 90 - Near Completion
    {
      level: 90,
      free: { type: 'coins', amount: 750, name: 'Grand Reward', icon: '🏆' },
      premium: { type: 'avatar', itemId: 'acc_founder_crown', name: 'Founder\'s Crown', icon: '👑', rarity: 'exclusive' },
    },
    // Level 95
    {
      level: 95,
      premium: { type: 'avatar', itemId: 'bg_champion', name: 'Champion\'s Arena', icon: '🏆', rarity: 'exclusive' },
    },
    // Level 100 - Ultimate Reward
    {
      level: 100,
      free: { type: 'title', itemId: 'completionist', name: 'The Completionist', icon: '🏆' },
      premium: {
        type: 'avatar',
        itemId: 'acc_ultimate_set',
        name: 'Ultimate Champion Set',
        icon: '💫',
        rarity: 'exclusive',
      },
    },
  ],
};

// XP Sources
export const XP_REWARDS = {
  GAME_PLAYED: 10,
  GAME_WON: 25,
  ROUND_WON: 5,
  DAILY_CHALLENGE: 50,
  WEEKLY_CHALLENGE: 200,
  FRIEND_GAME: 15,
  VOTE_RECEIVED: 3,
  PERFECT_SCORE: 50,
};

// Level Skip Pricing
export const LEVEL_SKIP_PRICES = {
  SINGLE: 0.99, // $0.99 per level
  FIVE: 3.99, // $3.99 for 5 levels (20% off)
  TEN: 6.99, // $6.99 for 10 levels (30% off)
  TWENTY_FIVE: 14.99, // $14.99 for 25 levels (40% off)
};
