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
  | 'face_paint'
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
  facePaint?: string;
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
  // Common - All have SVG implementations
  { id: 'eyes_normal', name: 'Normal Eyes', emoji: '👀', rarity: 'common' as AvatarRarity },
  { id: 'eyes_happy', name: 'Happy Eyes', emoji: '😊', rarity: 'common' as AvatarRarity },
  { id: 'eyes_wink', name: 'Winking', emoji: '😉', rarity: 'common' as AvatarRarity },
  { id: 'eyes_sleepy', name: 'Sleepy Eyes', emoji: '�', rarity: 'common' as AvatarRarity },
  { id: 'eyes_surprised', name: 'Surprised Eyes', emoji: '😲', rarity: 'common' as AvatarRarity },
  // Rare - All have SVG implementations
  { id: 'eyes_angry', name: 'Angry Eyes', emoji: '😠', rarity: 'rare' as AvatarRarity },
  { id: 'eyes_crying', name: 'Crying Eyes', emoji: '😂', rarity: 'rare' as AvatarRarity },
  // Epic - All have SVG implementations
  { id: 'eyes_star', name: 'Star Eyes', emoji: '⭐', rarity: 'epic' as AvatarRarity },
  { id: 'eyes_heart', name: 'Heart Eyes', emoji: '�', rarity: 'epic' as AvatarRarity },
  { id: 'eyes_money', name: 'Money Eyes', emoji: '💰', rarity: 'epic' as AvatarRarity },
  { id: 'eyes_fire', name: 'Fire Eyes', emoji: '🔥', rarity: 'epic' as AvatarRarity },
  // Legendary - Need SVG implementations (will use emoji fallback for now)
  { id: 'eyes_laser', name: 'Laser Eyes', emoji: '👁️', rarity: 'legendary' as AvatarRarity },
  { id: 'eyes_galaxy', name: 'Galaxy Eyes', emoji: '🌌', rarity: 'legendary' as AvatarRarity },
  { id: 'eyes_rainbow', name: 'Rainbow Eyes', emoji: '🌈', rarity: 'legendary' as AvatarRarity },
];

export const DEFAULT_MOUTHS = [
  // Common - All have SVG implementations
  { id: 'mouth_smile', name: 'Smile', emoji: '😊', rarity: 'common' as AvatarRarity },
  { id: 'mouth_grin', name: 'Big Grin', emoji: '😁', rarity: 'common' as AvatarRarity },
  { id: 'mouth_laugh', name: 'Laughing', emoji: '😂', rarity: 'common' as AvatarRarity },
  { id: 'mouth_neutral', name: 'Neutral', emoji: '😐', rarity: 'common' as AvatarRarity },
  { id: 'mouth_sad', name: 'Sad', emoji: '�', rarity: 'common' as AvatarRarity },
  // Rare - All have SVG implementations
  { id: 'mouth_smirk', name: 'Smirk', emoji: '😏', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_surprised', name: 'Shocked', emoji: '�', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_tongue', name: 'Tongue Out', emoji: '😛', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_thinking', name: 'Pondering', emoji: '🤔', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_yawn', name: 'Yawning', emoji: '🥱', rarity: 'rare' as AvatarRarity },
  { id: 'mouth_whistle', name: 'Whistling', emoji: '🎵', rarity: 'rare' as AvatarRarity },
  // Epic - All have SVG implementations
  { id: 'mouth_kiss', name: 'Kiss', emoji: '😘', rarity: 'epic' as AvatarRarity },
  { id: 'mouth_vampire', name: 'Vampire Fangs', emoji: '🧛', rarity: 'epic' as AvatarRarity },
  { id: 'mouth_zipper', name: 'Zipped', emoji: '🤐', rarity: 'epic' as AvatarRarity },
  { id: 'mouth_robot', name: 'Robot Grill', emoji: '🤖', rarity: 'epic' as AvatarRarity },
  { id: 'mouth_fire', name: 'Fire Breath', emoji: '🔥', rarity: 'epic' as AvatarRarity },
];

export const DEFAULT_HAIR_STYLES = [
  // Common
  { id: 'hair_short', name: 'Classic Cut', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_long', name: 'Flowing Locks', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  { id: 'hair_curly', name: 'Bouncy Curls', emoji: '👨‍🦱', rarity: 'common' as AvatarRarity },
  { id: 'hair_bald', name: 'Smooth Dome', emoji: '👨‍🦲', rarity: 'common' as AvatarRarity },
  { id: 'hair_pixie', name: 'Pixie Cut', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_bob', name: 'Bob Cut', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  // Rare
  { id: 'hair_mohawk', name: 'Punk Mohawk', emoji: '🤘', rarity: 'rare' as AvatarRarity },
  { id: 'hair_afro', name: 'Retro Afro', emoji: '👨‍🦱', rarity: 'rare' as AvatarRarity },
  { id: 'hair_short_blue', name: 'Electric Blue', emoji: '💇', rarity: 'rare' as AvatarRarity },
  { id: 'hair_pink', name: 'Bubblegum Pink', emoji: '💇', rarity: 'rare' as AvatarRarity },
  { id: 'hair_green', name: 'Toxic Green', emoji: '💇', rarity: 'rare' as AvatarRarity },
  { id: 'hair_purple', name: 'Royal Purple', emoji: '💇', rarity: 'rare' as AvatarRarity },
  { id: 'hair_spiky', name: 'Anime Spikes', emoji: '⚡', rarity: 'rare' as AvatarRarity },
  { id: 'hair_dreadlocks', name: 'Dreadlocks', emoji: '🎵', rarity: 'rare' as AvatarRarity },
  { id: 'hair_ponytail', name: 'High Ponytail', emoji: '💇‍♀️', rarity: 'rare' as AvatarRarity },
  { id: 'hair_braids', name: 'Twin Braids', emoji: '💇‍♀️', rarity: 'rare' as AvatarRarity },
  // Epic
  { id: 'hair_rainbow', name: 'Rainbow Cascade', emoji: '🌈', rarity: 'epic' as AvatarRarity },
  { id: 'hair_galaxy', name: 'Galaxy Hair', emoji: '🌌', rarity: 'epic' as AvatarRarity },
  { id: 'hair_neon', name: 'Neon Glow', emoji: '💡', rarity: 'epic' as AvatarRarity },
  { id: 'hair_cyber', name: 'Cyber Punk', emoji: '🤖', rarity: 'epic' as AvatarRarity },
  { id: 'hair_ice', name: 'Frozen Spikes', emoji: '❄️', rarity: 'epic' as AvatarRarity },
  { id: 'hair_lava', name: 'Molten Lava', emoji: '🌋', rarity: 'epic' as AvatarRarity },
  // Legendary
  { id: 'hair_fire', name: 'Inferno Blaze', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_lightning', name: 'Thunder Strike', emoji: '⚡', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_phoenix', name: 'Phoenix Flames', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_celestial', name: 'Celestial Aura', emoji: '✨', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_void', name: 'Void Walker', emoji: '🌑', rarity: 'legendary' as AvatarRarity },
  // Exclusive
  { id: 'hair_founder_gold', name: 'Founder\'s Glory', emoji: '�', rarity: 'exclusive' as AvatarRarity },
  { id: 'hair_champion', name: 'Champion\'s Crown', emoji: '🏆', rarity: 'exclusive' as AvatarRarity },
];

export const DEFAULT_ACCESSORIES = [
  // Common
  { id: 'acc_none', name: 'None', emoji: '🚫', rarity: 'common' as AvatarRarity },
  { id: 'acc_glasses', name: 'Smart Glasses', emoji: '👓', rarity: 'common' as AvatarRarity },
  { id: 'acc_headphones', name: 'Headphones', emoji: '🎧', rarity: 'common' as AvatarRarity },
  { id: 'acc_cap', name: 'Baseball Cap', emoji: '🧢', rarity: 'common' as AvatarRarity },
  { id: 'acc_bandana', name: 'Bandana', emoji: '🎀', rarity: 'common' as AvatarRarity },
  { id: 'acc_bow', name: 'Hair Bow', emoji: '🎀', rarity: 'common' as AvatarRarity },
  // Rare
  { id: 'acc_sunglasses', name: 'Cool Shades', emoji: '🕶️', rarity: 'rare' as AvatarRarity },
  { id: 'acc_hat', name: 'Top Hat', emoji: '🎩', rarity: 'rare' as AvatarRarity },
  { id: 'acc_beanie', name: 'Cozy Beanie', emoji: '🧢', rarity: 'rare' as AvatarRarity },
  { id: 'acc_visor', name: 'Cyber Visor', emoji: '🕶️', rarity: 'rare' as AvatarRarity },
  { id: 'acc_mask', name: 'Mystery Mask', emoji: '🎭', rarity: 'rare' as AvatarRarity },
  { id: 'acc_earrings', name: 'Gold Earrings', emoji: '💍', rarity: 'rare' as AvatarRarity },
  { id: 'acc_necklace', name: 'Chain Necklace', emoji: '📿', rarity: 'rare' as AvatarRarity },
  { id: 'acc_scarf', name: 'Stylish Scarf', emoji: '🧣', rarity: 'rare' as AvatarRarity },
  // Epic
  { id: 'acc_crown', name: 'Royal Crown', emoji: '👑', rarity: 'epic' as AvatarRarity },
  { id: 'acc_halo', name: 'Angel Halo', emoji: '😇', rarity: 'epic' as AvatarRarity },
  { id: 'acc_horns', name: 'Devil Horns', emoji: '😈', rarity: 'epic' as AvatarRarity },
  { id: 'acc_tiara', name: 'Diamond Tiara', emoji: '👸', rarity: 'epic' as AvatarRarity },
  { id: 'acc_monocle', name: 'Golden Monocle', emoji: '🧐', rarity: 'epic' as AvatarRarity },
  { id: 'acc_goggles', name: 'Steampunk Goggles', emoji: '🥽', rarity: 'epic' as AvatarRarity },
  { id: 'acc_laurel', name: 'Victory Laurel', emoji: '🏆', rarity: 'epic' as AvatarRarity },
  // Legendary
  { id: 'acc_wizard_hat', name: 'Archmage Hat', emoji: '🧙', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_dragon_helm', name: 'Dragon Helm', emoji: '🐉', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_phoenix_crown', name: 'Phoenix Crown', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_galaxy_visor', name: 'Galaxy Visor', emoji: '🌌', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_lightning_bolt', name: 'Lightning Bolt', emoji: '⚡', rarity: 'legendary' as AvatarRarity },
  // Exclusive
  { id: 'acc_founder_crown', name: 'Founder\'s Crown', emoji: '👑', rarity: 'exclusive' as AvatarRarity },
  { id: 'acc_legend_halo', name: 'Legend\'s Halo', emoji: '✨', rarity: 'exclusive' as AvatarRarity },
  { id: 'acc_ultimate_set', name: 'Ultimate Champion Set', emoji: '💫', rarity: 'exclusive' as AvatarRarity },
];

export const DEFAULT_BACKGROUNDS = [
  // Common
  { id: 'bg_white', name: 'Pure White', color: '#FFFFFF', rarity: 'common' as AvatarRarity },
  { id: 'bg_purple', name: 'Royal Purple', color: '#6C63FF', rarity: 'common' as AvatarRarity },
  { id: 'bg_blue', name: 'Sky Blue', color: '#4A90E2', rarity: 'common' as AvatarRarity },
  { id: 'bg_green', name: 'Mint Green', color: '#50E3C2', rarity: 'common' as AvatarRarity },
  { id: 'bg_pink', name: 'Bubblegum Pink', color: '#FF6B9D', rarity: 'common' as AvatarRarity },
  { id: 'bg_red', name: 'Crimson Red', color: '#FF4757', rarity: 'common' as AvatarRarity },
  { id: 'bg_orange', name: 'Sunset Orange', color: '#FFA502', rarity: 'common' as AvatarRarity },
  { id: 'bg_black', name: 'Midnight Black', color: '#2F3542', rarity: 'common' as AvatarRarity },
  // Rare
  { id: 'bg_gradient_sunset', name: 'Golden Sunset', gradient: ['#FF6B6B', '#FFD93D'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_ocean', name: 'Deep Ocean', gradient: ['#667EEA', '#764BA2'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_forest', name: 'Emerald Forest', gradient: ['#11998E', '#38EF7D'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_candy', name: 'Candy Shop', gradient: ['#FC466B', '#3F5EFB'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_neon', name: 'Neon Lights', gradient: ['#FF00FF', '#00FFFF'], rarity: 'rare' as AvatarRarity },
  // Epic
  { id: 'bg_gradient_fire', name: 'Inferno Blaze', gradient: ['#FF512F', '#DD2476'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_ice', name: 'Frozen Tundra', gradient: ['#00C9FF', '#92FE9D'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_galaxy', name: 'Galaxy Nebula', gradient: ['#8E2DE2', '#4A00E0'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_aurora', name: 'Aurora Borealis', gradient: ['#00F260', '#0575E6'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_founder', name: 'Founder\'s Glory', gradient: ['#FFD700', '#FFA500'], rarity: 'epic' as AvatarRarity },
  // Legendary
  { id: 'bg_animated_stars', name: 'Cosmic Starfield', animated: true, rarity: 'legendary' as AvatarRarity },
  { id: 'bg_animated_fire', name: 'Living Flames', animated: true, gradient: ['#FF512F', '#DD2476'], rarity: 'legendary' as AvatarRarity },
  { id: 'bg_animated_lightning', name: 'Thunder Storm', animated: true, gradient: ['#FFD700', '#4A00E0'], rarity: 'legendary' as AvatarRarity },
  { id: 'bg_animated_matrix', name: 'Matrix Code', animated: true, color: '#00FF00', rarity: 'legendary' as AvatarRarity },
  { id: 'bg_animated_founder', name: 'Founder\'s Radiance', animated: true, gradient: ['#FFD700', '#FFA500', '#FF6B6B'], rarity: 'legendary' as AvatarRarity },
  // Exclusive
  { id: 'bg_champion', name: 'Champion\'s Arena', animated: true, gradient: ['#FFD700', '#FF6B6B', '#4A00E0'], rarity: 'exclusive' as AvatarRarity },
  { id: 'bg_legend', name: 'Legend\'s Domain', animated: true, gradient: ['#E74C3C', '#8E44AD', '#3498DB'], rarity: 'exclusive' as AvatarRarity },
];

export const DEFAULT_EFFECTS = [
  // Common
  { id: 'fx_none', name: 'None', emoji: '🚫', rarity: 'common' as AvatarRarity },
  // Rare
  { id: 'fx_sparkles', name: 'Sparkle Trail', emoji: '✨', rarity: 'rare' as AvatarRarity },
  { id: 'fx_glow', name: 'Soft Glow', emoji: '💫', rarity: 'rare' as AvatarRarity },
  { id: 'fx_stars', name: 'Star Dust', emoji: '⭐', rarity: 'rare' as AvatarRarity },
  { id: 'fx_hearts', name: 'Love Aura', emoji: '💕', rarity: 'rare' as AvatarRarity },
  // Epic
  { id: 'fx_fire', name: 'Flame Aura', emoji: '🔥', rarity: 'epic' as AvatarRarity },
  { id: 'fx_lightning', name: 'Electric Surge', emoji: '⚡', rarity: 'epic' as AvatarRarity },
  { id: 'fx_ice', name: 'Frost Aura', emoji: '❄️', rarity: 'epic' as AvatarRarity },
  { id: 'fx_poison', name: 'Toxic Cloud', emoji: '☠️', rarity: 'epic' as AvatarRarity },
  { id: 'fx_energy', name: 'Energy Shield', emoji: '🛡️', rarity: 'epic' as AvatarRarity },
  // Legendary
  { id: 'fx_rainbow', name: 'Rainbow Aura', emoji: '🌈', rarity: 'legendary' as AvatarRarity },
  { id: 'fx_galaxy', name: 'Cosmic Aura', emoji: '🌌', rarity: 'legendary' as AvatarRarity },
  { id: 'fx_phoenix', name: 'Phoenix Wings', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'fx_dragon', name: 'Dragon Spirit', emoji: '🐉', rarity: 'legendary' as AvatarRarity },
  { id: 'fx_void', name: 'Void Essence', emoji: '🌑', rarity: 'legendary' as AvatarRarity },
  // Exclusive
  { id: 'fx_founder_aura', name: 'Founder\'s Radiance', emoji: '✨', rarity: 'exclusive' as AvatarRarity },
  { id: 'fx_champion', name: 'Champion\'s Glory', emoji: '🏆', rarity: 'exclusive' as AvatarRarity },
  { id: 'fx_legend', name: 'Legendary Presence', emoji: '💫', rarity: 'exclusive' as AvatarRarity },
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

// ==================== EXPORT EXPANDED ITEMS ====================
// Re-export all expanded item collections for use in Avatar Shop
export * from './avatar-items-expanded';
