/**
 * Avatar Shop Service
 * Manages the comprehensive avatar item catalog and shop functionality
 */

import {
  AvatarItem,
  AvatarRarity,
  EXPANDED_HAIR_STYLES,
  EXPANDED_ACCESSORIES,
  EXPANDED_CLOTHING,
  EXPANDED_BACKGROUNDS,
  EXPANDED_EFFECTS,
  FACIAL_HAIR_STYLES,
  FACE_PAINT_STYLES,
} from '../types/avatar';

// Pricing based on rarity
const RARITY_PRICES: Record<AvatarRarity, number> = {
  common: 100,
  rare: 300,
  epic: 600,
  legendary: 1000,
  exclusive: 1500,
};

/**
 * Convert simple item definition to full AvatarItem with pricing
 */
function createShopItem(
  item: any,
  category: string
): AvatarItem {
  return {
    id: item.id,
    category: category as any,
    name: item.name,
    description: `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} ${category.replace('_', ' ')} item`,
    rarity: item.rarity,
    unlockMethod: 'purchase',
    price: {
      coins: RARITY_PRICES[item.rarity as AvatarRarity],
    },
    emoji: item.emoji,
    color: item.color,
    gradient: item.gradient,
    animated: item.animated,
  };
}

/**
 * Get all available shop items
 */
export function getAllShopItems(): AvatarItem[] {
  const items: AvatarItem[] = [];

  // Hair styles
  EXPANDED_HAIR_STYLES.forEach(item => {
    items.push(createShopItem(item, 'hair'));
  });

  // Accessories
  EXPANDED_ACCESSORIES.forEach(item => {
    items.push(createShopItem(item, 'accessories'));
  });

  // Clothing
  EXPANDED_CLOTHING.forEach(item => {
    items.push(createShopItem(item, 'clothing'));
  });

  // Backgrounds
  EXPANDED_BACKGROUNDS.forEach(item => {
    items.push(createShopItem(item, 'background'));
  });

  // Effects
  EXPANDED_EFFECTS.forEach(item => {
    items.push(createShopItem(item, 'effects'));
  });

  // Facial Hair
  FACIAL_HAIR_STYLES.forEach(item => {
    items.push(createShopItem(item, 'facial_hair'));
  });

  // Face Paint
  FACE_PAINT_STYLES.forEach(item => {
    items.push(createShopItem(item, 'face_paint'));
  });

  return items;
}

/**
 * Get shop items by category
 */
export function getItemsByCategory(category: string): AvatarItem[] {
  return getAllShopItems().filter(item => item.category === category);
}

/**
 * Get shop items by rarity
 */
export function getItemsByRarity(rarity: AvatarRarity): AvatarItem[] {
  return getAllShopItems().filter(item => item.rarity === rarity);
}

/**
 * Get featured items (legendary and exclusive)
 */
export function getFeaturedItems(): AvatarItem[] {
  return getAllShopItems().filter(
    item => item.rarity === 'legendary' || item.rarity === 'exclusive'
  );
}

/**
 * Get new arrivals (first 20 items from each category)
 */
export function getNewArrivals(): AvatarItem[] {
  const allItems = getAllShopItems();
  // Get a mix from different categories
  return allItems.slice(0, 20);
}

/**
 * Search items by name
 */
export function searchItems(query: string): AvatarItem[] {
  const lowerQuery = query.toLowerCase();
  return getAllShopItems().filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get items the user can afford
 */
export function getAffordableItems(userCoins: number): AvatarItem[] {
  return getAllShopItems().filter(
    item => (item.price?.coins || 0) <= userCoins
  );
}

/**
 * Get shop statistics
 */
export function getShopStats() {
  const allItems = getAllShopItems();
  
  return {
    totalItems: allItems.length,
    byCategory: {
      hair: EXPANDED_HAIR_STYLES.length,
      accessories: EXPANDED_ACCESSORIES.length,
      clothing: EXPANDED_CLOTHING.length,
      backgrounds: EXPANDED_BACKGROUNDS.length,
      effects: EXPANDED_EFFECTS.length,
      facial_hair: FACIAL_HAIR_STYLES.length,
      face_paint: FACE_PAINT_STYLES.length,
    },
    byRarity: {
      common: allItems.filter(i => i.rarity === 'common').length,
      rare: allItems.filter(i => i.rarity === 'rare').length,
      epic: allItems.filter(i => i.rarity === 'epic').length,
      legendary: allItems.filter(i => i.rarity === 'legendary').length,
      exclusive: allItems.filter(i => i.rarity === 'exclusive').length,
    },
  };
}

export const avatarShopService = {
  getAllShopItems,
  getItemsByCategory,
  getItemsByRarity,
  getFeaturedItems,
  getNewArrivals,
  searchItems,
  getAffordableItems,
  getShopStats,
};
