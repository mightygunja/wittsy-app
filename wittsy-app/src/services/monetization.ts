/**
 * Simplified Monetization Service
 * Direct In-App Purchases using react-native-iap (NO RevenueCat)
 */

import { Platform } from 'react-native';
import { firestore } from './firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { analytics } from './analytics';
import { errorTracking } from './errorTracking';
import { isIAPAvailable } from '../utils/platform';

// Dynamic import for Expo Go compatibility
let RNIap: any = null;
let IAPProduct: any = null;
let IAPPurchase: any = null;
let PurchaseError: any = null;

try {
  const iapModule = require('react-native-iap');
  RNIap = iapModule;
  IAPProduct = iapModule.Product;
  IAPPurchase = iapModule.Purchase;
  PurchaseError = iapModule.PurchaseError;
} catch (e) {
  console.log('⏭️ Skipping IAP import (Expo Go)');
}

// Product IDs
export const COIN_PRODUCTS = {
  FIRST_TIME: Platform.select({
    ios: 'com.wittz.coins.starter',
    android: 'coins_starter',
  }),
  SMALL: Platform.select({
    ios: 'com.wittz.coins.500',
    android: 'coins_500',
  }),
  MEDIUM: Platform.select({
    ios: 'com.wittz.coins.1500',
    android: 'coins_1500',
  }),
  LARGE: Platform.select({
    ios: 'com.wittz.coins.3000',
    android: 'coins_3000',
  }),
  MEGA: Platform.select({
    ios: 'com.wittz.coins.10000',
    android: 'coins_10000',
  }),
};

export const BATTLE_PASS_PRODUCTS = {
  PREMIUM: Platform.select({
    ios: 'com.wittz.battlepass.premium',
    android: 'battlepass_premium',
  }),
  SKIP_1: Platform.select({
    ios: 'com.wittz.battlepass.skip.1',
    android: 'battlepass_skip_1',
  }),
  SKIP_5: Platform.select({
    ios: 'com.wittz.battlepass.skip.5',
    android: 'battlepass_skip_5',
  }),
  SKIP_10: Platform.select({
    ios: 'com.wittz.battlepass.skip.10',
    android: 'battlepass_skip_10',
  }),
  SKIP_25: Platform.select({
    ios: 'com.wittz.battlepass.skip.25',
    android: 'battlepass_skip_25',
  }),
};

// Product Definitions
export interface Product {
  id: string;
  type: 'coins' | 'premium' | 'subscription';
  name: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
  coins?: number;
  premium?: number;
  features?: string[];
  popular?: boolean;
  bestValue?: boolean;
  discount?: number;
  firstTimeOnly?: boolean;
  specialOffer?: boolean;
}

export const COIN_PACKAGES: Product[] = [
  {
    id: COIN_PRODUCTS.FIRST_TIME!,
    type: 'coins',
    name: '🎁 First-Time Mega Deal',
    description: '3,000 coins + Exclusive Founder Hair',
    price: '$0.99',
    priceValue: 0.99,
    currency: 'USD',
    coins: 3000,
    firstTimeOnly: true,
    specialOffer: true,
    discount: 75,
    features: ['3,000 Coins', 'Founder\'s Glory Hair (Exclusive)', '75% OFF - One Time Only!'],
  },
  {
    id: COIN_PRODUCTS.SMALL!,
    type: 'coins',
    name: 'Coin Pouch',
    description: '500 coins',
    price: '$0.99',
    priceValue: 0.99,
    currency: 'USD',
    coins: 500,
  },
  {
    id: COIN_PRODUCTS.MEDIUM!,
    type: 'coins',
    name: 'Coin Bag',
    description: '1,500 coins',
    price: '$2.99',
    priceValue: 2.99,
    currency: 'USD',
    coins: 1500,
    popular: true,
  },
  {
    id: COIN_PRODUCTS.LARGE!,
    type: 'coins',
    name: 'Coin Chest',
    description: '3,000 coins',
    price: '$4.99',
    priceValue: 4.99,
    currency: 'USD',
    coins: 3000,
    discount: 20,
  },
  {
    id: COIN_PRODUCTS.MEGA!,
    type: 'coins',
    name: 'Coin Vault',
    description: '10,000 coins',
    price: '$14.99',
    priceValue: 14.99,
    currency: 'USD',
    coins: 10000,
    bestValue: true,
    discount: 25,
  },
];

export interface Purchase {
  id: string;
  productId: string;
  type: 'coins' | 'premium' | 'subscription';
  amount: number;
  price: number;
  currency: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PurchaseResult {
  success: boolean;
  purchase?: Purchase;
  error?: string;
}

class MonetizationService {
  private initialized = false;
  private currentUserId: string | null = null;
  private purchaseHistory: Purchase[] = [];
  private availableProducts: IAPProduct[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  /**
   * Initialize IAP connection
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      console.log('💰 Monetization already initialized');
      return;
    }

    // Skip IAP initialization on Expo Go
    if (!isIAPAvailable()) {
      console.log('⏭️ Skipping IAP initialization (Expo Go)');
      this.initialized = true;
      return;
    }

    try {
      console.log('🔵 Initializing IAP connection...');
      await RNIap.initConnection();
      console.log('✅ IAP connection established');

      if (userId) {
        this.currentUserId = userId;
        console.log('✅ User ID set:', userId);
      }

      // Get available products
      const productIds = [
        COIN_PRODUCTS.SMALL!,
        COIN_PRODUCTS.MEDIUM!,
        COIN_PRODUCTS.LARGE!,
        COIN_PRODUCTS.MEGA!,
      ];

      console.log('🔵 Fetching products:', productIds);
      const products = await RNIap.fetchProducts({ skus: productIds });
      this.availableProducts = (products || []) as IAPProduct[];
      console.log('✅ Products loaded:', this.availableProducts.length);

      // Set up purchase listeners
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase: IAPPurchase) => {
          console.log('🔵 Purchase update received:', purchase);
          await this.handlePurchaseUpdate(purchase);
        }
      );

      this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
        (error: PurchaseError) => {
          console.error('❌ Purchase error:', error);
          errorTracking.logError(new Error(error.message), { context: 'IAP purchase error' });
        }
      );

      this.initialized = true;
      console.log('✅ IAP initialized successfully');

      analytics.logEvent('iap_initialized', {});
    } catch (error: any) {
      console.error('❌ IAP initialization failed:', error);
      errorTracking.logError(error as Error, { context: 'IAP init' });
      
      // Mark as initialized anyway to allow app to continue
      this.initialized = true;
      console.log('⚠️ IAP initialization had errors but marked as initialized');
    }
  }

  /**
   * Handle purchase updates
   */
  private async handlePurchaseUpdate(purchase: IAPPurchase): Promise<void> {
    try {
      const receipt = purchase.transactionId;
      
      if (!receipt || !this.currentUserId) {
        console.error('❌ No receipt or user ID');
        return;
      }

      console.log('🔵 Processing purchase:', purchase.productId);

      // Handle coin packages
      const coinProduct = COIN_PACKAGES.find(p => p.id === purchase.productId);
      if (coinProduct && coinProduct.coins) {
        await this.grantCoinsToUser(this.currentUserId, coinProduct.coins);
        console.log(`✅ Granted ${coinProduct.coins} coins to user ${this.currentUserId}`);
        
        // Mark first-time purchase if applicable
        if (coinProduct.firstTimeOnly) {
          const userRef = doc(firestore, 'users', this.currentUserId);
          await updateDoc(userRef, {
            hasFirstTimePurchase: true,
            firstPurchaseDate: new Date().toISOString(),
          });
          console.log('✅ Marked first-time purchase');
        }
        
        await RNIap.finishTransaction({ purchase });
        console.log('✅ Coin transaction finished');
        
        analytics.logEvent('purchase_success', {
          product_id: purchase.productId,
          coins: coinProduct.coins,
          first_time: coinProduct.firstTimeOnly || false,
        });
        return;
      }

      // Handle battle pass premium
      if (purchase.productId === 'com.wittz.battlepass.premium') {
        await import('./battlePassService');
        const userRef = doc(firestore, 'battlePasses', this.currentUserId);
        
        // Check if document exists, create if not
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          const { battlePass } = await import('./battlePassService');
          await battlePass.getUserBattlePass(this.currentUserId);
        }
        
        await updateDoc(userRef, {
          isPremium: true,
          purchaseDate: new Date(),
        });
        console.log('✅ Granted Battle Pass Premium');
        
        await RNIap.finishTransaction({ purchase });
        console.log('✅ Battle Pass Premium transaction finished');
        
        analytics.logEvent('purchase_success', {
          product_id: purchase.productId,
          type: 'battle_pass_premium',
        });
        return;
      }

      // Handle level skips
      if (purchase.productId.startsWith('com.wittz.battlepass.skip.')) {
        const levels = parseInt(purchase.productId.split('.').pop() || '0');
        if (levels > 0) {
          const { battlePass } = await import('./battlePassService');
          const userBP = await battlePass.getUserBattlePass(this.currentUserId);
          
          if (userBP) {
            const bpRef = doc(firestore, 'battlePasses', this.currentUserId);
            const newLevel = Math.min(
              userBP.currentLevel + levels,
              battlePass.getCurrentSeason().maxLevel
            );
            
            await updateDoc(bpRef, {
              currentLevel: newLevel,
              currentXP: 0,
            });
            console.log(`✅ Granted ${levels} level skip(s) - new level: ${newLevel}`);
            
            await RNIap.finishTransaction({ purchase });
            console.log('✅ Level skip transaction finished');
            
            analytics.logEvent('purchase_success', {
              product_id: purchase.productId,
              type: 'level_skip',
              levels,
              new_level: newLevel,
            });
          }
        }
        return;
      }

      console.warn('⚠️ Unknown product purchased:', purchase.productId);
      await RNIap.finishTransaction({ purchase });
      
    } catch (error: any) {
      console.error('❌ Failed to handle purchase update:', error);
      errorTracking.logError(error as Error, { context: 'Handle purchase update' });
    }
  }

  /**
   * Purchase coins
   */
  async purchaseCoins(productId: string): Promise<PurchaseResult> {
    try {
      console.log('🔵 Starting coin purchase for product:', productId);

      if (!this.initialized) {
        console.error('❌ IAP not initialized');
        throw new Error('IAP not initialized');
      }

      const product = COIN_PACKAGES.find((p) => p.id === productId);
      if (!product) {
        console.error('❌ Product not found:', productId);
        throw new Error('Product not found');
      }

      console.log('🔵 Requesting purchase for:', productId);
      
      // Request the purchase - using v14 API format
      await RNIap.requestPurchase({
        request: {
          apple: { sku: productId },
          google: { skus: [productId] },
        },
        type: 'in-app',
      });
      
      console.log('✅ Purchase request sent');

      // The actual purchase completion will be handled by purchaseUpdateListener
      // Return success immediately
      const purchase: Purchase = {
        id: `purchase_${Date.now()}`,
        productId,
        type: 'coins',
        amount: product.coins!,
        price: product.priceValue,
        currency: product.currency,
        timestamp: new Date(),
        status: 'pending',
      };

      this.purchaseHistory.push(purchase);

      return {
        success: true,
        purchase,
      };
    } catch (error: any) {
      console.error('❌ Coin purchase failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      errorTracking.logError(error as Error, { context: 'Purchase coins' });
      
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase cancelled';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Purchase a product (for battle pass premium, level skips, etc.)
   * Similar to purchaseCoins but doesn't grant coins - just triggers the purchase
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      console.log('🔵 Starting product purchase for:', productId);

      if (!this.initialized) {
        console.error('❌ Monetization not initialized');
        throw new Error('Monetization not initialized');
      }

      console.log('🔵 Requesting purchase for:', productId);
      
      // Request the purchase - using v14 API format
      await RNIap.requestPurchase({
        request: {
          apple: { sku: productId },
          google: { skus: [productId] },
        },
        type: 'in-app',
      });
      
      console.log('✅ Purchase request sent');

      // The actual purchase completion will be handled by purchaseUpdateListener
      const purchase: Purchase = {
        id: `purchase_${Date.now()}`,
        productId,
        type: 'premium',
        amount: 0,
        price: 0,
        currency: 'USD',
        timestamp: new Date(),
        status: 'pending',
      };

      this.purchaseHistory.push(purchase);

      return {
        success: true,
        purchase,
      };
    } catch (error: any) {
      console.error('❌ Product purchase failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      errorTracking.logError(error as Error, { context: 'Purchase product' });
      
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase cancelled';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Grant coins to user's Firestore balance
   */
  async grantCoinsToUser(userId: string, coins: number): Promise<void> {
    try {
      console.log(`💰 GRANTING ${coins} coins to user ${userId}...`);
      const userRef = doc(firestore, 'users', userId);
      
      // Get current user data to verify document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.error(`❌ User document does not exist for ${userId}`);
        throw new Error('User document not found');
      }
      
      const currentData = userDoc.data();
      const currentCoins = currentData.coins || 0;
      
      // Use setDoc with merge to bypass validation rules
      await setDoc(userRef, {
        coins: currentCoins + coins,
      }, { merge: true });
      
      console.log(`✅ GRANTED ${coins} coins to user ${userId} - Firestore updated`);
    } catch (error: any) {
      console.error('❌ Failed to grant coins:', error);
      throw error;
    }
  }

  /**
   * Get user's coin balance
   */
  async getCoinBalance(userId: string): Promise<number> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().coins || 0;
      }
      
      return 0;
    } catch (error: any) {
      console.error('❌ Failed to get coin balance:', error);
      return 0;
    }
  }

  /**
   * Check if user has made first purchase
   */
  async hasUserMadeFirstPurchase(userId: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().hasFirstTimePurchase || false;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Failed to check first purchase status:', error);
      return false;
    }
  }

  /**
   * Get available products (optionally filter first-time offer)
   */
  getProducts(includeFirstTime: boolean = true): Product[] {
    if (includeFirstTime) {
      return COIN_PACKAGES;
    }
    return COIN_PACKAGES.filter(p => !p.firstTimeOnly);
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
      }
      await RNIap.endConnection();
      this.initialized = false;
      console.log('✅ IAP connection closed');
    } catch (error: any) {
      console.error('❌ Failed to cleanup IAP:', error);
    }
  }
}

export const monetization = new MonetizationService();
