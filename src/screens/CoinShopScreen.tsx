/**
 * Coin Shop Screen
 * Purchase coins and premium currency - MONETIZATION
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { monetization, COIN_PACKAGES, PREMIUM_PACKAGES, Product } from '../services/monetization';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS, SPACING, RADIUS } from '../utils/constants';

const { width } = Dimensions.get('window');

export const CoinShopScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'coins' | 'premium'>('coins');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    analytics.screenView('CoinShop');

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

  const handlePurchase = async (product: Product) => {
    if (!user) return;

    haptics.medium();
    setPurchasing(product.id);

    try {
      let result;
      if (product.type === 'coins') {
        result = await monetization.purchaseCoins(product.id);
      } else {
        result = await monetization.purchasePremium(product.id);
      }

      if (result.success) {
        haptics.success();
        Alert.alert(
          '🎉 Purchase Successful!',
          `You received ${product.coins || product.premium} ${
            product.type === 'coins' ? 'coins' : 'gems'
          }!`,
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
            {isCoins ? '🪙' : '💎'}
          </Text>
          <Text style={styles.productAmount}>
            {product.coins || product.premium}
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

  const products = selectedTab === 'coins' ? COIN_PACKAGES : PREMIUM_PACKAGES;

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop</Text>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={async () => {
              haptics.light();
              const success = await monetization.restorePurchases();
              if (success) {
                Alert.alert('Success', 'Purchases restored!');
              }
            }}
          >
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'coins' && styles.tabActive]}
            onPress={() => {
              haptics.selection();
              setSelectedTab('coins');
            }}
          >
            <Text style={styles.tabIcon}>🪙</Text>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'coins' && styles.tabTextActive,
              ]}
            >
              Coins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'premium' && styles.tabActive]}
            onPress={() => {
              haptics.selection();
              setSelectedTab('premium');
            }}
          >
            <Text style={styles.tabIcon}>💎</Text>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'premium' && styles.tabTextActive,
              ]}
            >
              Premium
            </Text>
          </TouchableOpacity>
        </View>

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
                {selectedTab === 'coins' ? '🪙 About Coins' : '💎 About Premium Gems'}
              </Text>
              <Text style={styles.infoText}>
                {selectedTab === 'coins'
                  ? 'Use coins to unlock avatar items, enter special events, and customize your experience!'
                  : 'Premium gems unlock exclusive items, special features, and give you VIP status!'}
              </Text>
            </Card>

            {/* Safe Purchase */}
            <View style={styles.safeSection}>
              <Text style={styles.safeText}>🔒 Secure Payment</Text>
              <Text style={styles.safeSubtext}>
                All transactions are processed securely through your app store
              </Text>
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
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
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  productCard: {
    width: (width - SPACING.md * 3) / 2,
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
