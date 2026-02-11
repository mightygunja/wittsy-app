/**
 * Coin Shop Screen
 * Purchase coins and premium currency - MONETIZATION
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { monetization, COIN_PACKAGES, Product } from '../services/monetization';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import { contentWidth, gridColumns, tabletHorizontalPadding } from '../utils/responsive';

const width = contentWidth;

export const CoinShopScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const { user, refreshUserProfile } = useAuth();
  // Removed premium tab - only coins available
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [hasFirstPurchase, setHasFirstPurchase] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [restoring, setRestoring] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    analytics.screenView('CoinShop');
    loadPurchaseStatus();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadPurchaseStatus = async () => {
    if (!user) return;
    
    try {
      const hasPurchased = await monetization.hasUserMadeFirstPurchase(user.uid);
      setHasFirstPurchase(hasPurchased);
    } catch (error) {
      console.error('Failed to load purchase status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: Product) => {
    if (!user) return;

    haptics.medium();
    setPurchasing(product.id);

    try {
      let result;
      result = await monetization.purchaseCoins(product.id);

      if (result.success) {
        haptics.success();
        
        // Refresh user profile to update coin balance
        await refreshUserProfile();
        
        // Reload purchase status if this was first-time offer
        if (product.firstTimeOnly) {
          await loadPurchaseStatus();
        }
        
        Alert.alert(
          '🎉 Purchase Successful!',
          `You received ${product.coins} coins!${product.firstTimeOnly ? '\n\nThank you for your first purchase!' : ''}`,
          [{ text: 'Awesome!' }]
        );
      } else {
        haptics.error();
        Alert.alert('Purchase Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      haptics.error();
      Alert.alert('Error', 'Failed to complete purchase.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    haptics.medium();
    try {
      const result = await monetization.restorePurchases();
      if (result.success) {
        if (result.restored > 0) {
          await refreshUserProfile();
          Alert.alert('Purchases Restored', `Successfully restored ${result.restored} purchase${result.restored > 1 ? 's' : ''}.`);
        } else {
          Alert.alert('No Purchases Found', 'There are no previous purchases to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const renderProductCard = (product: Product) => {
    const isPurchasing = purchasing === product.id;
    const isCoins = product.type === 'coins';

    return (
      <Card key={product.id} variant="elevated" style={styles.productCard}>
        {product.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>⭐ POPULAR</Text>
          </View>
        )}
        {product.bestValue && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>💎 BEST VALUE</Text>
          </View>
        )}
        {product.specialOffer && (
          <View style={styles.specialOfferBadge}>
            <Text style={styles.specialOfferText}>🎁 SPECIAL OFFER</Text>
          </View>
        )}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}

        <LinearGradient
          colors={
            isCoins
              ? ['#FFD700', '#FFA500']
              : ['#9B59B6', '#8E44AD']
          }
          style={styles.productHeader}
        >
          <Text style={styles.productIcon}>
            🪙
          </Text>
          <Text style={styles.productAmount}>
            {product.coins}
          </Text>
        </LinearGradient>

        <View style={styles.productBody}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>

          {product.discount && (
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>
                ${((product.priceValue / (1 - product.discount / 100))).toFixed(2)}
              </Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
          )}
          {!product.discount && (
            <Text style={styles.productPrice}>{product.price}</Text>
          )}

          <Button
            title={isPurchasing ? 'Processing...' : 'Purchase'}
            onPress={() => handlePurchase(product)}
            variant={product.bestValue ? 'gold' : 'primary'}
            size="md"
            fullWidth
            disabled={isPurchasing}
            loading={isPurchasing}
          />
        </View>
      </Card>
    );
  };

  // Filter products based on first purchase status
  const products = loading 
    ? [] 
    : COIN_PACKAGES.filter(p => !p.firstTimeOnly || !hasFirstPurchase);

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Removed tabs - only coins available */}

        {/* Products */}
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.productsGrid}>
              {products.map((product) => renderProductCard(product))}
            </View>

            {/* Info Section */}
            <Card variant="glass" style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                🪙 About Coins
              </Text>
              <Text style={styles.infoText}>
                Use coins to unlock avatar items, enter special events, and customize your experience!
              </Text>
            </Card>

            {/* Safe Purchase */}
            <View style={styles.safeSection}>
              <Text style={styles.safeText}>🔒 Secure Payment</Text>
              <Text style={styles.safeSubtext}>
                All transactions are processed securely through your app store
              </Text>
            </View>

            {/* Restore Purchases - Required by Apple */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 24, color: COLORS.text },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: COLORS.gold,
  },
  tabIcon: { fontSize: 20 },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
    paddingHorizontal: SPACING.md + tabletHorizontalPadding,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  productCard: {
    width: (width - SPACING.md * (gridColumns + 1)) / gridColumns,
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bestValueBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 10,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  specialOfferBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: '#FF6B9D',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 10,
  },
  specialOfferText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: '#E74C3C',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 10,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  productHeader: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIcon: { fontSize: 48, marginBottom: 4 },
  productAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  productBody: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: SPACING.sm,
  },
  infoCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  safeSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  safeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  safeSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
