import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getPromptsByCategory, getPromptPacks, getCategoryCounts, getActiveCategories } from '../services/prompts';
import { Prompt, PromptPack, PromptCategory } from '../types/prompts';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import { tabletHorizontalPadding } from '../utils/responsive';

// Category metadata mapping - provides display info for known categories
const CATEGORY_METADATA: Record<string, { name: string; icon: string; color: string }> = {
  'general': { name: 'General', icon: '💬', color: '#A855F7' },
  'pop-culture': { name: 'Pop Culture', icon: '🎬', color: '#FF6B9D' },
  'food': { name: 'Food', icon: '🍕', color: '#FFB84D' },
  'technology': { name: 'Tech', icon: '💻', color: '#4ECDC4' },
  'sports': { name: 'Sports', icon: '⚽', color: '#95E1D3' },
  'movies': { name: 'Movies', icon: '🎥', color: '#F38181' },
  'music': { name: 'Music', icon: '🎵', color: '#AA96DA' },
  'travel': { name: 'Travel', icon: '✈️', color: '#FCBAD3' },
  'animals': { name: 'Animals', icon: '🐾', color: '#A8D8EA' },
  'history': { name: 'History', icon: '📜', color: '#D4A5A5' },
  'science': { name: 'Science', icon: '🔬', color: '#9FD8CB' },
  'relationships': { name: 'Love', icon: '💕', color: '#FFB6B9' },
  'work': { name: 'Work', icon: '💼', color: '#FFA07A' },
  'school': { name: 'School', icon: '📚', color: '#98D8C8' },
  'holidays': { name: 'Holidays', icon: '🎄', color: '#FF6B6B' },
  'seasonal': { name: 'Seasonal', icon: '🍂', color: '#F7B731' },
  'trending': { name: 'Trending', icon: '🔥', color: '#FF4757' },
  'nsfw': { name: 'NSFW', icon: '🔞', color: '#E74C3C' },
};

// Fallback for unknown categories
const getDefaultCategoryMetadata = (category: string) => ({
  name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
  icon: '📝',
  color: '#9B59B6',
});

export const PromptLibraryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('food');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [packs, setPacks] = useState<PromptPack[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [activeCategories, setActiveCategories] = useState<PromptCategory[]>([
    'food', 'general', 'personal', 'entertainment', 'technology',
    'social-media', 'work', 'relationships', 'travel', 'fashion',
    'music', 'gaming', 'animals', 'sports', 'shopping'
  ] as PromptCategory[]);
  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    // Load data immediately - no delays
    loadData();
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [packsData, counts, categories] = await Promise.all([
        getPromptPacks(),
        getCategoryCounts(),
        getActiveCategories(),
      ]);
      setPacks(packsData);
      setCategoryCounts(counts);
      setActiveCategories(categories);
      
      // Update selected category to first in sorted list
      const sorted = [...categories].sort((a, b) => {
        const countA = counts[a] || 0;
        const countB = counts[b] || 0;
        return countB - countA;
      });
      if (sorted.length > 0 && sorted[0] !== selectedCategory) {
        setSelectedCategory(sorted[0]);
      }
    } catch (error) {
      console.error('Error loading prompt library:', error);
    }
  };

  const loadPrompts = async () => {
    try {
      const promptsData = await getPromptsByCategory(selectedCategory, 50);
      setPrompts(promptsData);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prompt.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Build category objects from active categories in Firestore
  const categories = activeCategories.map(categoryId => {
    const metadata = CATEGORY_METADATA[categoryId] || getDefaultCategoryMetadata(categoryId);
    return {
      id: categoryId,
      name: metadata.name,
      icon: metadata.icon,
      color: metadata.color,
    };
  });

  // Sort categories by prompt count (descending) and limit to top 15
  const sortedCategories = [...categories].sort((a, b) => {
    const countA = categoryCounts[a.id] || 0;
    const countB = categoryCounts[b.id] || 0;
    return countB - countA;
  }).slice(0, 15);

  // Removed loading check - render immediately

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight]}
        style={styles.gradient}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search prompts..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {sortedCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
                { borderColor: category.color },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive,
                ]}
              >
                {category.name}
              </Text>
              {categoryCounts[category.id] > 0 && (
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{categoryCounts[category.id]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Packs */}
        {packs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Featured Packs</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.packsContainer}
            >
              {packs.slice(0, 5).map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  style={styles.packCard}
                  onPress={() => Alert.alert('Coming Soon', 'Prompt pack details will be available in a future update!')}
                >
                  <LinearGradient
                    colors={[COLORS.primaryLight, COLORS.primary]}
                    style={styles.packGradient}
                  >
                    <Text style={styles.packIcon}>{pack.icon}</Text>
                    <Text style={styles.packName}>{pack.name}</Text>
                    <Text style={styles.packCount}>{pack.promptIds.length} prompts</Text>
                    {pack.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>PREMIUM</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Prompts List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name} Prompts
            </Text>
            <Text style={styles.promptCount}>{filteredPrompts.length}</Text>
          </View>

          {filteredPrompts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching prompts' : `No ${categories.find(c => c.id === selectedCategory)?.name} prompts yet`}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery 
                  ? 'Try a different search term or category'
                  : 'Check back soon or try another category'}
              </Text>
            </View>
          ) : (
            <View style={styles.promptsList}>
              {filteredPrompts.map((prompt) => (
                <View
                  key={prompt.id}
                  style={styles.promptCard}
                >
                  <View style={styles.promptHeader}>
                    <View style={[styles.difficultyBadge, styles[`difficulty${prompt.difficulty}`]]}>
                      <Text style={styles.difficultyText}>
                        {prompt.difficulty.toUpperCase()}
                      </Text>
                    </View>
                    {prompt.isPremium && (
                      <View style={styles.premiumTag}>
                        <Text style={styles.premiumTagText}>👑</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.promptText}>{prompt.text}</Text>
                  <View style={styles.promptFooter}>
                    <View style={styles.promptTags}>
                      {(prompt.tags || []).slice(0, 3).map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.promptStats}>🎮 {prompt.timesUsed || 0}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Submit Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('SubmitPrompt')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary as any}
          style={styles.floatingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.floatingIcon}>✨</Text>
          <Text style={styles.floatingText}>Submit Prompt</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl + tabletHorizontalPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  categoriesContainer: {
    marginBottom: SPACING.md,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryNameActive: {
    color: COLORS.primary,
  },
  categoryCount: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  promptCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
  },
  packsContainer: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  packCard: {
    width: 160,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  packGradient: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  packName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  packCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  premiumBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },
  promptsList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  promptCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  difficultyeasy: {
    backgroundColor: '#4ECDC4',
  },
  difficultymedium: {
    backgroundColor: '#FFB84D',
  },
  difficultyhard: {
    backgroundColor: '#FF6B9D',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },
  premiumTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTagText: {
    fontSize: 14,
  },
  promptText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  promptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flex: 1,
  },
  tag: {
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  tagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  promptStats: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.xl,
    elevation: 8,
  },
  floatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  floatingIcon: {
    fontSize: 20,
  },
  floatingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
});
