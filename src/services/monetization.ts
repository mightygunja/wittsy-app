/**
 * Simplified Monetization Service
 * Direct In-App Purchases using react-native-iap (NO RevenueCat)
 */

import { Platform } from 'react-native';
import { firestore } from './firebase';
import { doc, updateDoc, increment, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { analytics } from './analytics';
import { errorTracking } from './errorTracking';
import { isIAPAvailable } from '../utils/platform';

// Dynamic import for Expo Go compatibility
let RNIap: any = null;
let IAPProduct: any = null;
let IAPPurchase: any = null;
let PurchaseError: any = null;

// Only load IAP module if not in Expo Go to prevent NativeEventEmitter errors
if (isIAPAvailable()) {
  try {
    const iapModule = require('react-native-iap');
    RNIap = iapModule;
    IAPProduct = iapModule.Product;
    IAPPurchase = iapModule.Purchase;
    PurchaseError = iapModule.PurchaseError;
  } catch (e) {
    console.log('⏭️ Failed to load IAP module:', e);
  }
} else {
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
  /**
   * For coin purchases: true once the coins have actually landed in Firestore.
   * success:true with granted:false means the store charge went through but the
   * grant is still processing (it will be retried on next launch / restore).
   */
  granted?: boolean;
}

class MonetizationService {
  private initialized = false;
  private currentUserId: string | null = null;
  private purchaseHistory: Purchase[] = [];
  private availableProducts: IAPProduct[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  // Purchases awaiting their grant, keyed by productId. Resolved by the
  // purchase listeners so purchaseCoins can report the real outcome.
  private pendingGrants = new Map<string, (result: { granted: boolean; error?: string }) => void>();

  /**
   * Set (or clear) the user purchases are credited to. Must track every auth
   * change — the IAP connection outlives sign-out/sign-in, and a stale id
   * here credits real-money purchases to the wrong account.
   */
  setUser(userId: string | null): void {
    this.currentUserId = userId;
  }

  /**
   * Initialize IAP connection
   */
  async initialize(userId?: string): Promise<void> {
    // Always update the active user, even when the connection already exists
    // (account switch after sign-out re-runs initialize with a new uid).
    if (userId) {
      this.currentUserId = userId;
    }

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
        COIN_PRODUCTS.FIRST_TIME!,
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
          // Unblock any purchase waiting on its grant (cancel, card declined, ...)
          const failedProductId = (error as any)?.productId;
          const message = error?.code === 'E_USER_CANCELLED' ? 'Purchase cancelled' : (error?.message || 'Purchase failed');
          if (failedProductId && this.pendingGrants.has(failedProductId)) {
            this.pendingGrants.get(failedProductId)!({ granted: false, error: message });
            this.pendingGrants.delete(failedProductId);
          } else {
            for (const [key, resolve] of this.pendingGrants) {
              resolve({ granted: false, error: message });
              this.pendingGrants.delete(key);
            }
          }
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
        // Idempotent by transactionId: safe against listener re-delivery,
        // restore, and app-relaunch replays of unfinished transactions.
        await this.grantCoinsIdempotent(this.currentUserId, coinProduct.coins, receipt, purchase.productId);
        console.log(`✅ Granted ${coinProduct.coins} coins to user ${this.currentUserId}`);
        
        // Mark first-time purchase if applicable and grant exclusive item
        if (coinProduct.firstTimeOnly) {
          const userRef = doc(firestore, 'users', this.currentUserId);
          await updateDoc(userRef, {
            hasFirstTimePurchase: true,
            firstPurchaseDate: new Date().toISOString(),
          });
          console.log('✅ Marked first-time purchase');
          
          // Grant exclusive Founder's Glory Hair
          const { avatarService } = await import('./avatarService');
          await avatarService.unlockItem(this.currentUserId, 'hair_founder_gold', 'purchase');
          console.log('✅ Granted exclusive Founder\'s Glory Hair');
        }
        
        await RNIap.finishTransaction({ purchase });
        console.log('✅ Coin transaction finished');

        analytics.logEvent('purchase_success', {
          product_id: purchase.productId,
          coins: coinProduct.coins,
          first_time: coinProduct.firstTimeOnly || false,
        });

        this.pendingGrants.get(purchase.productId)?.({ granted: true });
        this.pendingGrants.delete(purchase.productId);
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
      // Deliberately NOT finishing the transaction here: the store will
      // re-deliver it on next launch (or via Restore Purchases), so the
      // grant gets retried instead of the money being silently lost.
      this.pendingGrants.get(purchase.productId)?.({
        granted: false,
        error: 'Your payment went through, but delivering the coins hit a snag. They will be delivered automatically on your next launch, or use Restore Purchases.',
      });
      this.pendingGrants.delete(purchase.productId);
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

      // Wire up the grant listener BEFORE requesting, so a fast store
      // callback can't race past us.
      const grantResult = new Promise<{ granted: boolean; error?: string }>((resolve) => {
        this.pendingGrants.set(productId, resolve);
      });

      // Request the purchase - using v14 API format
      await RNIap.requestPurchase({
        request: {
          apple: { sku: productId },
          google: { skus: [productId] },
        },
        type: 'in-app',
      });

      console.log('✅ Purchase request sent');

      // Wait for the purchase listener to actually grant the coins (or fail).
      // The timeout covers a store callback that never arrives — in that case
      // the transaction stays unfinished and is re-delivered on next launch.
      const outcome = await Promise.race([
        grantResult,
        new Promise<{ granted: boolean; error?: string }>((resolve) =>
          setTimeout(() => resolve({ granted: false }), 60000)
        ),
      ]);
      this.pendingGrants.delete(productId);

      if (outcome.error) {
        return { success: false, error: outcome.error };
      }

      const purchase: Purchase = {
        id: `purchase_${Date.now()}`,
        productId,
        type: 'coins',
        amount: product.coins!,
        price: product.priceValue,
        currency: product.currency,
        timestamp: new Date(),
        status: outcome.granted ? 'completed' : 'pending',
      };

      this.purchaseHistory.push(purchase);

      return {
        success: true,
        granted: outcome.granted,
        purchase,
      };
    } catch (error: any) {
      this.pendingGrants.delete(productId);
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
   * Grant purchased coins exactly once per store transaction. A marker doc at
   * users/{uid}/iapTransactions/{transactionId} is written in the same
   * Firestore transaction as the balance update, so replays (listener
   * re-delivery, restore, relaunch) become no-ops instead of double grants.
   * Returns 'granted' on a fresh grant, 'already' when this transaction was
   * granted before.
   */
  async grantCoinsIdempotent(
    userId: string,
    coins: number,
    transactionId: string,
    productId?: string
  ): Promise<'granted' | 'already'> {
    // Firestore doc ids cannot contain '/'
    const markerId = String(transactionId).replace(/\//g, '_');
    const markerRef = doc(firestore, 'users', userId, 'iapTransactions', markerId);
    const userRef = doc(firestore, 'users', userId);

    return runTransaction(firestore, async (tx) => {
      const marker = await tx.get(markerRef);
      if (marker.exists()) {
        console.log(`💰 Transaction ${markerId} already granted — skipping`);
        return 'already' as const;
      }
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      tx.set(markerRef, {
        productId: productId || null,
        coins,
        grantedAt: new Date().toISOString(),
      });
      tx.update(userRef, { coins: (userDoc.data().coins || 0) + coins });
      return 'granted' as const;
    });
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
   * Restore purchases (required by Apple App Store guidelines 3.1.1)
   * Restores any previously purchased non-consumable items or active subscriptions
   */
  async restorePurchases(): Promise<{ success: boolean; restored: number; error?: string }> {
    try {
      console.log('🔄 Restoring purchases...');

      if (!RNIap) {
        console.log('⏭️ IAP not available (Expo Go)');
        return { success: true, restored: 0 };
      }

      if (!this.initialized) {
        console.error('❌ IAP not initialized');
        return { success: false, restored: 0, error: 'Store not initialized. Please try again.' };
      }

      const purchases = await RNIap.getAvailablePurchases();
      console.log('🔄 Found', purchases?.length || 0, 'previous purchases');

      let restoredCount = 0;

      if (purchases && purchases.length > 0) {
        for (const purchase of purchases) {
          // Unfulfilled coin packs: a coin purchase still sitting in
          // getAvailablePurchases was never finished — meaning its grant
          // likely failed. Grant it now (idempotently) BEFORE finishing;
          // finishing without granting would destroy the only record that
          // lets the user ever get their coins.
          const coinProduct = COIN_PACKAGES.find(p => p.id === purchase.productId);
          if (coinProduct?.coins && this.currentUserId) {
            try {
              const txId = purchase.transactionId || `${purchase.productId}_${purchase.transactionDate || 'unknown'}`;
              const result = await this.grantCoinsIdempotent(
                this.currentUserId, coinProduct.coins, txId, purchase.productId
              );
              if (result === 'granted') {
                restoredCount++;
                console.log(`✅ Restored ${coinProduct.coins} coins from unfinished transaction`);
              }
              await RNIap.finishTransaction({ purchase });
            } catch (e) {
              // Grant failed — leave the transaction unfinished so it can be
              // retried on the next launch or restore.
              console.error('Failed to restore coin purchase (kept for retry):', e);
            }
            continue;
          }

          // Handle battle pass premium restoration
          if (purchase.productId === 'com.wittz.battlepass.premium' && this.currentUserId) {
            try {
              const { battlePass } = await import('./battlePassService');
              const userBP = await battlePass.getUserBattlePass(this.currentUserId);
              if (userBP && !userBP.isPremium) {
                const bpRef = doc(firestore, 'battlePasses', this.currentUserId);
                await updateDoc(bpRef, { isPremium: true });
                restoredCount++;
                console.log('✅ Restored Battle Pass Premium');
              }
            } catch (e) {
              console.error('Failed to restore battle pass:', e);
            }
          }

          // Finish the transaction
          await RNIap.finishTransaction({ purchase });
        }
      }

      analytics.logEvent('restore_purchases', { restored_count: restoredCount });
      console.log('✅ Restore complete:', restoredCount, 'items restored');

      return { success: true, restored: restoredCount };
    } catch (error: any) {
      console.error('❌ Restore purchases failed:', error);
      errorTracking.logError(error as Error, { context: 'Restore purchases' });
      return { success: false, restored: 0, error: error.message || 'Failed to restore purchases' };
    }
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
      this.currentUserId = null;
      this.pendingGrants.clear();
      console.log('✅ IAP connection closed');
    } catch (error: any) {
      console.error('❌ Failed to cleanup IAP:', error);
    }
  }
}

export const monetization = new MonetizationService();
