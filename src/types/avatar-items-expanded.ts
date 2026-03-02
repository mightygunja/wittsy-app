/**
 * PHASE 3: MASSIVE AVATAR ITEM EXPANSION
 * 100+ professional avatar items across all categories
 * Ready for Avatar Shop integration
 */

import { AvatarRarity } from './avatar';

// ==================== EXPANDED HAIR STYLES (50+) ====================

export const EXPANDED_HAIR_STYLES = [
  // Common (15 items)
  { id: 'hair_short', name: 'Classic Cut', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_long', name: 'Flowing Locks', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  { id: 'hair_curly', name: 'Bouncy Curls', emoji: '👨‍🦱', rarity: 'common' as AvatarRarity },
  { id: 'hair_bald', name: 'Smooth Dome', emoji: '👨‍🦲', rarity: 'common' as AvatarRarity },
  { id: 'hair_pixie', name: 'Pixie Cut', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_bob', name: 'Bob Cut', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  { id: 'hair_crew', name: 'Crew Cut', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_buzz', name: 'Buzz Cut', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_shoulder', name: 'Shoulder Length', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  { id: 'hair_wavy', name: 'Beach Waves', emoji: '🌊', rarity: 'common' as AvatarRarity },
  { id: 'hair_straight', name: 'Silky Straight', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  { id: 'hair_messy', name: 'Messy Bedhead', emoji: '😴', rarity: 'common' as AvatarRarity },
  { id: 'hair_side_part', name: 'Side Part', emoji: '💇', rarity: 'common' as AvatarRarity },
  { id: 'hair_middle_part', name: 'Middle Part', emoji: '💇‍♀️', rarity: 'common' as AvatarRarity },
  { id: 'hair_slicked', name: 'Slicked Back', emoji: '💼', rarity: 'common' as AvatarRarity },

  // Rare (20 items)
  { id: 'hair_mohawk', name: 'Punk Mohawk', emoji: '🤘', rarity: 'rare' as AvatarRarity },
  { id: 'hair_afro', name: 'Retro Afro', emoji: '👨‍🦱', rarity: 'rare' as AvatarRarity },
  { id: 'hair_short_blue', name: 'Electric Blue', emoji: '💙', rarity: 'rare' as AvatarRarity },
  { id: 'hair_pink', name: 'Bubblegum Pink', emoji: '💗', rarity: 'rare' as AvatarRarity },
  { id: 'hair_green', name: 'Toxic Green', emoji: '💚', rarity: 'rare' as AvatarRarity },
  { id: 'hair_purple', name: 'Royal Purple', emoji: '💜', rarity: 'rare' as AvatarRarity },
  { id: 'hair_spiky', name: 'Anime Spikes', emoji: '⚡', rarity: 'rare' as AvatarRarity },
  { id: 'hair_dreadlocks', name: 'Dreadlocks', emoji: '🎵', rarity: 'rare' as AvatarRarity },
  { id: 'hair_ponytail', name: 'High Ponytail', emoji: '💇‍♀️', rarity: 'rare' as AvatarRarity },
  { id: 'hair_braids', name: 'Twin Braids', emoji: '💇‍♀️', rarity: 'rare' as AvatarRarity },
  { id: 'hair_bun', name: 'Top Bun', emoji: '🍔', rarity: 'rare' as AvatarRarity },
  { id: 'hair_space_buns', name: 'Space Buns', emoji: '🌟', rarity: 'rare' as AvatarRarity },
  { id: 'hair_cornrows', name: 'Cornrows', emoji: '🌾', rarity: 'rare' as AvatarRarity },
  { id: 'hair_undercut', name: 'Undercut Fade', emoji: '✂️', rarity: 'rare' as AvatarRarity },
  { id: 'hair_pompadour', name: 'Classic Pompadour', emoji: '🎸', rarity: 'rare' as AvatarRarity },
  { id: 'hair_quiff', name: 'Modern Quiff', emoji: '💼', rarity: 'rare' as AvatarRarity },
  { id: 'hair_shag', name: 'Shaggy Layers', emoji: '🎨', rarity: 'rare' as AvatarRarity },
  { id: 'hair_wolf_cut', name: 'Wolf Cut', emoji: '🐺', rarity: 'rare' as AvatarRarity },
  { id: 'hair_mullet', name: 'Business Mullet', emoji: '🎸', rarity: 'rare' as AvatarRarity },
  { id: 'hair_french_braid', name: 'French Braid', emoji: '🥖', rarity: 'rare' as AvatarRarity },

  // Epic (10 items)
  { id: 'hair_rainbow', name: 'Rainbow Cascade', emoji: '🌈', rarity: 'epic' as AvatarRarity },
  { id: 'hair_galaxy', name: 'Galaxy Hair', emoji: '🌌', rarity: 'epic' as AvatarRarity },
  { id: 'hair_neon', name: 'Neon Glow', emoji: '💡', rarity: 'epic' as AvatarRarity },
  { id: 'hair_cyber', name: 'Cyber Punk', emoji: '🤖', rarity: 'epic' as AvatarRarity },
  { id: 'hair_ice', name: 'Frozen Spikes', emoji: '❄️', rarity: 'epic' as AvatarRarity },
  { id: 'hair_lava', name: 'Molten Lava', emoji: '🌋', rarity: 'epic' as AvatarRarity },
  { id: 'hair_ocean', name: 'Ocean Waves', emoji: '🌊', rarity: 'epic' as AvatarRarity },
  { id: 'hair_sunset', name: 'Sunset Ombre', emoji: '🌅', rarity: 'epic' as AvatarRarity },
  { id: 'hair_holographic', name: 'Holographic Shine', emoji: '✨', rarity: 'epic' as AvatarRarity },
  { id: 'hair_crystal', name: 'Crystal Spikes', emoji: '💎', rarity: 'epic' as AvatarRarity },

  // Legendary (7 items)
  { id: 'hair_fire', name: 'Inferno Blaze', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_lightning', name: 'Thunder Strike', emoji: '⚡', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_phoenix', name: 'Phoenix Flames', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_celestial', name: 'Celestial Aura', emoji: '✨', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_void', name: 'Void Walker', emoji: '🌑', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_aurora', name: 'Aurora Borealis', emoji: '🌌', rarity: 'legendary' as AvatarRarity },
  { id: 'hair_cosmic', name: 'Cosmic Energy', emoji: '🌠', rarity: 'legendary' as AvatarRarity },

  // Exclusive (3 items)
  { id: 'hair_founder_gold', name: 'Founder\'s Glory', emoji: '👑', rarity: 'exclusive' as AvatarRarity },
  { id: 'hair_champion', name: 'Champion\'s Crown', emoji: '🏆', rarity: 'exclusive' as AvatarRarity },
  { id: 'hair_legend', name: 'Living Legend', emoji: '💫', rarity: 'exclusive' as AvatarRarity },
];

// ==================== EXPANDED ACCESSORIES (35+) ====================

export const EXPANDED_ACCESSORIES = [
  // Common (10 items)
  { id: 'acc_none', name: 'None', emoji: '🚫', rarity: 'common' as AvatarRarity },
  { id: 'acc_glasses', name: 'Smart Glasses', emoji: '👓', rarity: 'common' as AvatarRarity },
  { id: 'acc_headphones', name: 'Headphones', emoji: '🎧', rarity: 'common' as AvatarRarity },
  { id: 'acc_cap', name: 'Baseball Cap', emoji: '🧢', rarity: 'common' as AvatarRarity },
  { id: 'acc_bandana', name: 'Bandana', emoji: '🎀', rarity: 'common' as AvatarRarity },
  { id: 'acc_bow', name: 'Hair Bow', emoji: '🎀', rarity: 'common' as AvatarRarity },
  { id: 'acc_hairclip', name: 'Hair Clip', emoji: '📎', rarity: 'common' as AvatarRarity },
  { id: 'acc_headband', name: 'Headband', emoji: '🎽', rarity: 'common' as AvatarRarity },
  { id: 'acc_simple_earrings', name: 'Stud Earrings', emoji: '⭐', rarity: 'common' as AvatarRarity },
  { id: 'acc_watch', name: 'Wristwatch', emoji: '⌚', rarity: 'common' as AvatarRarity },

  // Rare (15 items)
  { id: 'acc_sunglasses', name: 'Cool Shades', emoji: '🕶️', rarity: 'rare' as AvatarRarity },
  { id: 'acc_hat', name: 'Top Hat', emoji: '🎩', rarity: 'rare' as AvatarRarity },
  { id: 'acc_beanie', name: 'Cozy Beanie', emoji: '🧢', rarity: 'rare' as AvatarRarity },
  { id: 'acc_visor', name: 'Cyber Visor', emoji: '🕶️', rarity: 'rare' as AvatarRarity },
  { id: 'acc_mask', name: 'Mystery Mask', emoji: '🎭', rarity: 'rare' as AvatarRarity },
  { id: 'acc_earrings', name: 'Gold Earrings', emoji: '💍', rarity: 'rare' as AvatarRarity },
  { id: 'acc_necklace', name: 'Chain Necklace', emoji: '📿', rarity: 'rare' as AvatarRarity },
  { id: 'acc_scarf', name: 'Stylish Scarf', emoji: '🧣', rarity: 'rare' as AvatarRarity },
  { id: 'acc_aviators', name: 'Aviator Sunglasses', emoji: '🕶️', rarity: 'rare' as AvatarRarity },
  { id: 'acc_cat_ears', name: 'Cat Ears', emoji: '🐱', rarity: 'rare' as AvatarRarity },
  { id: 'acc_bunny_ears', name: 'Bunny Ears', emoji: '🐰', rarity: 'rare' as AvatarRarity },
  { id: 'acc_flower_crown', name: 'Flower Crown', emoji: '🌸', rarity: 'rare' as AvatarRarity },
  { id: 'acc_fedora', name: 'Fedora Hat', emoji: '🎩', rarity: 'rare' as AvatarRarity },
  { id: 'acc_beret', name: 'French Beret', emoji: '🎨', rarity: 'rare' as AvatarRarity },
  { id: 'acc_cowboy_hat', name: 'Cowboy Hat', emoji: '🤠', rarity: 'rare' as AvatarRarity },

  // Epic (8 items)
  { id: 'acc_crown', name: 'Royal Crown', emoji: '👑', rarity: 'epic' as AvatarRarity },
  { id: 'acc_halo', name: 'Angel Halo', emoji: '😇', rarity: 'epic' as AvatarRarity },
  { id: 'acc_horns', name: 'Devil Horns', emoji: '😈', rarity: 'epic' as AvatarRarity },
  { id: 'acc_tiara', name: 'Diamond Tiara', emoji: '👸', rarity: 'epic' as AvatarRarity },
  { id: 'acc_monocle', name: 'Golden Monocle', emoji: '🧐', rarity: 'epic' as AvatarRarity },
  { id: 'acc_goggles', name: 'Steampunk Goggles', emoji: '🥽', rarity: 'epic' as AvatarRarity },
  { id: 'acc_laurel', name: 'Victory Laurel', emoji: '🏆', rarity: 'epic' as AvatarRarity },
  { id: 'acc_vr_headset', name: 'VR Headset', emoji: '🥽', rarity: 'epic' as AvatarRarity },

  // Legendary (5 items)
  { id: 'acc_wizard_hat', name: 'Archmage Hat', emoji: '🧙', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_dragon_helm', name: 'Dragon Helm', emoji: '🐉', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_phoenix_crown', name: 'Phoenix Crown', emoji: '🔥', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_galaxy_visor', name: 'Galaxy Visor', emoji: '🌌', rarity: 'legendary' as AvatarRarity },
  { id: 'acc_lightning_bolt', name: 'Lightning Bolt', emoji: '⚡', rarity: 'legendary' as AvatarRarity },

  // Exclusive (2 items)
  { id: 'acc_founder_crown', name: 'Founder\'s Crown', emoji: '👑', rarity: 'exclusive' as AvatarRarity },
  { id: 'acc_legend_halo', name: 'Legend\'s Halo', emoji: '✨', rarity: 'exclusive' as AvatarRarity },
];

// ==================== EXPANDED CLOTHING (25+) ====================

export const EXPANDED_CLOTHING = [
  // Common (10 items)
  { id: 'clothing_casual', name: 'Casual Tee', emoji: '👕', rarity: 'common' as AvatarRarity },
  { id: 'clothing_polo', name: 'Polo Shirt', emoji: '👔', rarity: 'common' as AvatarRarity },
  { id: 'clothing_tank', name: 'Tank Top', emoji: '🎽', rarity: 'common' as AvatarRarity },
  { id: 'clothing_vneck', name: 'V-Neck Tee', emoji: '👕', rarity: 'common' as AvatarRarity },
  { id: 'clothing_long_sleeve', name: 'Long Sleeve', emoji: '👔', rarity: 'common' as AvatarRarity },
  { id: 'clothing_sweater', name: 'Cozy Sweater', emoji: '🧥', rarity: 'common' as AvatarRarity },
  { id: 'clothing_cardigan', name: 'Cardigan', emoji: '🧥', rarity: 'common' as AvatarRarity },
  { id: 'clothing_blouse', name: 'Blouse', emoji: '👚', rarity: 'common' as AvatarRarity },
  { id: 'clothing_button_up', name: 'Button-Up Shirt', emoji: '👔', rarity: 'common' as AvatarRarity },
  { id: 'clothing_turtleneck', name: 'Turtleneck', emoji: '🧥', rarity: 'common' as AvatarRarity },

  // Rare (10 items)
  { id: 'clothing_hoodie', name: 'Comfy Hoodie', emoji: '🧥', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_jacket', name: 'Leather Jacket', emoji: '🧥', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_blazer', name: 'Business Blazer', emoji: '🤵', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_dress', name: 'Elegant Dress', emoji: '👗', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_suit', name: 'Sharp Suit', emoji: '🤵', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_jersey', name: 'Sports Jersey', emoji: '⚽', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_varsity', name: 'Varsity Jacket', emoji: '🏈', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_denim', name: 'Denim Jacket', emoji: '🧥', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_bomber', name: 'Bomber Jacket', emoji: '✈️', rarity: 'rare' as AvatarRarity },
  { id: 'clothing_tracksuit', name: 'Tracksuit', emoji: '🏃', rarity: 'rare' as AvatarRarity },

  // Epic (3 items)
  { id: 'clothing_tuxedo', name: 'Formal Tuxedo', emoji: '🤵', rarity: 'epic' as AvatarRarity },
  { id: 'clothing_gown', name: 'Evening Gown', emoji: '👗', rarity: 'epic' as AvatarRarity },
  { id: 'clothing_armor', name: 'Knight Armor', emoji: '🛡️', rarity: 'epic' as AvatarRarity },

  // Legendary (2 items)
  { id: 'clothing_royal_robe', name: 'Royal Robe', emoji: '👑', rarity: 'legendary' as AvatarRarity },
  { id: 'clothing_wizard_robe', name: 'Wizard Robe', emoji: '🧙', rarity: 'legendary' as AvatarRarity },
];

// ==================== EXPANDED BACKGROUNDS (25+) ====================

export const EXPANDED_BACKGROUNDS = [
  // Common - Solid Colors (10 items)
  { id: 'bg_white', name: 'Pure White', color: '#FFFFFF', rarity: 'common' as AvatarRarity },
  { id: 'bg_purple', name: 'Royal Purple', color: '#6C63FF', rarity: 'common' as AvatarRarity },
  { id: 'bg_blue', name: 'Sky Blue', color: '#4A90E2', rarity: 'common' as AvatarRarity },
  { id: 'bg_green', name: 'Mint Green', color: '#50E3C2', rarity: 'common' as AvatarRarity },
  { id: 'bg_pink', name: 'Bubblegum Pink', color: '#FF6B9D', rarity: 'common' as AvatarRarity },
  { id: 'bg_red', name: 'Crimson Red', color: '#FF4757', rarity: 'common' as AvatarRarity },
  { id: 'bg_orange', name: 'Sunset Orange', color: '#FFA502', rarity: 'common' as AvatarRarity },
  { id: 'bg_black', name: 'Midnight Black', color: '#2F3542', rarity: 'common' as AvatarRarity },
  { id: 'bg_yellow', name: 'Sunshine Yellow', color: '#FFD700', rarity: 'common' as AvatarRarity },
  { id: 'bg_teal', name: 'Ocean Teal', color: '#1ABC9C', rarity: 'common' as AvatarRarity },

  // Rare - Gradients (8 items)
  { id: 'bg_gradient_sunset', name: 'Golden Sunset', gradient: ['#FF6B6B', '#FFD93D'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_ocean', name: 'Deep Ocean', gradient: ['#667EEA', '#764BA2'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_forest', name: 'Emerald Forest', gradient: ['#11998E', '#38EF7D'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_candy', name: 'Candy Shop', gradient: ['#FC466B', '#3F5EFB'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_neon', name: 'Neon Lights', gradient: ['#FF00FF', '#00FFFF'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_peach', name: 'Peach Dream', gradient: ['#FFECD2', '#FCB69F'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_lavender', name: 'Lavender Fields', gradient: ['#E0C3FC', '#8EC5FC'], rarity: 'rare' as AvatarRarity },
  { id: 'bg_gradient_rose', name: 'Rose Garden', gradient: ['#F093FB', '#F5576C'], rarity: 'rare' as AvatarRarity },

  // Epic - Special Gradients (5 items)
  { id: 'bg_gradient_fire', name: 'Inferno Blaze', gradient: ['#FF512F', '#DD2476'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_ice', name: 'Frozen Tundra', gradient: ['#00C9FF', '#92FE9D'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_galaxy', name: 'Galaxy Nebula', gradient: ['#8E2DE2', '#4A00E0'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_aurora', name: 'Aurora Borealis', gradient: ['#00F260', '#0575E6'], rarity: 'epic' as AvatarRarity },
  { id: 'bg_gradient_cosmic', name: 'Cosmic Void', gradient: ['#000000', '#434343'], rarity: 'epic' as AvatarRarity },

  // Legendary - Animated (2 items)
  { id: 'bg_animated_stars', name: 'Cosmic Starfield', animated: true, rarity: 'legendary' as AvatarRarity },
  { id: 'bg_animated_fire', name: 'Living Flames', animated: true, gradient: ['#FF512F', '#DD2476'], rarity: 'legendary' as AvatarRarity },
];

// ==================== EFFECTS (15+) ====================

export const EXPANDED_EFFECTS = [
  // Common (5 items)
  { id: 'fx_none', name: 'None', emoji: '🚫', rarity: 'common' as AvatarRarity },
  { id: 'fx_shadow', name: 'Soft Shadow', emoji: '🌑', rarity: 'common' as AvatarRarity },
  { id: 'fx_glow_white', name: 'White Glow', emoji: '⚪', rarity: 'common' as AvatarRarity },
  { id: 'fx_outline', name: 'Bold Outline', emoji: '⭕', rarity: 'common' as AvatarRarity },
  { id: 'fx_blur', name: 'Soft Blur', emoji: '💨', rarity: 'common' as AvatarRarity },

  // Rare (5 items)
  { id: 'fx_sparkles', name: 'Sparkles', emoji: '✨', rarity: 'rare' as AvatarRarity },
  { id: 'fx_glow_blue', name: 'Blue Glow', emoji: '💙', rarity: 'rare' as AvatarRarity },
  { id: 'fx_glow_pink', name: 'Pink Glow', emoji: '💗', rarity: 'rare' as AvatarRarity },
  { id: 'fx_stars', name: 'Star Trail', emoji: '⭐', rarity: 'rare' as AvatarRarity },
  { id: 'fx_hearts', name: 'Floating Hearts', emoji: '💕', rarity: 'rare' as AvatarRarity },

  // Epic (3 items)
  { id: 'fx_rainbow_aura', name: 'Rainbow Aura', emoji: '🌈', rarity: 'epic' as AvatarRarity },
  { id: 'fx_lightning', name: 'Lightning Bolts', emoji: '⚡', rarity: 'epic' as AvatarRarity },
  { id: 'fx_fire_aura', name: 'Fire Aura', emoji: '🔥', rarity: 'epic' as AvatarRarity },

  // Legendary (2 items)
  { id: 'fx_cosmic_energy', name: 'Cosmic Energy', emoji: '🌌', rarity: 'legendary' as AvatarRarity },
  { id: 'fx_divine_light', name: 'Divine Light', emoji: '✨', rarity: 'legendary' as AvatarRarity },
];

// ==================== NEW CATEGORY: FACIAL HAIR (12+) ====================

export const FACIAL_HAIR_STYLES = [
  // Common (5 items)
  { id: 'facial_none', name: 'Clean Shaven', emoji: '😊', rarity: 'common' as AvatarRarity },
  { id: 'facial_stubble', name: 'Light Stubble', emoji: '🧔', rarity: 'common' as AvatarRarity },
  { id: 'facial_goatee', name: 'Classic Goatee', emoji: '🧔', rarity: 'common' as AvatarRarity },
  { id: 'facial_mustache', name: 'Simple Mustache', emoji: '👨', rarity: 'common' as AvatarRarity },
  { id: 'facial_soul_patch', name: 'Soul Patch', emoji: '🎸', rarity: 'common' as AvatarRarity },

  // Rare (5 items)
  { id: 'facial_full_beard', name: 'Full Beard', emoji: '🧔', rarity: 'rare' as AvatarRarity },
  { id: 'facial_handlebar', name: 'Handlebar Mustache', emoji: '🥸', rarity: 'rare' as AvatarRarity },
  { id: 'facial_van_dyke', name: 'Van Dyke', emoji: '🧔', rarity: 'rare' as AvatarRarity },
  { id: 'facial_mutton_chops', name: 'Mutton Chops', emoji: '🧔', rarity: 'rare' as AvatarRarity },
  { id: 'facial_pencil', name: 'Pencil Mustache', emoji: '✏️', rarity: 'rare' as AvatarRarity },

  // Epic (2 items)
  { id: 'facial_wizard_beard', name: 'Wizard Beard', emoji: '🧙', rarity: 'epic' as AvatarRarity },
  { id: 'facial_viking_beard', name: 'Viking Braids', emoji: '⚔️', rarity: 'epic' as AvatarRarity },
];

// ==================== NEW CATEGORY: FACE PAINT (12+) ====================

export const FACE_PAINT_STYLES = [
  // Common (5 items)
  { id: 'paint_none', name: 'None', emoji: '🚫', rarity: 'common' as AvatarRarity },
  { id: 'paint_blush', name: 'Rosy Cheeks', emoji: '😊', rarity: 'common' as AvatarRarity },
  { id: 'paint_freckles', name: 'Freckles', emoji: '🌟', rarity: 'common' as AvatarRarity },
  { id: 'paint_beauty_mark', name: 'Beauty Mark', emoji: '💋', rarity: 'common' as AvatarRarity },
  { id: 'paint_simple_dots', name: 'Face Dots', emoji: '⚪', rarity: 'common' as AvatarRarity },

  // Rare (5 items)
  { id: 'paint_tribal', name: 'Tribal Marks', emoji: '🎨', rarity: 'rare' as AvatarRarity },
  { id: 'paint_sports', name: 'Sports Stripes', emoji: '🏈', rarity: 'rare' as AvatarRarity },
  { id: 'paint_stars', name: 'Star Pattern', emoji: '⭐', rarity: 'rare' as AvatarRarity },
  { id: 'paint_hearts', name: 'Heart Stamps', emoji: '💕', rarity: 'rare' as AvatarRarity },
  { id: 'paint_butterfly', name: 'Butterfly Design', emoji: '🦋', rarity: 'rare' as AvatarRarity },

  // Epic (2 items)
  { id: 'paint_warrior', name: 'Warrior Paint', emoji: '⚔️', rarity: 'epic' as AvatarRarity },
  { id: 'paint_galaxy', name: 'Galaxy Face', emoji: '🌌', rarity: 'epic' as AvatarRarity },
];

// ==================== TOTALS ====================
// Hair: 55 items
// Accessories: 40 items  
// Clothing: 25 items
// Backgrounds: 25 items
// Effects: 15 items
// Facial Hair: 12 items
// Face Paint: 12 items
// TOTAL: 184 NEW AVATAR ITEMS
