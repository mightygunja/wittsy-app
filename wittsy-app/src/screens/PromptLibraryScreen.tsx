import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { getPromptsByCategory, getPromptPacks, getUserPromptPreferences } from '../services/prompts';
import { Prompt, PromptPack, PromptCategory } from '../types/prompts';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import { Loading } from '../components/common/Loading';

const CATEGORIES: { id: PromptCategory; name: string; icon: string; color: string }[] = [
  { id: 'general', name: 'General', icon: '💬', color: '#A855F7' },
  { id: 'pop-culture', name: 'Pop Culture', icon: '🎬', color: '#FF6B9D' },
  { id: 'food', name: 'Food', icon: '🍕', color: '#FFB84D' },
  { id: 'technology', name: 'Tech', icon: '💻', color: '#4ECDC4' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: '#95E1D3' },
  { id: 'movies', name: 'Movies', icon: '🎥', color: '#F38181' },
  { id: 'music', name: 'Music', icon: '🎵', color: '#AA96DA' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#FCBAD3' },
  { id: 'animals', name: 'Animals', icon: '🐾', color: '#A8D8EA' },
  { id: 'history', name: 'History', icon: '📜', color: '#D4A5A5' },
  { id: 'science', name: 'Science', icon: '🔬', color: '#9FD8CB' },
  { id: 'relationships', name: 'Love', icon: '💕', color: '#FFB6B9' },
];

export const PromptLibraryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('general');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [packs, setPacks] = useState<PromptPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promptsData, packsData] = await Promise.all([
        getPromptsByCategory(selectedCategory, 50),
        getPromptPacks(),
      ]);
      setPrompts(promptsData);
      setPacks(packsData);
    } catch (error) {
      console.error('Error loading prompt library:', error);
    } finally {
      setLoading(false);
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
    prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <Loading />;
  }

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Prompt Library</Text>
          <Text style={styles.subtitle}>Explore {prompts.length}+ creative prompts</Text>
        </Animated.View>

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

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
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
              {CATEGORIES.find(c => c.id === selectedCategory)?.icon} {CATEGORIES.find(c => c.id === selectedCategory)?.name} Prompts
            </Text>
            <Text style={styles.promptCount}>{filteredPrompts.length}</Text>
          </View>

          {filteredPrompts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No prompts found</Text>
              <Text style={styles.emptySubtext}>Try a different category or search term</Text>
            </View>
          ) : (
            <View style={styles.promptsList}>
              {filteredPrompts.map((prompt, index) => (
                <Animated.View
                  key={prompt.id}
                  style={[
                    styles.promptCard,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      }],
                    },
                  ]}
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
                      {prompt.tags.slice(0, 3).map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.promptStats}>🎮 {prompt.timesUsed}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Prompt Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => navigation.navigate('SubmitPrompt')}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary as any}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.submitIcon}>✨</Text>
            <Text style={styles.submitText}>Submit Your Own Prompt</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
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
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.lg,
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
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  submitButton: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  submitIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  submitText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
});
