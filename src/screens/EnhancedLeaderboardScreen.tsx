import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import {
  getLeaderboard,
  getUserGlobalPosition,
  getAvailableRegions,
  LeaderboardEntry,
  SpecializedLeaderboardEntry,
  LeaderboardType,
} from '../services/leaderboards';
import { getCurrentSeason, getSeasonLeaderboard, getDaysRemainingInSeason } from '../services/seasons';
import { RANK_TIERS } from '../services/ranking';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../utils/constants';

type TabType = 'global' | 'friends' | 'specialized' | 'season';

export const EnhancedLeaderboardScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [specializedType, setSpecializedType] = useState<LeaderboardType>('hall_of_fame');
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry | SpecializedLeaderboardEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userPosition, setUserPosition] = useState<number>(-1);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('North America');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    loadLeaderboard();
    loadUserPosition();
    loadCurrentSeason();
  }, [activeTab, specializedType, selectedRegion]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let data: (LeaderboardEntry | SpecializedLeaderboardEntry)[] = [];

      // Add timeout to prevent hanging (500ms)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 500)
      );

      const loadPromise = (async () => {
        if (activeTab === 'season' && currentSeason) {
          const seasonData = await getSeasonLeaderboard(currentSeason.id, 100);
          return seasonData.map((s, index) => ({
            userId: s.userId,
            username: '', // Would need to fetch from users collection
            rating: s.currentRating,
            rank: s.rank,
            tier: s.tier,
            gamesPlayed: s.gamesPlayed,
            gamesWon: s.wins,
            winRate: s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0,
            position: index + 1,
          }));
        } else if (activeTab === 'specialized') {
          return await getLeaderboard(specializedType, userProfile?.uid);
        } else if (activeTab === 'friends') {
          return await getLeaderboard('friends', userProfile?.uid);
        } else {
          return await getLeaderboard('global');
        }
      })();

      data = await Promise.race([loadPromise, timeoutPromise]);
      setLeaderboard(data);
    } catch (error: any) {
      console.warn('Leaderboard load failed:', error?.message || error);
      // Don't clear leaderboard - just stop loading
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosition = async () => {
    if (!userProfile?.uid) return;
    try {
      const position = await getUserGlobalPosition(userProfile.uid);
      setUserPosition(position);
    } catch (error) {
      console.error('Error loading user position:', error);
    }
  };

  const loadCurrentSeason = async () => {
    try {
      const season = await getCurrentSeason();
      setCurrentSeason(season);
    } catch (error) {
      console.error('Error loading current season:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    await loadUserPosition();
    setRefreshing(false);
  };

  const getRankColor = (tier: string): string => {
    const tierData = Object.values(RANK_TIERS).find(t => t.name === tier);
    return tierData?.color || COLORS.textSecondary;
  };

  const getRankIcon = (tier: string): string => {
    const tierData = Object.values(RANK_TIERS).find(t => t.name === tier);
    return tierData?.icon || '🥉';
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry | SpecializedLeaderboardEntry, index: number) => {
    const isCurrentUser = entry.userId === userProfile?.uid;
    const isTopThree = entry.position <= 3;
    const isSpecialized = 'specialStat' in entry;

    return (
      <Animated.View
        key={entry.userId}
        style={[
          styles.entryContainer,
          isCurrentUser && styles.currentUserEntry,
          isTopThree && styles.topThreeEntry,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Position */}
        <View style={styles.positionContainer}>
          {isTopThree ? (
            <Text style={styles.medalIcon}>
              {entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={styles.positionText}>#{entry.position}</Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
              {entry.username || `Player ${entry.userId.substring(0, 6)}`}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankIcon}>{getRankIcon(entry.tier)}</Text>
              <Text style={[styles.rankText, { color: getRankColor(entry.tier) }]}>
                {entry.rank}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entry.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entry.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entry.winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            {isSpecialized && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.specialStat}</Text>
                  <Text style={styles.statLabel}>{entry.specialStatLabel}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark] as any}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🏆 Leaderboards</Text>
        {userPosition > 0 && (
          <Text style={styles.headerSubtitle}>
            Your Global Rank: #{userPosition}
          </Text>
        )}
        {currentSeason && activeTab === 'season' && (
          <Text style={styles.seasonInfo}>
            {currentSeason.name} • {getDaysRemainingInSeason(currentSeason)} days left
          </Text>
        )}
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.activeTab]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
            🌍 Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            👥 Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'specialized' && styles.activeTab]}
          onPress={() => setActiveTab('specialized')}
        >
          <Text style={[styles.tabText, activeTab === 'specialized' && styles.activeTabText]}>
            ⭐ Special
          </Text>
        </TouchableOpacity>
        {currentSeason && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'season' && styles.activeTab]}
            onPress={() => setActiveTab('season')}
          >
            <Text style={[styles.tabText, activeTab === 'season' && styles.activeTabText]}>
              🎯 Season
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Specialized Type Selector - Grid Layout */}
      {activeTab === 'specialized' && (
        <View style={styles.specializedGrid}>
          <TouchableOpacity
            style={[
              styles.specializedCard,
              specializedType === 'hall_of_fame' && styles.specializedCardActive,
            ]}
            onPress={() => setSpecializedType('hall_of_fame')}
          >
            <Text style={styles.specializedIcon}>🏛️</Text>
            <Text style={styles.specializedLabel}>Hall of Fame</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.specializedCard,
              specializedType === 'star_leaders' && styles.specializedCardActive,
            ]}
            onPress={() => setSpecializedType('star_leaders')}
          >
            <Text style={styles.specializedIcon}>⭐</Text>
            <Text style={styles.specializedLabel}>Star Leaders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.specializedCard,
              specializedType === 'win_streak' && styles.specializedCardActive,
            ]}
            onPress={() => setSpecializedType('win_streak')}
          >
            <Text style={styles.specializedIcon}>🔥</Text>
            <Text style={styles.specializedLabel}>Win Streaks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.specializedCard,
              specializedType === 'most_games' && styles.specializedCardActive,
            ]}
            onPress={() => setSpecializedType('most_games')}
          >
            <Text style={styles.specializedIcon}>🎮</Text>
            <Text style={styles.specializedLabel}>Most Active</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : leaderboard.length > 0 ? (
          <View style={styles.leaderboardList}>
            {leaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>No players yet</Text>
            <Text style={styles.emptySubtext}>Be the first to climb the ranks!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    opacity: 0.9,
  },
  seasonInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.text,
  },
  specializedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    justifyContent: 'space-between',
  },
  specializedCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  specializedCardActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  specializedIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  specializedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl * 3,
    alignItems: 'center',
  },
  leaderboardList: {
    padding: SPACING.lg,
  },
  entryContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  currentUserEntry: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  topThreeEntry: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  positionContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalIcon: {
    fontSize: 32,
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  currentUsername: {
    color: COLORS.primary,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  rankIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: SPACING.xl * 3,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});
