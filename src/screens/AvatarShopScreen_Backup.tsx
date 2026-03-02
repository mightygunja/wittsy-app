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
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { avatarService } from '../services/avatarService';
import { avatarShopService } from '../services/avatarShopService';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { SPACING, RADIUS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import {
  AvatarItem,
  AvatarRarity,
  AvatarCategory,
  RARITY_COLORS,
  RARITY_GRADIENTS,
} from '../types/avatar';
import { contentWidth, gridColumns, tabletHorizontalPadding } from '../utils/responsive';

const width = contentWidth;

// Coin prices based on rarity
const RARITY_PRICES: Record<string, number> = {
  common: 100,
  rare: 300,
  epic: 600,
  legendary: 1000,
  exclusive: 1500,
};

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
  const [shopItems, setShopItems] = useState<AvatarItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | AvatarCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<AvatarRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'price_low' | 'price_high' | 'rarity' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [featuredItems, setFeaturedItems] = useState<AvatarItem[]>([]);
  const [newArrivals, setNewArrivals] = useState<AvatarItem[]>([]);

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadShopData();
  }, []);

  // Update coins whenever userProfile changes
  useEffect(() => {
    if (userProfile?.stats?.coins !== undefined) {
      setUserCoins(userProfile.stats.coins);
    }
  }, [userProfile?.stats?.coins]);

  const loadShopData = async () => {
    if (!user || !userProfile) return;

    try {
      const avatarData = await avatarService.getUserAvatar(user.uid);
      const unlocked = avatarData?.unlockedItems || [];
      setUnlockedItems(unlocked);

      // Load user coins from userProfile
      setUserCoins(userProfile.stats?.coins || 0);

      // Get all shop items from comprehensive catalog
      const allItems = avatarShopService.getAllShopItems();
      
      // Filter out already unlocked items
      const availableItems = allItems.filter(item => !unlocked.includes(item.id));
      
      setShopItems(availableItems);
      
      // Get featured items (legendary and exclusive)
      const featured = avatarShopService.getFeaturedItems().filter(item => !unlocked.includes(item.id));
      setFeaturedItems(featured);
      
      // Get new arrivals (first 20 items)
      const arrivals = avatarShopService.getNewArrivals().filter(item => !unlocked.includes(item.id));
      setNewArrivals(arrivals);
      
      console.log(`🛍️ Avatar Shop loaded: ${availableItems.length} items, ${featured.length} featured, ${arrivals.length} new`);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: AvatarItem) => {
    if (!user) return;

    const coinPrice = item.price?.coins || 0;

    // Check if already unlocked
    if (unlockedItems.includes(item.id)) {
      Alert.alert('Already Owned', 'You already own this item!');
      return;
    }

    // Check if user has enough coins
    if (userCoins < coinPrice) {
      Alert.alert(
        'Insufficient Coins',
        `You need ${coinPrice} coins but only have ${userCoins}.`,
        [
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // Show purchase confirmation
    Alert.alert(
      'Purchase Item',
      `Buy "${item.name}" for ${coinPrice} coins?\n\nThis item can also be unlocked by leveling up in the Battle Pass.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy for ${coinPrice} `,
          onPress: () => completePurchase(item),
        },
      ]
    );
  };

  const completePurchase = async (item: AvatarItem) => {
    if (!user) return;

    setPurchasing(item.id);
    haptics.medium();

    try {
      const price = item.price?.coins || 0;

      const success = await avatarService.purchaseItem(user.uid, item.id, price);

      if (success) {
        setUnlockedItems([...unlockedItems, item.id]);
        setUserCoins(userCoins - price);
        
        // Remove purchased item from shop
        setShopItems(shopItems.filter(i => i.id !== item.id));
        
        haptics.success();
        
        Alert.alert(
          ' Purchase Successful!',
          `You unlocked "${item.name}"! Check it out in the Avatar Creator.`,
          [
            { text: 'OK' },
            {
              text: 'Go to Avatar Creator',
              onPress: () => navigation.navigate('AvatarCreator'),
            },
          ]
        );

        analytics.logEvent('purchase_avatar_item', {
          item_id: item.id,
          item_name: item.name,
          price,
          method: 'coins',
          rarity: item.rarity,
          source: 'battle_pass_shop',
        });

        await refreshUserProfile();
      }
    } catch (error: any) {
      haptics.error();
      Alert.alert('Purchase Failed', error.message || 'Failed to purchase item');
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
          <CurrencyDisplay variant="compact" />
        </View>

        {/* Category Filter */}
        <Animated.ScrollView
          horizontal
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          {['all', 'hair', 'accessories', 'clothing', 'facial_hair', 'face_paint', 'background', 'effects'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(cat as any)}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === cat && styles.categoryButtonTextActive]}>
                {cat === 'all' ? '🌟 All' : cat === 'hair' ? '💇 Hair' : cat === 'accessories' ? '👓 Accessories' : cat === 'clothing' ? '👕 Clothing' : cat === 'facial_hair' ? '🧔 Facial Hair' : cat === 'face_paint' ? '🎨 Face Paint' : cat === 'background' ? '🌈 Backgrounds' : '✨ Effects'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>

        {/* Shop Items */}
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>🛍️ Avatar Shop</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedCategory === 'all' ? `${shopItems.length} premium items available` : `${shopItems.filter(i => i.category === selectedCategory).length} ${selectedCategory.replace('_', ' ')} items`}
          </Text>
          
          {shopItems.filter(item => selectedCategory === 'all' || item.category === selectedCategory).length === 0 ? (
            <Card variant="glass" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All Unlocked!</Text>
              <Text style={styles.emptyText}>
                You've unlocked all {selectedCategory === 'all' ? 'available' : selectedCategory.replace('_', ' ')} items!
              </Text>
            </Card>
          ) : (
            <View style={styles.itemsGrid}>
              {shopItems.filter(item => selectedCategory === 'all' || item.category === selectedCategory).map((item) => {
                const isUnlocked = unlockedItems.includes(item.id);
                const isPurchasing = purchasing === item.id;
                const rarityColor = RARITY_COLORS[item.rarity];
                const rarityGradient = RARITY_GRADIENTS[item.rarity];
                const canAfford = userCoins >= (item.price?.coins || 0);
                const isDisabled = isUnlocked || isPurchasing || !canAfford;

                const cardStyle = !canAfford && !isUnlocked 
                  ? { ...styles.itemCard, ...styles.itemCardDisabled }
                  : styles.itemCard;

                return (
                  <Card key={item.id} variant="glass" style={cardStyle}>
                    <LinearGradient
                      colors={rarityGradient as any}
                      style={styles.itemHeader}
                    >
                      <Text style={styles.itemEmoji}>{item.emoji}</Text>
                      {isUnlocked && (
                        <View style={styles.unlockedBadge}>
                          <Text style={styles.unlockedText}>✓ Owned</Text>
                        </View>
                      )}
                    </LinearGradient>

                    <View style={styles.itemBody}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, !canAfford && !isUnlocked && styles.textDisabled]}>{item.name}</Text>
                        <View style={styles.rarityBadge}>
                          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                          <Text style={[styles.rarityText, { color: rarityColor }]}>
                            {item.rarity.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {!isUnlocked && (
                        <View style={styles.priceContainer}>
                          {item.price?.coins && (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceIcon}>🪙</Text>
                              <Text style={[styles.priceText, !canAfford && styles.textDisabled]}>{item.price.coins}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <Button
                        title={isUnlocked ? 'Owned' : isPurchasing ? 'Purchasing...' : !canAfford ? 'Not Enough Coins' : 'Buy Now'}
                        onPress={() => handlePurchase(item)}
                        variant={isUnlocked ? 'outline' : 'primary'}
                        size="sm"
                        disabled={isDisabled}
                        fullWidth
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
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
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.8,
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
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: 8,
    transform: [{ scale: 1.15 }],
  },
  coinsIcon: { fontSize: 20 },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  content: { padding: SPACING.md },
  section: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    lineHeight: 22,
    opacity: 0.9,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    padding: SPACING.xl * 1.5,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: SPACING.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md + tabletHorizontalPadding,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  itemCard: {
    width: (width - SPACING.md * (gridColumns + 2)) / gridColumns,
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    minHeight: 280,
  },
  itemCardDisabled: {
    opacity: 0.5,
  },
  itemHeader: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemEmoji: { 
    fontSize: 52,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  unlockedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
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
  itemBody: { 
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 170,
  },
  itemInfo: { 
    marginBottom: SPACING.sm,
    minHeight: 75,
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 21,
    letterSpacing: 0.3,
  },
  textDisabled: {
    opacity: 0.6,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
    minHeight: 75,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  priceIcon: { fontSize: 16 },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
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
  categoryScroll: {
    maxHeight: 50,
    marginBottom: SPACING.sm,
  },
  categoryScrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: SPACING.xs,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryButtonTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
