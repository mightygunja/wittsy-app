/**
 * Monetization Service
 * In-App Purchases, Subscriptions, and Revenue Management
 */

import { Platform } from 'react-native';
import { analytics } from './analytics';
import { errorTracking } from './errorTracking';

// Product IDs
export const COIN_PRODUCTS = {
  SMALL: Platform.select({
    ios: 'com.wittsy.coins.500',
    android: 'coins_500',
  }),
  MEDIUM: Platform.select({
    ios: 'com.wittsy.coins.1500',
    android: 'coins_1500',
  }),
  LARGE: Platform.select({
    ios: 'com.wittsy.coins.3000',
    android: 'coins_3000',
  }),
  MEGA: Platform.select({
    ios: 'com.wittsy.coins.10000',
    android: 'coins_10000',
  }),
};

export const PREMIUM_PRODUCTS = {
  SMALL: Platform.select({
    ios: 'com.wittsy.premium.10',
    android: 'premium_10',
  }),
  MEDIUM: Platform.select({
    ios: 'com.wittsy.premium.50',
    android: 'premium_50',
  }),
  LARGE: Platform.select({
    ios: 'com.wittsy.premium.100',
    android: 'premium_100',
  }),
  MEGA: Platform.select({
    ios: 'com.wittsy.premium.500',
    android: 'premium_500',
  }),
};

export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: Platform.select({
    ios: 'com.wittsy.premium.monthly',
    android: 'premium_monthly',
  }),
  YEARLY: Platform.select({
    ios: 'com.wittsy.premium.yearly',
    android: 'premium_yearly',
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
}

export const COIN_PACKAGES: Product[] = [
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
    bestValue: true,
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
    discount: 25,
  },
];

export const PREMIUM_PACKAGES: Product[] = [
  {
    id: PREMIUM_PRODUCTS.SMALL!,
    type: 'premium',
    name: 'Gem Pouch',
    description: '10 premium gems',
    price: '$0.99',
    priceValue: 0.99,
    currency: 'USD',
    premium: 10,
  },
  {
    id: PREMIUM_PRODUCTS.MEDIUM!,
    type: 'premium',
    name: 'Gem Bag',
    description: '50 premium gems',
    price: '$4.99',
    priceValue: 4.99,
    currency: 'USD',
    premium: 50,
    popular: true,
  },
  {
    id: PREMIUM_PRODUCTS.LARGE!,
    type: 'premium',
    name: 'Gem Chest',
    description: '100 premium gems',
    price: '$8.99',
    priceValue: 8.99,
    currency: 'USD',
    premium: 100,
    bestValue: true,
    discount: 15,
  },
  {
    id: PREMIUM_PRODUCTS.MEGA!,
    type: 'premium',
    name: 'Gem Vault',
    description: '500 premium gems',
    price: '$29.99',
    priceValue: 29.99,
    currency: 'USD',
    premium: 500,
    discount: 30,
  },
];

export const SUBSCRIPTION_PLANS: Product[] = [
  {
    id: SUBSCRIPTION_PRODUCTS.MONTHLY!,
    type: 'subscription',
    name: 'Premium Monthly',
    description: 'Monthly subscription',
    price: '$4.99/month',
    priceValue: 4.99,
    currency: 'USD',
    features: [
      '500 coins per month',
      '10 premium gems per month',
      'Exclusive avatar items',
      'Ad-free experience',
      'Priority matchmaking',
      'Custom room themes',
    ],
    popular: true,
  },
  {
    id: SUBSCRIPTION_PRODUCTS.YEARLY!,
    type: 'subscription',
    name: 'Premium Yearly',
    description: 'Yearly subscription',
    price: '$49.99/year',
    priceValue: 49.99,
    currency: 'USD',
    features: [
      '6,000 coins per year',
      '120 premium gems per year',
      'All monthly benefits',
      'Exclusive yearly avatar',
      'VIP badge',
      'Early access to features',
    ],
    bestValue: true,
    discount: 17,
  },
];

class MonetizationService {
  private purchaseHistory: Purchase[] = [];
  private activeSubscription: Subscription | null = null;

  /**
   * Initialize monetization
   */
  async initialize(): Promise<void> {
    try {
      // In production, initialize RevenueCat or similar
      console.log('Monetization service initialized');
    } catch (error) {
      errorTracking.logError(error as Error, { context: 'Monetization init' });
    }
  }

  /**
   * Purchase coins
   */
  async purchaseCoins(productId: string): Promise<PurchaseResult> {
    try {
      const product = COIN_PACKAGES.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // In production, use RevenueCat or Expo IAP
      // For now, simulate purchase
      const purchase: Purchase = {
        id: `purchase_${Date.now()}`,
        productId,
        type: 'coins',
        amount: product.coins!,
        price: product.priceValue,
        currency: product.currency,
        timestamp: new Date(),
        status: 'completed',
      };

      this.purchaseHistory.push(purchase);

      // Track analytics
      analytics.logEvent('purchase', {
        product_id: productId,
        product_name: product.name,
        price: product.priceValue,
        currency: product.currency,
        type: 'coins',
        amount: product.coins,
      });

      return {
        success: true,
        purchase,
      };
    } catch (error) {
      errorTracking.logError(error as Error, { context: 'Purchase coins' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Purchase premium currency
   */
  async purchasePremium(productId: string): Promise<PurchaseResult> {
    try {
      const product = PREMIUM_PACKAGES.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const purchase: Purchase = {
        id: `purchase_${Date.now()}`,
        productId,
        type: 'premium',
        amount: product.premium!,
        price: product.priceValue,
        currency: product.currency,
        timestamp: new Date(),
        status: 'completed',
      };

      this.purchaseHistory.push(purchase);

      analytics.logEvent('purchase', {
        product_id: productId,
        product_name: product.name,
        price: product.priceValue,
        currency: product.currency,
        type: 'premium',
        amount: product.premium,
      });

      return {
        success: true,
        purchase,
      };
    } catch (error) {
      errorTracking.logError(error as Error, { context: 'Purchase premium' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Subscribe to premium
   */
  async subscribe(productId: string): Promise<SubscriptionResult> {
    try {
      const product = SUBSCRIPTION_PLANS.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Subscription not found');
      }

      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        productId,
        status: 'active',
        startDate: new Date(),
        renewalDate: this.calculateRenewalDate(productId),
        price: product.priceValue,
        currency: product.currency,
      };

      this.activeSubscription = subscription;

      analytics.logEvent('subscribe', {
        product_id: productId,
        product_name: product.name,
        price: product.priceValue,
        currency: product.currency,
        plan: productId.includes('yearly') ? 'yearly' : 'monthly',
      });

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      errorTracking.logError(error as Error, { context: 'Subscribe' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<boolean> {
    try {
      if (!this.activeSubscription) {
        return false;
      }

      this.activeSubscription.status = 'cancelled';

      analytics.logEvent('cancel_subscription', {
        subscription_id: this.activeSubscription.id,
      });

      return true;
    } catch (error) {
      errorTracking.logError(error as Error, { context: 'Cancel subscription' });
      return false;
    }
  }

  /**
   * Check subscription status
   */
  isSubscriptionActive(): boolean {
    return this.activeSubscription?.status === 'active';
  }

  /**
   * Get active subscription
   */
  getActiveSubscription(): Subscription | null {
    return this.activeSubscription;
  }

  /**
   * Get purchase history
   */
  getPurchaseHistory(): Purchase[] {
    return this.purchaseHistory;
  }

  /**
   * Calculate total revenue
   */
  getTotalRevenue(): number {
    const purchaseRevenue = this.purchaseHistory.reduce(
      (sum, p) => sum + p.price,
      0
    );
    const subscriptionRevenue = this.activeSubscription?.price || 0;
    return purchaseRevenue + subscriptionRevenue;
  }

  /**
   * Calculate renewal date
   */
  private calculateRenewalDate(productId: string): Date {
    const now = new Date();
    if (productId.includes('yearly')) {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      return new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      // In production, restore from App Store/Play Store
      analytics.logEvent('restore_purchases', {});
      return true;
    } catch (error) {
      errorTracking.logError(error as Error, { context: 'Restore purchases' });
      return false;
    }
  }
}

// Types
export interface Purchase {
  id: string;
  productId: string;
  type: 'coins' | 'premium';
  amount: number;
  price: number;
  currency: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface Subscription {
  id: string;
  productId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  renewalDate: Date;
  price: number;
  currency: string;
}

export interface PurchaseResult {
  success: boolean;
  purchase?: Purchase;
  error?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

// Export singleton
export const monetizationService = new MonetizationService();

// Export convenience functions
export const monetization = {
  initialize: () => monetizationService.initialize(),
  purchaseCoins: (productId: string) => monetizationService.purchaseCoins(productId),
  purchasePremium: (productId: string) => monetizationService.purchasePremium(productId),
  subscribe: (productId: string) => monetizationService.subscribe(productId),
  cancelSubscription: () => monetizationService.cancelSubscription(),
  isSubscriptionActive: () => monetizationService.isSubscriptionActive(),
  getActiveSubscription: () => monetizationService.getActiveSubscription(),
  getPurchaseHistory: () => monetizationService.getPurchaseHistory(),
  getTotalRevenue: () => monetizationService.getTotalRevenue(),
  restorePurchases: () => monetizationService.restorePurchases(),
};
