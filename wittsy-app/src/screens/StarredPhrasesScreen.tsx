/**
 * Starred Phrases Screen
 * Gallery view of starred phrases - both user's own and top community phrases
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { BackButton } from '../components/common/BackButton';
import { getUserStarredPhrases, getCommunityStarredPhrases, StarredPhrase } from '../services/starredPhrases';
import { SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { haptics } from '../services/haptics';
import { AvatarDisplay } from '../components/avatar/AvatarDisplay';

type ViewMode = 'mine' | 'community';

export const StarredPhrasesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const { colors: COLORS } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('community');
  const [myPhrases, setMyPhrases] = useState<StarredPhrase[]>([]);
  const [communityPhrases, setCommunityPhrases] = useState<StarredPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wins' | 'top'>('all');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadAllPhrases();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadAllPhrases = async () => {
    setLoading(true);
    try {
      // Load both user's phrases and community phrases in parallel
      const [userPhrases, topPhrases] = await Promise.all([
        userProfile?.uid ? getUserStarredPhrases(userProfile.uid, 100) : Promise.resolve([]),
        getCommunityStarredPhrases(100),
      ]);
      
      setMyPhrases(userPhrases);
      setCommunityPhrases(topPhrases);
    } catch (error) {
      console.error('Error loading starred phrases:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllPhrases();
    setRefreshing(false);
  };

  const getCurrentPhrases = () => {
    return viewMode === 'mine' ? myPhrases : communityPhrases;
  };

  const getFilteredPhrases = () => {
    const phrases = getCurrentPhrases();
    switch (filter) {
      case 'wins':
        return phrases.filter(p => p.won);
      case 'top':
        return phrases.filter(p => p.stars >= 4);
      default:
        return phrases;
    }
  };

  const filteredPhrases = getFilteredPhrases();

  const renderPhraseCard = (phrase: StarredPhrase, index: number) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const isMyPhrase = phrase.userId === userProfile?.uid;

    return (
      <Animated.View
        key={phrase.matchId}
        style={[
          styles.phraseCard,
          {
            opacity: cardAnim,
            transform: [{
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ]}
      >
        <LinearGradient
          colors={phrase.won ? ['#10B981', '#059669'] : ['#6366F1', '#4F46E5']}
          style={styles.cardGradient}
        >
          {/* Star Count Badge */}
          <View style={styles.starBadge}>
            <Text style={styles.starEmoji}>⭐</Text>
            <Text style={styles.starCount}>×{phrase.stars}</Text>
          </View>

          {/* User Attribution (for community view) */}
          {viewMode === 'community' && phrase.username && (
            <View style={styles.userSection}>
              {phrase.userAvatar && (
                <View style={styles.avatarContainer}>
                  <AvatarDisplay avatar={phrase.userAvatar} size={32} />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.username}>
                  {phrase.username}
                  {isMyPhrase && <Text style={styles.youBadge}> (You)</Text>}
                </Text>
              </View>
            </View>
          )}

          {/* Phrase Text */}
          <View style={styles.phraseContent}>
            <Text style={styles.phraseText}>"{phrase.phrase}"</Text>
          </View>

          {/* Prompt (if available) */}
          {phrase.prompt && (
            <View style={styles.promptSection}>
              <Text style={styles.promptLabel}>Prompt:</Text>
              <Text style={styles.promptText}>{phrase.prompt}</Text>
            </View>
          )}

          {/* Metadata */}
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>👍</Text>
              <Text style={styles.metadataText}>{phrase.totalVotes} votes</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>🎮</Text>
              <Text style={styles.metadataText}>{phrase.roomName}</Text>
            </View>
            {phrase.won && (
              <View style={styles.winBadge}>
                <Text style={styles.winText}>🏆 WIN</Text>
              </View>
            )}
          </View>

          {/* Date */}
          <Text style={styles.dateText}>
            {phrase.playedAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BackButton onPress={() => navigation.goBack()} />
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.text }]}>⭐ Starred Phrases</Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
            {viewMode === 'mine' 
              ? 'Your best phrases that earned 4+ votes'
              : 'Top phrases from the community'}
          </Text>
        </View>
      </Animated.View>

      {/* View Mode Tabs */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'community' && styles.viewModeTabActive]}
          onPress={() => {
            haptics.light();
            setViewMode('community');
          }}
        >
          <Text style={[styles.viewModeText, viewMode === 'community' && styles.viewModeTextActive]}>
            🌟 Top Community ({communityPhrases.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'mine' && styles.viewModeTabActive]}
          onPress={() => {
            haptics.light();
            setViewMode('mine');
          }}
        >
          <Text style={[styles.viewModeText, viewMode === 'mine' && styles.viewModeTextActive]}>
            👤 My Phrases ({myPhrases.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => {
            haptics.light();
            setFilter('all');
          }}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({getCurrentPhrases().length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'top' && styles.filterTabActive]}
          onPress={() => {
            haptics.light();
            setFilter('top');
          }}
        >
          <Text style={[styles.filterText, filter === 'top' && styles.filterTextActive]}>
            Top Rated (4+ ⭐)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'wins' && styles.filterTabActive]}
          onPress={() => {
            haptics.light();
            setFilter('wins');
          }}
        >
          <Text style={[styles.filterText, filter === 'wins' && styles.filterTextActive]}>
            Winning Phrases
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
            Loading starred phrases...
          </Text>
        </View>
      ) : filteredPhrases.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredPhrases.map((phrase, index) => renderPhraseCard(phrase, index))}
          
          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={[styles.emptyTitle, { color: COLORS.text }]}>
            {filter === 'all' 
              ? (viewMode === 'mine' ? 'No Starred Phrases Yet' : 'No Community Phrases Yet')
              : 'No Phrases Match Filter'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
            {filter === 'all'
              ? (viewMode === 'mine' 
                  ? 'Earn stars by getting 4+ votes on your phrases!'
                  : 'Be the first to earn stars!')
              : 'Try a different filter to see more phrases'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  backIcon: {
    fontSize: 24,
    color: '#A855F7',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
  },
  viewModeTabActive: {
    backgroundColor: '#A855F7',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A855F7',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#A855F7',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A855F7',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  phraseCard: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  cardGradient: {
    padding: SPACING.lg,
  },
  starBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  starEmoji: {
    fontSize: 16,
  },
  starCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingRight: 60,
  },
  avatarContainer: {
    marginRight: SPACING.sm,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  phraseContent: {
    marginBottom: SPACING.md,
    paddingRight: 60,
  },
  phraseText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  promptSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  metadataIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metadataText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  winBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  winText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
});
