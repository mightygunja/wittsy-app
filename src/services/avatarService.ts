/**
 * Avatar Service
 * Manage avatar data, unlocks, and purchases
 */

import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';
import {
  AvatarConfig,
  AvatarItem,
  UserAvatar,
  AvatarCollection,
  DEFAULT_AVATAR_CONFIG,
  AvatarRarity,
  UnlockMethod,
} from '../types/avatar';

class AvatarService {
  /**
   * Get user's avatar data
   */
  async getUserAvatar(userId: string): Promise<UserAvatar | null> {
    try {
      const avatarRef = doc(firestore, 'avatars', userId);
      const avatarSnap = await getDoc(avatarRef);

      if (avatarSnap.exists()) {
        return avatarSnap.data() as UserAvatar;
      }

      // Create default avatar
      const defaultAvatar: UserAvatar = {
        userId,
        config: DEFAULT_AVATAR_CONFIG,
        unlockedItems: this.getDefaultUnlockedItems(),
        favoriteAvatars: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(avatarRef, defaultAvatar);
      return defaultAvatar;
    } catch (error) {
      console.error('Failed to get user avatar:', error);
      return null;
    }
  }

  /**
   * Update user's avatar configuration
   */
  async updateAvatarConfig(userId: string, config: AvatarConfig): Promise<void> {
    try {
      const avatarRef = doc(firestore, 'avatars', userId);
      await updateDoc(avatarRef, {
        config,
        updatedAt: new Date(),
      });

      analytics.logEvent('update_avatar', {
        user_id: userId,
      });
    } catch (error) {
      console.error('Failed to update avatar config:', error);
      throw error;
    }
  }

  /**
   * Unlock avatar item
   */
  async unlockItem(userId: string, itemId: string, method: UnlockMethod): Promise<void> {
    try {
      const avatarRef = doc(firestore, 'avatars', userId);
      await updateDoc(avatarRef, {
        unlockedItems: arrayUnion(itemId),
        updatedAt: new Date(),
      });

      analytics.logEvent('unlock_avatar_item', {
        user_id: userId,
        item_id: itemId,
        unlock_method: method,
      });
    } catch (error) {
      console.error('Failed to unlock item:', error);
      throw error;
    }
  }

  /**
   * Purchase avatar item with coins
   */
  async purchaseItem(
    userId: string,
    itemId: string,
    price: number
  ): Promise<boolean> {
    try {
      // Check user's coin balance
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data();
      const currentCoins = userData.stats?.coins || 0;

      if (currentCoins < price) {
        return false; // Insufficient coins
      }

      // Deduct coins
      await updateDoc(userRef, {
        'stats.coins': currentCoins - price,
      });

      // Unlock item
      await this.unlockItem(userId, itemId, 'purchase');

      analytics.spendCoins(price, `avatar_item_${itemId}`);

      return true;
    } catch (error) {
      console.error('Failed to purchase item:', error);
      throw error;
    }
  }

  /**
   * Save avatar to favorites
   */
  async saveFavoriteAvatar(userId: string, config: AvatarConfig): Promise<void> {
    try {
      const avatarRef = doc(firestore, 'avatars', userId);
      const avatarSnap = await getDoc(avatarRef);

      if (!avatarSnap.exists()) return;

      const avatarData = avatarSnap.data() as UserAvatar;
      const favorites = avatarData.favoriteAvatars || [];

      // Limit to 10 favorites
      if (favorites.length >= 10) {
        favorites.shift(); // Remove oldest
      }

      favorites.push(config);

      await updateDoc(avatarRef, {
        favoriteAvatars: favorites,
        updatedAt: new Date(),
      });

      analytics.logEvent('save_favorite_avatar', {
        user_id: userId,
      });
    } catch (error) {
      console.error('Failed to save favorite avatar:', error);
      throw error;
    }
  }

  /**
   * Get default unlocked items
   */
  private getDefaultUnlockedItems(): string[] {
    return [
      // Default skin tones
      'skin_light',
      'skin_medium_light',
      'skin_medium',
      'skin_medium_dark',
      'skin_dark',
      // Default features
      'eyes_normal',
      'eyes_happy',
      'mouth_smile',
      'mouth_grin',
      'hair_short',
      'hair_long',
      'hair_bald',
      // Default accessories
      'acc_none',
      'acc_glasses',
      // Default backgrounds
      'bg_white',
      'bg_purple',
      'bg_blue',
      // Default effects
      'fx_none',
      // Default clothing
      'clothing_casual',
    ];
  }

  /**
   * Check if item is unlocked
   */
  async isItemUnlocked(userId: string, itemId: string): Promise<boolean> {
    try {
      const avatar = await this.getUserAvatar(userId);
      return avatar?.unlockedItems.includes(itemId) || false;
    } catch (error) {
      console.error('Failed to check item unlock status:', error);
      return false;
    }
  }

  /**
   * Get unlock progress for collections
   */
  async getCollectionProgress(
    userId: string,
    collection: AvatarCollection
  ): Promise<number> {
    try {
      const avatar = await this.getUserAvatar(userId);
      if (!avatar) return 0;

      const unlockedCount = collection.items.filter((itemId) =>
        avatar.unlockedItems.includes(itemId)
      ).length;

      return (unlockedCount / collection.items.length) * 100;
    } catch (error) {
      console.error('Failed to get collection progress:', error);
      return 0;
    }
  }

  /**
   * Get avatar stats
   */
  async getAvatarStats(userId: string): Promise<any> {
    try {
      const avatar = await this.getUserAvatar(userId);
      if (!avatar) return null;

      // This would calculate stats based on unlocked items
      return {
        totalUnlocked: avatar.unlockedItems.length,
        favoriteCount: avatar.favoriteAvatars.length,
      };
    } catch (error) {
      console.error('Failed to get avatar stats:', error);
      return null;
    }
  }

  /**
   * Generate random avatar
   */
  generateRandomAvatar(unlockedItems: string[]): AvatarConfig {
    const getRandomItem = (category: string) => {
      const items = unlockedItems.filter((id) => id.startsWith(category));
      return items[Math.floor(Math.random() * items.length)] || '';
    };

    return {
      skin: getRandomItem('skin_'),
      eyes: getRandomItem('eyes_'),
      mouth: getRandomItem('mouth_'),
      hair: getRandomItem('hair_'),
      accessories: [],
      clothing: getRandomItem('clothing_'),
      background: getRandomItem('bg_'),
      effects: [],
    };
  }
}

// Export singleton instance
export const avatarService = new AvatarService();
