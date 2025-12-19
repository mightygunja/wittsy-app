import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getUserMatches } from '../services/database';
import { getUserAchievements } from '../services/achievements';
import { StatCard } from '../components/profile/StatCard';
import { AchievementBadge } from '../components/profile/AchievementBadge';
import { MatchHistoryItem } from '../components/profile/MatchHistoryItem';
import { Achievement } from '../types';
import { COLORS } from '../utils/constants';

export const ProfileScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');
  const [matches, setMatches] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadAchievements();
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'history' && userProfile) {
      loadMatchHistory();
    }
  }, [activeTab, userProfile]);

  const loadAchievements = async () => {
    if (!userProfile?.uid) return;
    
    setAchievementsLoading(true);
    try {
      const userAchievements = await getUserAchievements(userProfile.uid);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const loadMatchHistory = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    try {
      const userMatches = await getUserMatches(userProfile.uid, 10);
      setMatches(userMatches);
    } catch (error) {
      console.error('Error loading match history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'achievements') {
      await loadAchievements();
    } else if (activeTab === 'history') {
      await loadMatchHistory();
    }
    setRefreshing(false);
  };

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const winRate = userProfile.stats.gamesPlayed > 0 
    ? Math.round((userProfile.stats.gamesWon / userProfile.stats.gamesPlayed) * 100) 
    : 0;

  const avgVotes = userProfile.stats.roundsWon > 0
    ? (userProfile.stats.totalVotes / userProfile.stats.roundsWon).toFixed(1)
    : '0.0';

  const xpForNextLevel = (userProfile.level + 1) <= 10 
    ? 100 
    : (userProfile.level + 1) <= 25 
      ? 250 
      : (userProfile.level + 1) <= 50 
        ? 500 
        : 1000;

  const xpProgress = Math.round((userProfile.xp % xpForNextLevel) / xpForNextLevel * 100);

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Avatar and Basic Info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.username}>{userProfile.username}</Text>
        <Text style={styles.rank}>{userProfile.rank}</Text>
        
        {/* XP Progress Bar */}
        <View style={styles.xpContainer}>
          <View style={styles.xpHeader}>
            <Text style={styles.level}>Level {userProfile.level}</Text>
            <Text style={styles.xpText}>{userProfile.xp % xpForNextLevel} / {xpForNextLevel} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            Achievements ({unlockedAchievements}/{achievements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'stats' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Core Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              label="Games Played" 
              value={userProfile.stats.gamesPlayed} 
              icon="🎮"
              color={COLORS.primary}
            />
            <StatCard 
              label="Games Won" 
              value={userProfile.stats.gamesWon} 
              icon="🏆"
              color={COLORS.success}
            />
            <StatCard 
              label="Win Rate" 
              value={`${winRate}%`} 
              icon="📊"
              color={winRate >= 50 ? COLORS.success : COLORS.warning}
            />
            <StatCard 
              label="Stars Earned" 
              value={userProfile.stats.starsEarned} 
              icon="⭐"
              color={COLORS.gold}
            />
            <StatCard 
              label="Rounds Won" 
              value={userProfile.stats.roundsWon} 
              icon="🎯"
              color={COLORS.secondary}
            />
            <StatCard 
              label="Total Votes" 
              value={userProfile.stats.totalVotes} 
              icon="👍"
              color={COLORS.primary}
            />
            <StatCard 
              label="Avg Votes/Round" 
              value={avgVotes} 
              icon="📈"
              color={COLORS.primary}
              subtitle="Per winning round"
            />
            <StatCard 
              label="Rating" 
              value={userProfile.rating} 
              icon="⚡"
              color={COLORS.primary}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Advanced Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              label="Current Streak" 
              value={userProfile.stats.currentStreak || 0} 
              icon="🔥"
              color={COLORS.warning}
              subtitle="Consecutive wins"
            />
            <StatCard 
              label="Best Streak" 
              value={userProfile.stats.bestStreak || 0} 
              icon="💪"
              color={COLORS.gold}
              subtitle="All-time record"
            />
            <StatCard 
              label="Perfect Games" 
              value={userProfile.stats.perfectGames || 0} 
              icon="✨"
              color={COLORS.success}
              subtitle="No rounds lost"
            />
            <StatCard 
              label="Comeback Wins" 
              value={userProfile.stats.comebackWins || 0} 
              icon="👑"
              color={COLORS.secondary}
              subtitle="Behind by 5+"
            />
            <StatCard 
              label="Close Calls" 
              value={userProfile.stats.closeCallWins || 0} 
              icon="😅"
              color={COLORS.warning}
              subtitle="Won by 1-2"
            />
            <StatCard 
              label="Unanimous Votes" 
              value={userProfile.stats.unanimousVotes || 0} 
              icon="💯"
              color={COLORS.gold}
              subtitle="All players voted"
            />
            <StatCard 
              label="Longest Phrase" 
              value={userProfile.stats.longestPhraseLength || 0} 
              icon="📏"
              color={COLORS.primary}
              subtitle="Characters"
            />
            <StatCard 
              label="Shortest Win" 
              value={userProfile.stats.shortestWinningPhraseLength || 0} 
              icon="📝"
              color={COLORS.success}
              subtitle="Characters"
            />
          </View>
        </View>
      )}

      {activeTab === 'achievements' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            Achievements ({unlockedAchievements} / {achievements.length})
          </Text>
          {achievementsLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : achievements.length > 0 ? (
            <View style={styles.achievementsGrid}>
              {achievements.map(achievement => (
                <AchievementBadge 
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>No achievements yet</Text>
              <Text style={styles.emptySubtext}>Start playing to unlock achievements!</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'history' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : matches.length > 0 ? (
            matches.map((match, index) => (
              <MatchHistoryItem
                key={index}
                roomName={match.roomName || 'Quick Match'}
                result={match.won ? 'win' : 'loss'}
                score={`${match.score || 0} rounds`}
                stars={match.stars || 0}
                votes={match.totalVotes || 0}
                playedAt={match.playedAt?.toDate?.() || new Date(match.playedAt)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎮</Text>
              <Text style={styles.emptyText}>No match history yet</Text>
              <Text style={styles.emptySubtext}>Play your first game to see your history!</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.primary
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  avatarText: {
    fontSize: 48
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4
  },
  rank: {
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 16
  },
  xpContainer: {
    width: '100%',
    marginTop: 8
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  level: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white
  },
  xpText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: COLORS.primary
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  activeTabText: {
    color: COLORS.primary
  },
  content: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start'
  },
  loader: {
    marginTop: 40
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center'
  }
});
