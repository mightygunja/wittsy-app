/**
 * Avatar Creator System Types
 * Complete avatar customization with unlockables
 */

// ==================== AVATAR CATEGORIES ====================

export type AvatarCategory = 
  | 'skin'
  | 'eyes'
  | 'mouth'
  | 'hair'
  | 'facial_hair'
  | 'accessories'
  | 'clothing'
  | 'background'
  | 'effects';

export type AvatarRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';

export type UnlockMethod = 
  | 'default'
  | 'level'
  | 'achievement'
  | 'purchase'
  | 'event'
  | 'season'
  | 'premium';

// ==================== AVATAR ITEM ====================

export interface AvatarItem {
  id: string;
  category: AvatarCategory;
  name: string;
  description: string;
  rarity: AvatarRarity;
  unlockMethod: UnlockMethod;
  unlockRequirement?: {
    level?: number;
    achievementId?: string;
    coins?: number;
    premium?: boolean;
    eventId?: string;
    seasonId?: string;
  };
  price?: {
    coins?: number;
    premium?: number;
  };
  emoji?: string;
  color?: string;
  gradient?: string[];
  animated?: boolean;
  exclusive?: boolean;
  limitedTime?: {
    startDate: Date;
    endDate: Date;
  };
}

// ==================== AVATAR CONFIGURATION ====================

export interface FeaturePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  canvasSize?: number; // Canvas size when position was saved, for scaling
}

export interface AvatarConfig {
  skin: string;
  eyes: string;
  mouth: string;
  hair: string;
  facialHair?: string;
  accessories: string[];
  clothing: string;
  background: string;
  effects: string[];
  // Feature positions for drag-and-drop customization
  positions?: {
    eyes?: FeaturePosition;
    mouth?: FeaturePosition;
    hair?: FeaturePosition;
    accessories?: { [key: string]: FeaturePosition };
  };
}

export interface UserAvatar {
  userId: string;
  config: AvatarConfig;
  unlockedItems: string[];
  favoriteAvatars: AvatarConfig[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AVATAR PRESETS ====================

export interface AvatarPreset {
  id: string;
  name: string;
  description: string;
  config: AvatarConfig;
  rarity: AvatarRarity;
  unlockMethod: UnlockMethod;
  price?: number;
  featured?: boolean;
}

// ==================== AVATAR SHOP ====================

export interface ShopSection {
  id: string;
  title: string;
  description: string;
  items: AvatarItem[];
  featured?: boolean;
  limitedTime?: boolean;
  discount?: number;
}

export interface ShopBundle {
  id: string;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  bundlePrice: number;
  discount: number;
  rarity: AvatarRarity;
  limitedTime?: {
    startDate: Date;
    endDate: Date;
  };
}

// ==================== AVATAR COLLECTIONS ====================

export interface AvatarCollection {
  id: string;
  name: string;
  description: string;
  items: string[];
  reward?: {
    coins?: number;
    item?: string;
    title?: string;
  };
  progress: number;
  completed: boolean;
}

// ==================== AVATAR STATS ====================

export interface AvatarStats {
  totalItems: number;
  unlockedItems: number;
  commonItems: number;
  rareItems: number;
  epicItems: number;
  legendaryItems: number;
  exclusiveItems: number;
  collectionsCompleted: number;
  coinsSpent: number;
  premiumSpent: number;
}

// ==================== DEFAULT AVATAR ITEMS ====================

export const DEFAULT_SKIN_TONES = [
  { id: 'skin_light', name: 'Light', emoji: '👱', color: '#FFE0BD' },
  { id: 'skin_medium_light', name: 'Medium Light', emoji: '👱', color: '#F1C27D' },
  { id: 'skin_medium', name: 'Medium', emoji: '👱', color: '#E0AC69' },
  { id: 'skin_medium_dark', name: 'Medium Dark', emoji: '👱', color: '#C68642' },
  { id: 'skin_dark', name: 'Dark', emoji: '👱', color: '#8D5524' },
  { id: 'skin_alien', name: 'Alien', emoji: '👽', color: '#90EE90', rarity: 'epic' as AvatarRarity },
  { id: 'skin_robot', name: 'Robot', emoji: '🤖', color: '#C0C0C0', rarity: 'legendary' as AvatarRarity },
  { id: 'skin_founder', name: 'Founder Skin', emoji: '👤', color: '#FFD700', rarity: 'exclusive' as AvatarRarity },
];

export const DEFAULT_EYES = [
  { id: 'eyes_normal', name: 'Normal', emoji: '👀' },
  { id: 'eyes_happy', name: 'Happy', emoji: '😊' },
  { id: 'eyes_wink', name: 'Wink', emoji: '😉' },
  { id: 'eyes_cool', name: 'Cool', emoji: '😎', rarity: 'rare' as AvatarRarity },
  { id: 'eyes_star', name: 'Star Eyes', emoji: '🤩', rarity: 'epic' as AvatarRarity },
  { id: 'eyes_heart', name: 'Heart Eyes', emoji: '😍', rarity: 'epic' as AvatarRarity },
  { id: 'eyes_laser', name: 'Laser Eyes', emoji: '👁️‍🗨️', rarity: 'legendary' as AvatarRarity },
  { id: 'eyes_founder', name: 'Founder Eyes', emoji: '👁️', rarity: 'epic' as AvatarRarity },
];

export const DEFAULT_MOUTHS = [
  { id: 'mouth_smile', name: 'Smile', emoji: '😊' },
  { id: 'mouth_grin', name: 'Grin', emoji: '😁' },
  { id: 'mouth_laugh', name: 'Laugh', emoji: '😂' },
  { id: 'mouth_smirk', name: 'Smirk', emoji: '😏', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_tongue', name: 'Tongue Out', emoji: '😛', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_vampire', name: 'Vampire', emoji: '🧛', rarity: 'epic' as AvatarRarity },
];

export const DEFAULT_HAIR_STYLES = [
  { id: 'hair_short', name: 'Short', emoji: '💇' },
  { id: 'hair_long', name: 'Long', emoji: '💇‍♀️' },
  { id: 'hair_curly', name: 'Curly', emoji: '👨‍🦱' },
  { id: 'hair_bald', name: 'Bald', emoji: '👨‍🦲' },
  { id: 'hair_mohawk', name: 'Mohawk', emoji: '🤘', rarity: 'rare' as AvatarRarity },
  { id: 'hair_afro', name: 'Afro', emoji: '👨‍🦱', rarity: 'rare' as AvatarRarity },
  { id: 'hair_rainbow', name: 'Rainbow', emoji: '🌈', rarity: 'epic' as AvatarRarity },
  { id: 'hair_fire', name: 'Fire Hair', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_short_blue', name: 'Blue Hair', emoji: '💇', rarity: 'rare' as AvatarRarity },
];

export const DEFAULT_ACCESSORIES = [
  { id: 'acc_none', name: 'None', emoji: '🚫' },
  { id: 'acc_glasses', name: 'Glasses', emoji: '👓', rarity: 'common' as AvatarRarity },
  { id: 'acc_sunglasses', name: 'Sunglasses', emoji: '🕶️', rarity: 'rare' as AvatarRarity },
  { id: 'acc_hat', name: 'Hat', emoji: '🎩', rarity: 'rare' as AvatarRarity },
  { id: 'acc_crown', name: 'Crown', emoji: '👑', rarity: 'epic' as AvatarRarity },
  { id: 'acc_halo', name: 'Halo', emoji: '😇', rarity: 'epic' as AvatarRarity },
  { id: 'acc_horns', name: 'Horns', emoji: '😈', rarity: 'epic' as AvatarRarity },
  { id: 'acc_wizard_hat', name: 'Wizard Hat', emoji: '🧙', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_founder_crown', name: 'Founder Crown', emoji: '👑', rarity: 'exclusive' as AvatarRarity },
];

export const DEFAULT_BACKGROUNDS = [
  { id: 'bg_white', name: 'White', color: '#FFFFFF' },
  { id: 'bg_purple', name: 'Purple', color: '#6C63FF' },
  { id: 'bg_blue', name: 'Blue', color: '#4A90E2' },
  { id: 'bg_green', name: 'Green', color: '#50E3C2' },
  { id: 'bg_pink', name: 'Pink', color: '#FF6B9D' },
  { id: 'bg_gradient_sunset', name: 'Sunset', gradient: ['#FF6B6B', '#FFD93D'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_ocean', name: 'Ocean', gradient: ['#667EEA', '#764BA2'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_fire', name: 'Fire', gradient: ['#FF512F', '#DD2476'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_animated_stars', name: 'Starry Night', animated: true, rarity: 'legendary' as AvatarRarity },
  { id: 'bg_gradient_founder', name: 'Founder Gradient', gradient: ['#FFD700', '#FFA500'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_animated_founder', name: 'Animated Founder BG', animated: true, gradient: ['#FFD700', '#FFA500', '#FF6B6B'], rarity: 'legendary' as AvatarRarity },
];

export const DEFAULT_EFFECTS = [
  { id: 'fx_none', name: 'None', emoji: '🚫' },
  { id: 'fx_sparkles', name: 'Sparkles', emoji: '✨', rarity: 'rare' as AvatarRarity },
  { id: 'fx_glow', name: 'Glow', emoji: '💫', rarity: 'rare' as AvatarRarity },
  { id: 'fx_fire', name: 'Fire', emoji: '🔥', rarity: 'epic' as AvatarRarity },
  { id: 'fx_lightning', name: 'Lightning', emoji: '⚡', rarity: 'epic' as AvatarRarity },
  { id: 'fx_rainbow', name: 'Rainbow Aura', emoji: '🌈', rarity: 'legendary' as AvatarRarity },
  { id: 'fx_founder_aura', name: 'Founder Aura', emoji: '✨', rarity: 'exclusive' as AvatarRarity },
];

// ==================== RARITY COLORS ====================

export const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#4A90E2',
  epic: '#9B59B6',
  legendary: '#F39C12',
  exclusive: '#E74C3C',
};

export const RARITY_GRADIENTS = {
  common: ['#9E9E9E', '#757575'],
  rare: ['#4A90E2', '#357ABD'],
  epic: ['#9B59B6', '#8E44AD'],
  legendary: ['#F39C12', '#E67E22'],
  exclusive: ['#E74C3C', '#C0392B'],
};

// ==================== DEFAULT AVATAR ====================

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin: 'skin_light',
  eyes: 'eyes_normal',
  mouth: 'mouth_smile',
  hair: 'hair_short',
  accessories: [],
  clothing: 'clothing_casual',
  background: 'bg_purple',
  effects: [],
};
