import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getLeaderboard } from '../services/database';
import { LeaderboardEntry } from '../types';
import { useTheme } from '../hooks/useTheme';;
import { formatNumber } from '../utils/helpers';
import { tabletHorizontalPadding } from '../utils/responsive';

type SortBy = 'rating' | 'wins' | 'stars';

export const LeaderboardScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortBy>('rating');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(sortBy, 100);
      setLeaderboard(data);
      
      // Find current user's rank
      if (user?.uid) {
        const userIndex = data.findIndex(entry => entry.userId === user.uid);
        setUserRank(userIndex !== -1 ? userIndex + 1 : null);
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const handleTabPress = (tab: SortBy) => {
    setSortBy(tab);
    setLoading(true);
  };

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (sortBy) {
      case 'rating':
        return entry.rating;
      case 'wins':
        return entry.wins;
      case 'stars':
        return entry.stars;
      default:
        return entry.rating;
    }
  };

  const getStatLabel = () => {
    switch (sortBy) {
      case 'rating':
        return 'Rating';
      case 'wins':
        return 'Wins';
      case 'stars':
        return 'Stars';
      default:
        return 'Rating';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* User Rank Card */}
      {userRank && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankLabel}>Your Rank</Text>
          <Text style={styles.userRankValue}>#{userRank}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, sortBy === 'rating' && styles.activeTab]}
          onPress={() => handleTabPress('rating')}
        >
          <Text style={[styles.tabText, sortBy === 'rating' && styles.activeTabText]}>
            Rating
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, sortBy === 'wins' && styles.activeTab]}
          onPress={() => handleTabPress('wins')}
        >
          <Text style={[styles.tabText, sortBy === 'wins' && styles.activeTabText]}>
            Wins
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, sortBy === 'stars' && styles.activeTab]}
          onPress={() => handleTabPress('stars')}
        >
          <Text style={[styles.tabText, sortBy === 'stars' && styles.activeTabText]}>
            Stars
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd Place */}
            <View style={styles.podiumPlace}>
              <View style={[styles.podiumAvatar, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.podiumAvatarText}>
                  {leaderboard[1].username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumUsername} numberOfLines={1}>
                {leaderboard[1].username}
              </Text>
              <View style={styles.podiumRank}>
                <Text style={styles.podiumRankText}>2</Text>
              </View>
              <Text style={styles.podiumStat}>
                {formatNumber(getStatValue(leaderboard[1]))}
              </Text>
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumPlace, styles.firstPlace]}>
              <Text style={styles.crownIcon}>👑</Text>
              <View style={[styles.podiumAvatar, styles.firstPlaceAvatar]}>
                <Text style={styles.podiumAvatarText}>
                  {leaderboard[0].username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumUsername} numberOfLines={1}>
                {leaderboard[0].username}
              </Text>
              <View style={[styles.podiumRank, styles.firstPlaceRank]}>
                <Text style={styles.podiumRankText}>1</Text>
              </View>
              <Text style={styles.podiumStat}>
                {formatNumber(getStatValue(leaderboard[0]))}
              </Text>
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumPlace}>
              <View style={[styles.podiumAvatar, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.podiumAvatarText}>
                  {leaderboard[2].username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumUsername} numberOfLines={1}>
                {leaderboard[2].username}
              </Text>
              <View style={styles.podiumRank}>
                <Text style={styles.podiumRankText}>3</Text>
              </View>
              <Text style={styles.podiumStat}>
                {formatNumber(getStatValue(leaderboard[2]))}
              </Text>
            </View>
          </View>
        )}

        {/* Rest of Leaderboard */}
        <View style={styles.list}>
          <View style={styles.listHeader}>
            <Text style={[styles.headerText, styles.rankColumn]}>Rank</Text>
            <Text style={[styles.headerText, styles.playerColumn]}>Player</Text>
            <Text style={[styles.headerText, styles.statColumn]}>{getStatLabel()}</Text>
          </View>

          {leaderboard.slice(3).map((entry, index) => {
            const position = index + 4;
            const isCurrentUser = entry.userId === user?.uid;

            return (
              <View
                key={entry.userId}
                style={[
                  styles.listItem,
                  isCurrentUser && styles.currentUserItem,
                ]}
              >
                <View style={styles.rankColumn}>
                  <Text style={styles.rankText}>#{position}</Text>
                </View>

                <View style={styles.playerColumn}>
                  <View style={[
                    styles.avatar,
                    { backgroundColor: entry.avatar?.background || COLORS.primary }
                  ]}>
                    <Text style={styles.avatarText}>
                      {entry.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text
                      style={[
                        styles.username,
                        isCurrentUser && styles.currentUserText,
                      ]}
                      numberOfLines={1}
                    >
                      {entry.username}
                    </Text>
                    <Text style={styles.rankBadge}>{entry.rank}</Text>
                  </View>
                </View>

                <View style={styles.statColumn}>
                  <Text style={[
                    styles.statValue,
                    isCurrentUser && styles.currentUserText,
                  ]}>
                    {formatNumber(getStatValue(entry))}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {leaderboard.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No leaderboard data yet</Text>
            <Text style={styles.emptySubtext}>Play some games to appear here!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  userRankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  userRankLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  userRankValue: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16 + tabletHorizontalPadding,
    paddingVertical: 32,
    gap: 12,
  },
  podiumPlace: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: {
    marginBottom: 20,
  },
  crownIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  firstPlaceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gold,
  },
  podiumAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  podiumUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  firstPlaceRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
  },
  podiumRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  podiumStat: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: 16 + tabletHorizontalPadding,
    paddingBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentUserItem: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  rankColumn: {
    width: 60,
    alignItems: 'center',
  },
  playerColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumn: {
    width: 80,
    alignItems: 'flex-end',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  rankBadge: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  currentUserText: {
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

