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
    // Level 1
    {
      level: 1,
      free: { type: 'coins', amount: 50, icon: '🪙' },
      premium: { type: 'coins', amount: 200, icon: '🪙' },
    },
    // Level 5
    {
      level: 5,
      free: { type: 'avatar', itemId: 'hair_short_blue', name: 'Blue Hair', icon: '💇', rarity: 'rare' },
      premium: { type: 'avatar', itemId: 'hair_fire', name: 'Fire Hair', icon: '🔥', rarity: 'legendary' },
    },
    // Level 10
    {
      level: 10,
      premium: { type: 'coins', amount: 500, icon: '🪙' },
    },
    // Level 15
    {
      level: 15,
      free: { type: 'coins', amount: 100, icon: '🪙' },
      premium: { type: 'avatar', itemId: 'skin_founder', name: 'Founder Skin', icon: '👤', rarity: 'exclusive' },
    },
    // Level 20
    {
      level: 20,
      premium: { type: 'premium', amount: 10, icon: '💎' },
    },
    // Level 25
    {
      level: 25,
      free: { type: 'avatar', itemId: 'bg_gradient_founder', name: 'Founder BG', icon: '🎨', rarity: 'epic' },
      premium: { type: 'avatar', itemId: 'bg_animated_founder', name: 'Animated Founder BG', icon: '✨', rarity: 'legendary' },
    },
    // Level 30
    {
      level: 30,
      premium: { type: 'coins', amount: 750, icon: '🪙' },
    },
    // Level 35
    {
      level: 35,
      free: { type: 'coins', amount: 150, icon: '🪙' },
      premium: { type: 'xp_boost', amount: 50, name: 'XP Boost 50%', icon: '⚡' },
    },
    // Level 40
    {
      level: 40,
      premium: { type: 'avatar', itemId: 'eyes_founder', name: 'Founder Eyes', icon: '👁️', rarity: 'epic' },
    },
    // Level 50
    {
      level: 50,
      free: { type: 'title', itemId: 'dedicated', name: 'Dedicated', icon: '🏅' },
      premium: { type: 'avatar', itemId: 'founder_set_1', name: 'Founder Set', icon: '👑', rarity: 'exclusive' },
    },
    // Level 60
    {
      level: 60,
      premium: { type: 'coins', amount: 1000, icon: '🪙' },
    },
    // Level 70
    {
      level: 70,
      free: { type: 'coins', amount: 200, icon: '🪙' },
      premium: { type: 'premium', amount: 25, icon: '💎' },
    },
    // Level 75
    {
      level: 75,
      premium: { type: 'avatar', itemId: 'fx_founder_aura', name: 'Founder Aura', icon: '✨', rarity: 'legendary' },
    },
    // Level 80
    {
      level: 80,
      premium: { type: 'coins', amount: 1500, icon: '🪙' },
    },
    // Level 90
    {
      level: 90,
      free: { type: 'coins', amount: 500, icon: '🪙' },
      premium: { type: 'avatar', itemId: 'acc_founder_crown', name: 'Founder Crown', icon: '👑', rarity: 'exclusive' },
    },
    // Level 100
    {
      level: 100,
      free: { type: 'title', itemId: 'completionist', name: 'Completionist', icon: '🏆' },
      premium: {
        type: 'avatar',
        itemId: 'founder_ultimate_set',
        name: 'Ultimate Founder Set',
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
