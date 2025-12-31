/**
 * Monetization Service
 * In-App Purchases, Subscriptions, and Revenue Management
 */

import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { firestore } from './firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { analytics } from './analytics';
import { errorTracking } from './errorTracking';

// Product IDs
export const COIN_PRODUCTS = {
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

export const PREMIUM_PRODUCTS = {
  SMALL: Platform.select({
    ios: 'com.wittz.premium.10',
    android: 'premium_10',
  }),
  MEDIUM: Platform.select({
    ios: 'com.wittz.premium.50',
    android: 'premium_50',
  }),
  LARGE: Platform.select({
    ios: 'com.wittz.premium.100',
    android: 'premium_100',
  }),
  MEGA: Platform.select({
    ios: 'com.wittz.premium.500',
    android: 'premium_500',
  }),
};

export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: Platform.select({
    ios: 'com.wittz.premium.monthly',
    android: 'premium_monthly',
  }),
  YEARLY: Platform.select({
    ios: 'com.wittz.premium.yearly',
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
  private initialized: boolean = false;
  private customerInfo: CustomerInfo | null = null;
  private offerings: PurchasesOffering | null = null;
  private currentUserId: string | null = null;

  /**
   * Initialize RevenueCat
   */
  async initialize(userId?: string): Promise<void> {
    try {
      if (this.initialized) return;

      // Get API keys from environment
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      });

      if (!apiKey) {
        console.warn('RevenueCat API key not found. IAP will not work.');
        return;
      }

      // Configure RevenueCat
      Purchases.configure({ apiKey });

      // Set user ID if provided
      if (userId) {
        await Purchases.logIn(userId);
        this.currentUserId = userId;
      }

      // Get initial customer info
      this.customerInfo = await Purchases.getCustomerInfo();

      // Fetch offerings to get real prices
      await this.fetchOfferings();

      this.initialized = true;
      console.log('✅ RevenueCat initialized successfully');
      
      analytics.logEvent('revenuecat_initialized', {});
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      errorTracking.logError(error as Error, { context: 'RevenueCat init' });
    }
  }

  /**
   * Purchase coins using RevenueCat
   */
  async purchaseCoins(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.initialized) {
        throw new Error('RevenueCat not initialized');
      }

      const product = COIN_PACKAGES.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Get offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      const packageToPurchase = this.findPackageByProductId(offerings, productId);

      if (!packageToPurchase) {
        // DEVELOPMENT MODE: If package not found (Test Store), simulate purchase for testing
        console.warn('⚠️ Package not found in RevenueCat - using development mode');
        console.log('💡 In production, ensure products are configured in App Store Connect and RevenueCat');
        
        // For testing: Just grant the coins without actual purchase
        if (this.currentUserId) {
          await this.grantCoinsToUser(this.currentUserId, product.coins!);
          console.log(`✅ [DEV MODE] Granted ${product.coins} coins to user ${this.currentUserId}`);
        } else {
          throw new Error('User not logged in');
        }

        const purchase: Purchase = {
          id: `dev_purchase_${Date.now()}`,
          productId,
          type: 'coins',
          amount: product.coins!,
          price: product.priceValue,
          currency: product.currency,
          timestamp: new Date(),
          status: 'completed',
        };

        this.purchaseHistory.push(purchase);

        analytics.logEvent('purchase_dev_mode', {
          product_id: productId,
          product_name: product.name,
          amount: product.coins,
        });

        console.log('✅ [DEV MODE] Coin purchase simulated:', productId);

        return {
          success: true,
          purchase,
        };
      }

      // Make the purchase
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.customerInfo = customerInfo;

      // ✅ CRITICAL: Grant coins to user's Firestore balance
      if (this.currentUserId) {
        await this.grantCoinsToUser(this.currentUserId, product.coins!);
        console.log(`✅ Granted ${product.coins} coins to user ${this.currentUserId}`);
      } else {
        console.error('❌ No user ID available to grant coins!');
        throw new Error('User not logged in');
      }

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

      console.log('✅ Coin purchase successful:', productId);

      return {
        success: true,
        purchase,
      };
    } catch (error) {
      console.error('❌ Coin purchase failed:', error);
      errorTracking.logError(error as Error, { context: 'Purchase coins' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Purchase premium currency using RevenueCat
   */
  async purchasePremium(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.initialized) {
        throw new Error('RevenueCat not initialized');
      }

      const product = PREMIUM_PACKAGES.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const offerings = await Purchases.getOfferings();
      const packageToPurchase = this.findPackageByProductId(offerings, productId);

      if (!packageToPurchase) {
        // DEVELOPMENT MODE: If package not found (Test Store), simulate purchase for testing
        console.warn('⚠️ Package not found in RevenueCat - using development mode');
        console.log('💡 In production, ensure products are configured in App Store Connect and RevenueCat');
        
        // For testing: Just grant the premium gems without actual purchase
        if (this.currentUserId) {
          await this.grantPremiumToUser(this.currentUserId, product.premium!);
          console.log(`✅ [DEV MODE] Granted ${product.premium} gems to user ${this.currentUserId}`);
        } else {
          throw new Error('User not logged in');
        }

        const purchase: Purchase = {
          id: `dev_purchase_${Date.now()}`,
          productId,
          type: 'premium',
          amount: product.premium!,
          price: product.priceValue,
          currency: product.currency,
          timestamp: new Date(),
          status: 'completed',
        };

        this.purchaseHistory.push(purchase);

        analytics.logEvent('purchase_dev_mode', {
          product_id: productId,
          product_name: product.name,
          amount: product.premium,
        });

        console.log('✅ [DEV MODE] Premium purchase simulated:', productId);

        return {
          success: true,
          purchase,
        };
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.customerInfo = customerInfo;

      // ✅ CRITICAL: Grant premium gems to user's Firestore balance
      if (this.currentUserId) {
        await this.grantPremiumToUser(this.currentUserId, product.premium!);
        console.log(`✅ Granted ${product.premium} gems to user ${this.currentUserId}`);
      } else {
        console.error('❌ No user ID available to grant premium!');
        throw new Error('User not logged in');
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

      console.log('✅ Premium purchase successful:', productId);

      return {
        success: true,
        purchase,
      };
    } catch (error) {
      console.error('❌ Premium purchase failed:', error);
      errorTracking.logError(error as Error, { context: 'Purchase premium' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Subscribe to premium using RevenueCat
   */
  async subscribe(productId: string): Promise<SubscriptionResult> {
    try {
      if (!this.initialized) {
        throw new Error('RevenueCat not initialized');
      }

      const product = SUBSCRIPTION_PLANS.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Subscription not found');
      }

      const offerings = await Purchases.getOfferings();
      const packageToPurchase = this.findPackageByProductId(offerings, productId);

      if (!packageToPurchase) {
        throw new Error('Subscription package not found in RevenueCat');
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.customerInfo = customerInfo;

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

      console.log('✅ Subscription successful:', productId);

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      console.error('❌ Subscription failed:', error);
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
   * Restore purchases using RevenueCat
   */
  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.initialized) {
        throw new Error('RevenueCat not initialized');
      }

      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;

      analytics.logEvent('restore_purchases', {});
      console.log('✅ Purchases restored successfully');
      return true;
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      errorTracking.logError(error as Error, { context: 'Restore purchases' });
      return false;
    }
  }

  /**
   * Fetch and cache offerings from RevenueCat
   */
  private async fetchOfferings(): Promise<void> {
    try {
      const offerings = await Purchases.getOfferings();
      this.offerings = offerings.current;
      
      // Update product packages with real prices
      if (this.offerings) {
        this.updateProductPrices();
      }
    } catch (error) {
      console.error('❌ Failed to fetch offerings:', error);
    }
  }

  /**
   * Update product packages with real prices from RevenueCat
   */
  private updateProductPrices(): void {
    if (!this.offerings) return;

    const allPackages = this.offerings.availablePackages;

    // Update coin packages
    COIN_PACKAGES.forEach((product) => {
      const rcPackage = allPackages.find((pkg) => pkg.product.identifier === product.id);
      if (rcPackage) {
        product.price = rcPackage.product.priceString;
        product.priceValue = rcPackage.product.price;
        product.currency = rcPackage.product.currencyCode;
        console.log(`✅ Updated ${product.name}: ${product.price}`);
      }
    });

    // Update premium packages
    PREMIUM_PACKAGES.forEach((product) => {
      const rcPackage = allPackages.find((pkg) => pkg.product.identifier === product.id);
      if (rcPackage) {
        product.price = rcPackage.product.priceString;
        product.priceValue = rcPackage.product.price;
        product.currency = rcPackage.product.currencyCode;
        console.log(`✅ Updated ${product.name}: ${product.price}`);
      }
    });

    // Update subscription plans
    SUBSCRIPTION_PLANS.forEach((product) => {
      const rcPackage = allPackages.find((pkg) => pkg.product.identifier === product.id);
      if (rcPackage) {
        product.price = rcPackage.product.priceString;
        product.priceValue = rcPackage.product.price;
        product.currency = rcPackage.product.currencyCode;
        console.log(`✅ Updated ${product.name}: ${product.price}`);
      }
    });
  }

  /**
   * Get available offerings from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    return this.offerings;
  }

  /**
   * Get product packages with real prices
   */
  getCoinPackages(): Product[] {
    return COIN_PACKAGES;
  }

  getPremiumPackages(): Product[] {
    return PREMIUM_PACKAGES;
  }

  getSubscriptionPlans(): Product[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get customer info
   */
  getCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  /**
   * Check if user has active entitlement
   */
  hasEntitlement(entitlementId: string): boolean {
    if (!this.customerInfo) return false;
    return this.customerInfo.entitlements.active[entitlementId] !== undefined;
  }

  /**
   * Grant coins to user's Firestore balance
   */
  private async grantCoinsToUser(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      
      // Check if user document exists
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error('User document not found');
      }

      // Update coins using increment to avoid race conditions
      await updateDoc(userRef, {
        'stats.coins': increment(amount)
      });

      console.log(`✅ Successfully added ${amount} coins to user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to grant coins:', error);
      throw error;
    }
  }

  /**
   * Grant premium gems to user's Firestore balance
   */
  private async grantPremiumToUser(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      
      // Check if user document exists
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error('User document not found');
      }

      // Update premium gems using increment
      await updateDoc(userRef, {
        'stats.premium': increment(amount)
      });

      console.log(`✅ Successfully added ${amount} gems to user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to grant premium:', error);
      throw error;
    }
  }

  /**
   * Helper to find package by product ID
   */
  private findPackageByProductId(
    offerings: { current: PurchasesOffering | null },
    productId: string
  ): PurchasesPackage | null {
    if (!offerings.current) return null;

    const allPackages = [
      ...offerings.current.availablePackages,
      offerings.current.monthly,
      offerings.current.annual,
      offerings.current.lifetime,
    ].filter((pkg): pkg is PurchasesPackage => pkg !== null);

    return allPackages.find((pkg) => pkg.product.identifier === productId) || null;
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
  initialize: (userId?: string) => monetizationService.initialize(userId),
  purchaseCoins: (productId: string) => monetizationService.purchaseCoins(productId),
  purchasePremium: (productId: string) => monetizationService.purchasePremium(productId),
  subscribe: (productId: string) => monetizationService.subscribe(productId),
  cancelSubscription: () => monetizationService.cancelSubscription(),
  isSubscriptionActive: () => monetizationService.isSubscriptionActive(),
  getActiveSubscription: () => monetizationService.getActiveSubscription(),
  getPurchaseHistory: () => monetizationService.getPurchaseHistory(),
  getTotalRevenue: () => monetizationService.getTotalRevenue(),
  restorePurchases: () => monetizationService.restorePurchases(),
  getOfferings: () => monetizationService.getOfferings(),
  getCustomerInfo: () => monetizationService.getCustomerInfo(),
  hasEntitlement: (entitlementId: string) => monetizationService.hasEntitlement(entitlementId),
  getCoinPackages: () => monetizationService.getCoinPackages(),
  getPremiumPackages: () => monetizationService.getPremiumPackages(),
  getSubscriptionPlans: () => monetizationService.getSubscriptionPlans(),
};
