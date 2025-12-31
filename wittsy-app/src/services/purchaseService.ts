/**
 * In-App Purchase Service
 * Handles premium Battle Pass purchases and other IAP
 */

import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Product,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

// Product IDs (must match App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  BATTLE_PASS_PREMIUM: 'com.wittsy.battlepass.premium',
  COINS_SMALL: 'com.wittsy.coins.small', // 500 coins
  COINS_MEDIUM: 'com.wittsy.coins.medium', // 1500 coins
  COINS_LARGE: 'com.wittsy.coins.large', // 3500 coins
  COINS_MEGA: 'com.wittsy.coins.mega', // 10000 coins
};

export const PRODUCT_PRICES = {
  [PRODUCT_IDS.BATTLE_PASS_PREMIUM]: 9.99,
  [PRODUCT_IDS.COINS_SMALL]: 0.99,
  [PRODUCT_IDS.COINS_MEDIUM]: 2.99,
  [PRODUCT_IDS.COINS_LARGE]: 4.99,
  [PRODUCT_IDS.COINS_MEGA]: 9.99,
};

export const COIN_AMOUNTS = {
  [PRODUCT_IDS.COINS_SMALL]: 500,
  [PRODUCT_IDS.COINS_MEDIUM]: 1500,
  [PRODUCT_IDS.COINS_LARGE]: 3500,
  [PRODUCT_IDS.COINS_MEGA]: 10000,
};

let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;
let isIAPAvailable = false;

/**
 * Check if IAP is available (not in Expo Go)
 */
const checkIAPAvailability = (): boolean => {
  // IAP doesn't work in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.log('⚠️ Running in Expo Go - IAP not available');
    return false;
  }
  return true;
};

/**
 * Initialize IAP connection
 */
export const initializePurchases = async (): Promise<void> => {
  try {
    // Check if IAP is available
    if (!checkIAPAvailability()) {
      console.log('⚠️ IAP not available in this environment');
      return;
    }

    await initConnection();
    isIAPAvailable = true;
    console.log('✅ IAP connection initialized');

    // Setup purchase listeners
    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('Purchase update:', purchase);
      
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          // Process the purchase
          await processPurchase(purchase);
          
          // Finish the transaction
          await finishTransaction({ purchase, isConsumable: true });
          console.log('✅ Purchase processed and finished');
        } catch (error) {
          console.error('Failed to process purchase:', error);
        }
      }
    });

    purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', error.message || 'An error occurred during purchase');
    });
  } catch (error) {
    console.error('Failed to initialize IAP:', error);
  }
};

/**
 * Cleanup IAP connection
 */
export const cleanupPurchases = async (): Promise<void> => {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
  await endConnection();
  console.log('✅ IAP connection closed');
};

/**
 * Get available products
 */
export const getAvailableProducts = async (): Promise<Product[]> => {
  try {
    if (!isIAPAvailable) {
      console.log('⚠️ IAP not available');
      return [];
    }

    const products = await getProducts({
      skus: Object.values(PRODUCT_IDS),
    });
    console.log('Available products:', products);
    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
};

/**
 * Purchase premium Battle Pass
 */
export const purchasePremiumBattlePass = async (userId: string): Promise<boolean> => {
  try {
    // Check if IAP is available
    if (!isIAPAvailable) {
      Alert.alert(
        'Not Available',
        'In-app purchases are not available in Expo Go. Please build a standalone app to test purchases.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Check if user already has premium
    const battlePassDoc = await getDoc(doc(firestore, 'battlePasses', userId));
    if (battlePassDoc.exists() && battlePassDoc.data().isPremium) {
      Alert.alert('Already Premium', 'You already have the premium Battle Pass!');
      return false;
    }

    // Request purchase
    await requestPurchase({ sku: PRODUCT_IDS.BATTLE_PASS_PREMIUM });
    
    // Purchase processing happens in the listener
    return true;
  } catch (error: any) {
    console.error('Failed to purchase Battle Pass:', error);
    
    if (error.message?.includes('Product not found')) {
      Alert.alert(
        'Setup Required',
        'In-app purchases need to be configured in App Store Connect / Google Play Console. This feature will be available after app submission.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Purchase Failed', error.message || 'Failed to complete purchase');
    }
    return false;
  }
};

/**
 * Purchase coins
 */
export const purchaseCoins = async (productId: string, userId: string): Promise<boolean> => {
  try {
    // Check if IAP is available
    if (!isIAPAvailable) {
      Alert.alert(
        'Not Available',
        'In-app purchases are not available in Expo Go. Please build a standalone app to test purchases.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!COIN_AMOUNTS[productId]) {
      throw new Error('Invalid product ID');
    }

    // Request purchase
    await requestPurchase({ sku: productId });
    
    // Purchase processing happens in the listener
    return true;
  } catch (error: any) {
    console.error('Failed to purchase coins:', error);
    
    if (error.message?.includes('Product not found')) {
      Alert.alert(
        'Setup Required',
        'In-app purchases need to be configured in App Store Connect / Google Play Console. This feature will be available after app submission.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Purchase Failed', error.message || 'Failed to complete purchase');
    }
    return false;
  }
};

/**
 * Process completed purchase
 */
const processPurchase = async (purchase: Purchase): Promise<void> => {
  const { productId, transactionReceipt, transactionId } = purchase;
  
  // Extract userId from transaction (you'll need to pass this when initiating purchase)
  // For now, we'll need to get it from auth context
  const userId = purchase.transactionId; // Placeholder - needs proper implementation
  
  try {
    // Record purchase in Firestore
    await addDoc(collection(firestore, 'purchases'), {
      userId,
      productId,
      transactionId,
      transactionReceipt,
      purchasedAt: new Date().toISOString(),
      status: 'completed',
    });

    // Process based on product type
    if (productId === PRODUCT_IDS.BATTLE_PASS_PREMIUM) {
      await grantPremiumBattlePass(userId);
    } else if (COIN_AMOUNTS[productId]) {
      await grantCoins(userId, COIN_AMOUNTS[productId], transactionId);
    }

    // Track analytics
    analytics.logEvent('purchase_completed', {
      product_id: productId,
      transaction_id: transactionId,
      value: PRODUCT_PRICES[productId] || 0,
      currency: 'USD',
    });

    Alert.alert('Purchase Successful', 'Your purchase has been completed!');
  } catch (error) {
    console.error('Failed to process purchase:', error);
    throw error;
  }
};

/**
 * Grant premium Battle Pass to user
 */
const grantPremiumBattlePass = async (userId: string): Promise<void> => {
  const battlePassRef = doc(firestore, 'battlePasses', userId);
  
  await updateDoc(battlePassRef, {
    isPremium: true,
    premiumUnlockedAt: new Date().toISOString(),
  });

  // Create notification
  await addDoc(collection(firestore, 'notifications'), {
    userId,
    type: 'purchase_success',
    title: '🎉 Premium Battle Pass Unlocked!',
    message: 'You now have access to all premium rewards!',
    read: false,
    createdAt: new Date().toISOString(),
  });

  console.log('✅ Premium Battle Pass granted to user:', userId);
};

/**
 * Grant coins to user
 */
const grantCoins = async (userId: string, amount: number, transactionId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const currentCoins = userDoc.data().coins || 0;
  
  await updateDoc(userRef, {
    coins: currentCoins + amount,
  });

  // Record transaction
  await addDoc(collection(firestore, 'transactions'), {
    userId,
    type: 'purchase',
    amount,
    transactionId,
    timestamp: new Date().toISOString(),
    description: `Purchased ${amount} coins`,
  });

  // Create notification
  await addDoc(collection(firestore, 'notifications'), {
    userId,
    type: 'purchase_success',
    title: '🪙 Coins Added!',
    message: `${amount} coins have been added to your wallet!`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  console.log(`✅ Granted ${amount} coins to user:`, userId);
};

/**
 * Restore purchases (for users who reinstalled app)
 */
export const restorePurchases = async (userId: string): Promise<void> => {
  try {
    // This would query the app store for previous purchases
    // and restore them if they exist
    Alert.alert('Restore Purchases', 'This feature will be available soon!');
    
    // TODO: Implement actual restore logic
    // const purchases = await getAvailablePurchases();
    // Process each purchase...
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    Alert.alert('Restore Failed', 'Failed to restore purchases');
  }
};

/**
 * Check if user has premium Battle Pass
 */
export const hasPremiumBattlePass = async (userId: string): Promise<boolean> => {
  try {
    const battlePassDoc = await getDoc(doc(firestore, 'battlePasses', userId));
    return battlePassDoc.exists() && battlePassDoc.data().isPremium === true;
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};
