/**
 * Daily Deals Service
 * Rotating 24-hour special offers for coins and avatar items
 */

import { firestore } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DailyDeal {
  id: string;
  type: 'coin_pack' | 'avatar_item' | 'bundle';
  name: string;
  description: string;
  originalPrice: number;
  dealPrice: number;
  discount: number;
  itemId?: string;
  coins?: number;
  items?: string[];
  icon: string;
  rarity?: string;
  expiresAt: Date;
  featured?: boolean;
}

export interface DailyDealsState {
  deals: DailyDeal[];
  lastRotation: Date;
  nextRotation: Date;
}

class DailyDealsService {
  private readonly ROTATION_HOURS = 24;
  
  /**
   * Get current daily deals
   */
  async getCurrentDeals(): Promise<DailyDeal[]> {
    try {
      const dealsDoc = await getDoc(doc(firestore, 'system', 'dailyDeals'));
      
      if (!dealsDoc.exists()) {
        // Initialize first set of deals
        return await this.rotateDeals();
      }
      
      const data = dealsDoc.data() as any;
      const nextRotation = data.nextRotation?.toDate ? data.nextRotation.toDate() : new Date(data.nextRotation);
      
      // Check if rotation is needed
      if (new Date() >= nextRotation) {
        return await this.rotateDeals();
      }
      
      return data.deals;
    } catch (error) {
      console.error('Failed to get daily deals:', error);
      return this.getDefaultDeals();
    }
  }
  
  /**
   * Rotate to new daily deals
   */
  private async rotateDeals(): Promise<DailyDeal[]> {
    const newDeals = this.generateRandomDeals();
    const now = new Date();
    const nextRotation = new Date(now.getTime() + this.ROTATION_HOURS * 60 * 60 * 1000);
    
    const dealsState: DailyDealsState = {
      deals: newDeals,
      lastRotation: now,
      nextRotation,
    };
    
    try {
      await setDoc(doc(firestore, 'system', 'dailyDeals'), dealsState);
    } catch (error) {
      console.error('Failed to save daily deals:', error);
    }
    
    return newDeals;
  }
  
  /**
   * Generate random daily deals
   */
  private generateRandomDeals(): DailyDeal[] {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ROTATION_HOURS * 60 * 60 * 1000);
    
    const dealPool: DailyDeal[] = [
      // Coin Deals
      {
        id: 'deal_coins_500',
        type: 'coin_pack',
        name: '⚡ Flash Sale: 500 Coins',
        description: 'Limited time offer!',
        originalPrice: 4.99,
        dealPrice: 2.99,
        discount: 40,
        coins: 500,
        icon: '🪙',
        expiresAt,
        featured: true,
      },
      {
        id: 'deal_coins_1500',
        type: 'coin_pack',
        name: '💰 Mega Deal: 1,500 Coins',
        description: 'Best value today!',
        originalPrice: 9.99,
        dealPrice: 6.99,
        discount: 30,
        coins: 1500,
        icon: '💰',
        expiresAt,
      },
      // Avatar Item Deals
      {
        id: 'deal_hair_phoenix',
        type: 'avatar_item',
        name: '🔥 Phoenix Flames Hair',
        description: 'Legendary hair style!',
        originalPrice: 500,
        dealPrice: 299,
        discount: 40,
        itemId: 'hair_phoenix',
        icon: '🔥',
        rarity: 'legendary',
        expiresAt,
        featured: true,
      },
      {
        id: 'deal_bg_galaxy',
        type: 'avatar_item',
        name: '🌌 Galaxy Nebula Background',
        description: 'Epic animated background',
        originalPrice: 400,
        dealPrice: 249,
        discount: 38,
        itemId: 'bg_gradient_galaxy',
        icon: '🌌',
        rarity: 'epic',
        expiresAt,
      },
      {
        id: 'deal_fx_phoenix',
        type: 'avatar_item',
        name: '🔥 Phoenix Wings Effect',
        description: 'Legendary aura effect',
        originalPrice: 600,
        dealPrice: 399,
        discount: 33,
        itemId: 'fx_phoenix',
        icon: '🔥',
        rarity: 'legendary',
        expiresAt,
      },
      // Bundle Deals
      {
        id: 'deal_starter_bundle',
        type: 'bundle',
        name: '🎁 Starter Bundle',
        description: '500 coins + 3 rare items',
        originalPrice: 9.99,
        dealPrice: 4.99,
        discount: 50,
        coins: 500,
        items: ['hair_spiky', 'acc_sunglasses', 'bg_gradient_sunset'],
        icon: '🎁',
        expiresAt,
        featured: true,
      },
      {
        id: 'deal_legendary_bundle',
        type: 'bundle',
        name: '👑 Legendary Bundle',
        description: '1000 coins + legendary items',
        originalPrice: 19.99,
        dealPrice: 12.99,
        discount: 35,
        coins: 1000,
        items: ['hair_phoenix', 'acc_phoenix_crown', 'fx_phoenix'],
        icon: '👑',
        expiresAt,
      },
    ];
    
    // Randomly select 4 deals
    const shuffled = dealPool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }
  
  /**
   * Get default deals (fallback)
   */
  private getDefaultDeals(): DailyDeal[] {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ROTATION_HOURS * 60 * 60 * 1000);
    
    return [
      {
        id: 'deal_default_1',
        type: 'coin_pack',
        name: '⚡ Daily Special: 500 Coins',
        description: 'Great value!',
        originalPrice: 4.99,
        dealPrice: 2.99,
        discount: 40,
        coins: 500,
        icon: '🪙',
        expiresAt,
        featured: true,
      },
      {
        id: 'deal_default_2',
        type: 'bundle',
        name: '🎁 Starter Bundle',
        description: '500 coins + items',
        originalPrice: 9.99,
        dealPrice: 4.99,
        discount: 50,
        coins: 500,
        items: ['hair_spiky', 'acc_sunglasses'],
        icon: '🎁',
        expiresAt,
      },
    ];
  }
  
  /**
   * Get time remaining until next rotation
   */
  async getTimeUntilRotation(): Promise<number> {
    try {
      const dealsDoc = await getDoc(doc(firestore, 'system', 'dailyDeals'));
      
      if (!dealsDoc.exists()) {
        return this.ROTATION_HOURS * 60 * 60 * 1000;
      }
      
      const data = dealsDoc.data() as any;
      const nextRotation = data.nextRotation?.toDate ? data.nextRotation.toDate() : new Date(data.nextRotation);
      
      return Math.max(0, nextRotation.getTime() - Date.now());
    } catch (error) {
      console.error('Failed to get rotation time:', error);
      return this.ROTATION_HOURS * 60 * 60 * 1000;
    }
  }
}

export const dailyDeals = new DailyDealsService();
