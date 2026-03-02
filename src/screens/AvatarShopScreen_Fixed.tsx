/**
 * Avatar Shop Screen - PERFORMANCE OPTIMIZED
 * Single FlatList architecture for smooth scrolling
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
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
import { useTheme } from '../hooks/useTheme';
import {
  AvatarItem,
  AvatarRarity,
  AvatarCategory,
  RARITY_COLORS,
  RARITY_GRADIENTS,
} from '../types/avatar';
import { contentWidth, gridColumns, tabletHorizontalPadding } from '../utils/responsive';

const width = contentWidth;

export const AvatarShopScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({
  navigation,
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
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    if (userProfile?.coins !== undefined) {
      setUserCoins(userProfile.coins);
    }
  }, [userProfile?.coins]);

  const loadShopData = async () => {
    if (!user || !userProfile) return;

    try {
      const avatarData = await avatarService.getUserAvatar(user.uid);
      const unlocked = avatarData?.unlockedItems || [];
      setUnlockedItems(unlocked);

      setUserCoins(userProfile.coins || 0);

      const allItems = avatarShopService.getAllShopItems();
      const availableItems = allItems.filter(item => !unlocked.includes(item.id));
      
      setShopItems(availableItems);
      
      console.log(`🛍️ Avatar Shop loaded: ${availableItems.length} items available`);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = useCallback(async (item: AvatarItem) => {
    if (!user) return;

    const coinPrice = item.price?.coins || 0;

    if (unlockedItems.includes(item.id)) {
      Alert.alert('Already Owned', 'You already own this item!');
      return;
    }

    if (userCoins < coinPrice) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${coinPrice - userCoins} more coins to purchase this item.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Coins', onPress: () => navigation.navigate('CoinShop') },
        ]
      );
      return;
    }

    haptics.medium();
    setPurchasing(item.id);

    try {
      await avatarService.purchaseItem(user.uid, item.id, coinPrice);
      
      setUnlockedItems(prev => [...prev, item.id]);
      setShopItems(prev => prev.filter(i => i.id !== item.id));
      
      await refreshUserProfile();
      
      haptics.success();
      
      Alert.alert(
        '🎉 Purchase Successful!',
        `You unlocked "${item.name}"! Check it out in the Avatar Creator.`,
        [
          { text: 'OK' },
          {
            text: 'Go to Avatar Creator',
            onPress: () => navigation.navigate('AvatarCreator'),
          },
        ]
      );

      analytics.logEvent('avatar_item_purchased', {
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        rarity: item.rarity,
        price: coinPrice,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      haptics.error();
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(null);
    }
  }, [user, userCoins, unlockedItems, navigation, refreshUserProfile]);

  const getFilteredAndSortedItems = (items: AvatarItem[]) => {
    let filtered = [...items];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(item => item.rarity === selectedRarity);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.price?.coins || 0) - (b.price?.coins || 0);
        case 'price_high':
          return (b.price?.coins || 0) - (a.price?.coins || 0);
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, exclusive: 4 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'newest':
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredItems = useMemo(() => getFilteredAndSortedItems(shopItems), [
    shopItems,
    selectedCategory,
    selectedRarity,
    searchQuery,
    sortBy,
  ]);

  const renderItemCard = useCallback((item: AvatarItem) => {
    const isUnlocked = unlockedItems.includes(item.id);
    const isPurchasing = purchasing === item.id;
    const rarityColor = RARITY_COLORS[item.rarity];
    const rarityGradient = RARITY_GRADIENTS[item.rarity];
    const canAfford = userCoins >= (item.price?.coins || 0);
    const isDisabled = isUnlocked || isPurchasing || !canAfford;

    let cardStyle: any = styles.itemCard;
    if (!canAfford && !isUnlocked) {
      cardStyle = [styles.itemCard, styles.itemCardDisabled];
    }

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
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.rarityBadge}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
              <Text style={styles.rarityText}>{item.rarity}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>💰 {item.price?.coins || 0}</Text>
          </View>

          <Button
            title={isUnlocked ? 'Owned' : isPurchasing ? 'Purchasing...' : 'Buy Now'}
            onPress={() => handlePurchase(item)}
            variant={isUnlocked ? 'outline' : 'primary'}
            size="sm"
            disabled={isDisabled}
            loading={isPurchasing}
          />
        </View>
      </Card>
    );
  }, [unlockedItems, purchasing, userCoins, handlePurchase, styles]);

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Coins Display */}
      <View style={styles.coinsDisplay}>
        <CurrencyDisplay variant="compact" />
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Filters & Sort</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Rarity:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {['all', 'common', 'rare', 'epic', 'legendary', 'exclusive'].map((rarity) => (
                <TouchableOpacity
                  key={rarity}
                  style={[styles.filterChip, selectedRarity === rarity && styles.filterChipActive]}
                  onPress={() => setSelectedRarity(rarity as any)}
                >
                  <Text style={[styles.filterChipText, selectedRarity === rarity && styles.filterChipTextActive]}>
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {[
                { value: 'newest', label: '🆕 Newest' },
                { value: 'price_low', label: '💰 Price: Low' },
                { value: 'price_high', label: '💎 Price: High' },
                { value: 'rarity', label: '⭐ Rarity' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterChip, sortBy === option.value && styles.filterChipActive]}
                  onPress={() => setSortBy(option.value as any)}
                >
                  <Text style={[styles.filterChipText, sortBy === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Category Filter */}
      <ScrollView
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
      </ScrollView>

      {/* Section Title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🛍️ {selectedCategory === 'all' ? 'All Items' : selectedCategory.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <Card variant="glass" style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No Items Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Try adjusting your search or filters' : 'You\'ve unlocked all items in this category!'}
      </Text>
      {searchQuery && (
        <Button
          title="Clear Search"
          onPress={() => {
            setSearchQuery('');
            setSelectedRarity('all');
            setSelectedCategory('all');
          }}
          variant="primary"
          size="md"
          style={styles.emptyButton}
        />
      )}
    </Card>
  );

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
        <FlatList
          data={filteredItems}
          renderItem={({ item }) => renderItemCard(item)}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          numColumns={2}
          columnWrapperStyle={filteredItems.length > 0 ? styles.flatListRow : undefined}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  clearButton: {
    fontSize: 18,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  filterButtonText: { fontSize: 20 },
  filterPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  filterSection: { marginBottom: SPACING.md },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  filterOptions: { flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: SPACING.xs,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: { color: COLORS.text },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  section: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    padding: SPACING.xl * 1.5,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  emptyIcon: { fontSize: 72, marginBottom: SPACING.lg },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: { minWidth: 200 },
  flatListRow: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  flatListContent: {
    paddingBottom: SPACING.xl,
  },
  itemCard: {
    width: (width - SPACING.md * 3) / 2,
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    minHeight: 240,
  },
  itemCardDisabled: { opacity: 0.6 },
  itemHeader: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemEmoji: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  unlockedBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemBody: {
    padding: SPACING.md,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  itemInfo: {
    minHeight: 60,
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
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
  categoryButtonActive: { backgroundColor: COLORS.primary },
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
