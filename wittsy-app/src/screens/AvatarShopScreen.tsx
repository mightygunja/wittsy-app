/**
 * Avatar Shop Screen
 * Purchase and unlock avatar items - KEY MONETIZATION FEATURE
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { avatarService } from '../services/avatarService';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import {
  AvatarItem,
  AvatarRarity,
  RARITY_COLORS,
  RARITY_GRADIENTS,
} from '../types/avatar';

const { width } = Dimensions.get('window');

// Mock shop data - in production, this would come from Firestore
const SHOP_ITEMS: AvatarItem[] = [
  {
    id: 'skin_alien',
    category: 'skin',
    name: 'Alien Skin',
    description: 'Out of this world!',
    rarity: 'epic',
    unlockMethod: 'purchase',
    price: { coins: 500 },
    emoji: '👽',
    color: '#90EE90',
  },
  {
    id: 'eyes_laser',
    category: 'eyes',
    name: 'Laser Eyes',
    description: 'Pierce through anything',
    rarity: 'legendary',
    unlockMethod: 'purchase',
    price: { coins: 1000, premium: 5 },
    emoji: '👁️‍🗨️',
  },
  {
    id: 'hair_fire',
    category: 'hair',
    name: 'Fire Hair',
    description: 'Blazing hot style',
    rarity: 'legendary',
    unlockMethod: 'purchase',
    price: { coins: 1200 },
    emoji: '🔥',
  },
  {
    id: 'acc_crown',
    category: 'accessories',
    name: 'Royal Crown',
    description: 'Fit for a king',
    rarity: 'epic',
    unlockMethod: 'purchase',
    price: { coins: 750 },
    emoji: '👑',
  },
  {
    id: 'fx_rainbow',
    category: 'effects',
    name: 'Rainbow Aura',
    description: 'Magical rainbow effect',
    rarity: 'legendary',
    unlockMethod: 'purchase',
    price: { coins: 1500, premium: 10 },
    emoji: '🌈',
  },
];

export const AvatarShopScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadShopData();
    analytics.screenView('AvatarShop');

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadShopData = async () => {
    if (!user || !userProfile) return;

    try {
      const avatarData = await avatarService.getUserAvatar(user.uid);
      if (avatarData) {
        setUnlockedItems(avatarData.unlockedItems);
      }

      // Load user coins from userProfile
      setUserCoins(userProfile.coins || 0);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: AvatarItem) => {
    if (!user) return;

    const coinPrice = item.price?.coins || 0;
    const premiumPrice = item.price?.premium || 0;

    // Check if already unlocked
    if (unlockedItems.includes(item.id)) {
      Alert.alert('Already Owned', 'You already own this item!');
      return;
    }

    // Check if user has enough coins
    if (coinPrice > 0 && userCoins < coinPrice) {
      Alert.alert(
        'Insufficient Coins',
        `You need ${coinPrice} coins but only have ${userCoins}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Get Coins',
            onPress: () => navigation.navigate('CoinShop'),
          },
        ]
      );
      return;
    }

    // Show purchase confirmation
    Alert.alert(
      'Purchase Item',
      `Buy "${item.name}" for ${coinPrice} coins${
        premiumPrice > 0 ? ` or ${premiumPrice} premium currency` : ''
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy with Coins',
          onPress: () => completePurchase(item, 'coins'),
        },
        ...(premiumPrice > 0
          ? [
              {
                text: `Buy with Premium (${premiumPrice})`,
                onPress: () => completePurchase(item, 'premium'),
              },
            ]
          : []),
      ]
    );
  };

  const completePurchase = async (item: AvatarItem, method: 'coins' | 'premium') => {
    if (!user) return;

    setPurchasing(item.id);
    haptics.medium();

    try {
      const price = method === 'coins' ? item.price?.coins || 0 : item.price?.premium || 0;

      const success = await avatarService.purchaseItem(user.uid, item.id, price);

      if (success) {
        setUnlockedItems([...unlockedItems, item.id]);
        setUserCoins(userCoins - price);
        
        haptics.success();
        
        Alert.alert(
          '🎉 Purchase Successful!',
          `You unlocked "${item.name}"! Go to Avatar Creator to use it.`,
          [
            { text: 'OK' },
            {
              text: 'Customize Now',
              onPress: () => navigation.navigate('AvatarCreator'),
            },
          ]
        );

        analytics.logEvent('purchase_avatar_item', {
          item_id: item.id,
          item_name: item.name,
          price,
          method,
          rarity: item.rarity,
        });
      } else {
        haptics.error();
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      haptics.error();
      Alert.alert('Error', 'Failed to complete purchase.');
    } finally {
      setPurchasing(null);
    }
  };

  const getRarityGradient = (rarity: AvatarRarity) => {
    return RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS.common;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading shop...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Coins Display */}
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsIcon}>🪙</Text>
          <Text style={styles.coinsText}>{userCoins} coins</Text>
        </View>

        {/* Shop Items */}
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Featured Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Featured Items</Text>
              <Text style={styles.sectionDescription}>
                Limited time exclusive items
              </Text>
            </View>

            {/* Items Grid */}
            <View style={styles.itemsGrid}>
              {SHOP_ITEMS.map((item) => {
                const isUnlocked = unlockedItems.includes(item.id);
                const isPurchasing = purchasing === item.id;

                return (
                  <Card key={item.id} variant="elevated" style={styles.itemCard}>
                    <LinearGradient
                      colors={getRarityGradient(item.rarity) as any}
                      style={styles.itemHeader}
                    >
                      <Text style={styles.itemEmoji}>{item.emoji}</Text>
                      {isUnlocked && (
                        <View style={styles.ownedBadge}>
                          <Text style={styles.ownedText}>✓ Owned</Text>
                        </View>
                      )}
                    </LinearGradient>

                    <View style={styles.itemBody}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        
                        <View style={styles.rarityBadge}>
                          <View
                            style={[
                              styles.rarityDot,
                              { backgroundColor: RARITY_COLORS[item.rarity] },
                            ]}
                          />
                          <Text style={styles.rarityText}>
                            {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                          </Text>
                        </View>
                      </View>

                      {!isUnlocked && (
                        <View style={styles.priceContainer}>
                          {item.price?.coins && (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceIcon}>🪙</Text>
                              <Text style={styles.priceText}>{item.price.coins}</Text>
                            </View>
                          )}
                          {item.price?.premium && (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceIcon}>💎</Text>
                              <Text style={styles.priceText}>{item.price.premium}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <Button
                        title={
                          isUnlocked
                            ? 'Owned'
                            : isPurchasing
                            ? 'Purchasing...'
                            : 'Purchase'
                        }
                        onPress={() => handlePurchase(item)}
                        variant={isUnlocked ? 'ghost' : 'primary'}
                        size="sm"
                        disabled={isUnlocked || isPurchasing}
                        loading={isPurchasing}
                        fullWidth
                      />
                    </View>
                  </Card>
                );
              })}
            </View>

            {/* Bundles Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎁 Special Bundles</Text>
              <Text style={styles.sectionDescription}>
                Save big with bundle deals
              </Text>
            </View>

            <Card variant="glass" style={styles.bundleCard}>
              <LinearGradient
                colors={['#FF6B6B', '#FFD93D'] as any}
                style={styles.bundleHeader}
              >
                <Text style={styles.bundleTitle}>Starter Pack</Text>
                <Text style={styles.bundleDiscount}>50% OFF</Text>
              </LinearGradient>
              <View style={styles.bundleBody}>
                <Text style={styles.bundleDescription}>
                  Get 5 epic items for the price of 3!
                </Text>
                <View style={styles.bundlePrice}>
                  <Text style={styles.bundleOriginalPrice}>3000</Text>
                  <Text style={styles.bundleFinalPrice}>🪙 1500</Text>
                </View>
                <Button
                  title="Buy Bundle"
                  onPress={() => {
                    haptics.medium();
                    Alert.alert('Coming Soon', 'Bundles will be available soon!');
                  }}
                  variant="gold"
                  size="md"
                  fullWidth
                />
              </View>
            </Card>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
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
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  coinsIcon: { fontSize: 20 },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollView: { flex: 1 },
  content: { padding: SPACING.md },
  section: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  itemCard: {
    width: (width - SPACING.md * 3) / 2,
    padding: 0,
    overflow: 'hidden',
  },
  itemHeader: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemEmoji: { fontSize: 64 },
  ownedBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  ownedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  itemBody: { padding: SPACING.sm },
  itemInfo: { marginBottom: SPACING.sm },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  priceContainer: {
    marginBottom: SPACING.sm,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceIcon: { fontSize: 16 },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bundleCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  bundleHeader: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bundleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bundleDiscount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  bundleBody: { padding: SPACING.md },
  bundleDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  bundlePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  bundleOriginalPrice: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  bundleFinalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
});
