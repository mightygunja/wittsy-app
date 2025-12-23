import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Animated 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { getUserMatches } from '../services/database';
import { getUserAchievements } from '../services/achievements';
import { getXPProgress, getAvailableTitles, updateUserTitle, TITLES } from '../services/progression';
import { AnimatedStatCard } from '../components/profile/AnimatedStatCard';
import { AnimatedAchievementBadge } from '../components/profile/AnimatedAchievementBadge';
import { AnimatedMatchHistoryItem } from '../components/profile/AnimatedMatchHistoryItem';
import { XPProgressBar } from '../components/profile/XPProgressBar';
import { TitleSelector } from '../components/profile/TitleSelector';
import { Achievement } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../utils/constants';

export const EnhancedProfileScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');
  const [matches, setMatches] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Initial animation
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
      const userMatches = await getUserMatches(userProfile.uid, 20);
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

  const handleSelectTitle = async (titleId: string) => {
    if (!userProfile?.uid) return;
    try {
      await updateUserTitle(userProfile.uid, titleId);
      // Refresh user profile would happen via auth context
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const winRate = userProfile.stats.gamesPlayed > 0 
    ? Math.round((userProfile.stats.gamesWon / userProfile.stats.gamesPlayed) * 100) 
    : 0;

  const avgVotes = userProfile.stats.roundsWon > 0
    ? (userProfile.stats.totalVotes / userProfile.stats.roundsWon).toFixed(1)
    : '0.0';

  const xpProgress = getXPProgress(userProfile.xp, userProfile.level);
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const availableTitles = getAvailableTitles(userProfile);
  
  const currentTitle = userProfile.selectedTitle 
    ? TITLES[userProfile.selectedTitle.toUpperCase() as keyof typeof TITLES]
    : TITLES.NEWBIE;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient Background */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{userProfile.level}</Text>
              </View>
            </View>

            {/* Username and Title */}
            <Text style={styles.username}>{userProfile.username}</Text>
            <View style={styles.titleBadge}>
              <Text style={styles.titleIcon}>{currentTitle.icon}</Text>
              <Text style={styles.titleText}>{currentTitle.name}</Text>
            </View>
            
            {/* Rank */}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{userProfile.rank}</Text>
              <Text style={styles.ratingText}>⚡ {userProfile.rating}</Text>
            </View>

            {/* XP Progress */}
            <View style={styles.xpSection}>
              <XPProgressBar
                currentXP={xpProgress.current}
                requiredXP={xpProgress.required}
                level={userProfile.level}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Title Selector */}
        <View style={styles.content}>
          <TitleSelector
            availableTitles={availableTitles}
            selectedTitle={userProfile.selectedTitle}
            onSelectTitle={handleSelectTitle}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              📊 Stats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              🏆 Achievements
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unlockedAchievements}/{achievements.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              📜 History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        <View style={styles.content}>
          {activeTab === 'stats' && (
            <View>
              <Text style={styles.sectionTitle}>Core Stats</Text>
              <View style={styles.statsGrid}>
                <AnimatedStatCard 
                  label="Games Played" 
                  value={userProfile.stats.gamesPlayed} 
                  icon="🎮"
                  color={COLORS.primary}
                  delay={0}
                />
                <AnimatedStatCard 
                  label="Games Won" 
                  value={userProfile.stats.gamesWon} 
                  icon="🏆"
                  color={COLORS.success}
                  delay={50}
                />
                <AnimatedStatCard 
                  label="Win Rate" 
                  value={`${winRate}%`} 
                  icon="📊"
                  color={winRate >= 50 ? COLORS.success : COLORS.warning}
                  delay={100}
                />
                <AnimatedStatCard 
                  label="Stars Earned" 
                  value={userProfile.stats.starsEarned} 
                  icon="⭐"
                  color={COLORS.gold}
                  delay={150}
                />
                <AnimatedStatCard 
                  label="Rounds Won" 
                  value={userProfile.stats.roundsWon} 
                  icon="🎯"
                  color={COLORS.cyan}
                  delay={200}
                />
                <AnimatedStatCard 
                  label="Total Votes" 
                  value={userProfile.stats.totalVotes} 
                  icon="👍"
                  color={COLORS.primary}
                  delay={250}
                />
                <AnimatedStatCard 
                  label="Avg Votes" 
                  value={avgVotes} 
                  icon="📈"
                  color={COLORS.cyan}
                  subtitle="Per winning round"
                  delay={300}
                />
                <AnimatedStatCard 
                  label="Rating" 
                  value={userProfile.rating} 
                  icon="⚡"
                  color={COLORS.gold}
                  delay={350}
                />
              </View>

              <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Advanced Stats</Text>
              <View style={styles.statsGrid}>
                <AnimatedStatCard 
                  label="Current Streak" 
                  value={userProfile.stats.currentStreak || 0} 
                  icon="🔥"
                  color={COLORS.warning}
                  subtitle="Consecutive wins"
                  delay={400}
                />
                <AnimatedStatCard 
                  label="Best Streak" 
                  value={userProfile.stats.bestStreak || 0} 
                  icon="💪"
                  color={COLORS.gold}
                  subtitle="All-time record"
                  delay={450}
                />
                <AnimatedStatCard 
                  label="Perfect Games" 
                  value={userProfile.stats.perfectGames || 0} 
                  icon="✨"
                  color={COLORS.success}
                  subtitle="No rounds lost"
                  delay={500}
                />
                <AnimatedStatCard 
                  label="Comeback Wins" 
                  value={userProfile.stats.comebackWins || 0} 
                  icon="👑"
                  color={COLORS.cyan}
                  subtitle="Behind by 5+"
                  delay={550}
                />
                <AnimatedStatCard 
                  label="Close Calls" 
                  value={userProfile.stats.closeCallWins || 0} 
                  icon="😅"
                  color={COLORS.warning}
                  subtitle="Won by 1-2"
                  delay={600}
                />
                <AnimatedStatCard 
                  label="Unanimous" 
                  value={userProfile.stats.unanimousVotes || 0} 
                  icon="💯"
                  color={COLORS.gold}
                  subtitle="All votes"
                  delay={650}
                />
                <AnimatedStatCard 
                  label="Longest Phrase" 
                  value={userProfile.stats.longestPhraseLength || 0} 
                  icon="📏"
                  color={COLORS.primary}
                  subtitle="Characters"
                  delay={700}
                />
                <AnimatedStatCard 
                  label="Shortest Win" 
                  value={userProfile.stats.shortestWinningPhraseLength || 0} 
                  icon="📝"
                  color={COLORS.success}
                  subtitle="Characters"
                  delay={750}
                />
              </View>
            </View>
          )}

          {activeTab === 'achievements' && (
            <View>
              <Text style={styles.sectionTitle}>
                Achievements ({unlockedAchievements} / {achievements.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Unlock achievements by playing and mastering the game!
              </Text>
              {achievementsLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
              ) : achievements.length > 0 ? (
                <View style={styles.achievementsGrid}>
                  {achievements
                    .sort((a, b) => {
                      // Sort: unlocked first, then by progress
                      if (a.unlocked && !b.unlocked) return -1;
                      if (!a.unlocked && b.unlocked) return 1;
                      return b.progress - a.progress;
                    })
                    .map((achievement, index) => (
                      <AnimatedAchievementBadge 
                        key={achievement.id}
                        achievement={achievement}
                        delay={index * 30}
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
            <View>
              <Text style={styles.sectionTitle}>Recent Matches</Text>
              <Text style={styles.sectionSubtitle}>
                Your last {matches.length} games
              </Text>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
              ) : matches.length > 0 ? (
                matches.map((match, index) => (
                  <AnimatedMatchHistoryItem
                    key={index}
                    roomName={match.roomName || 'Quick Match'}
                    result={match.won ? 'win' : 'loss'}
                    score={`${match.score || 0} rounds`}
                    stars={match.stars || 0}
                    votes={match.totalVotes || 0}
                    playedAt={match.playedAt?.toDate?.() || new Date(match.playedAt)}
                    playerCount={match.playerCount}
                    bestPhrase={match.bestPhrase}
                    delay={index * 50}
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
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  headerGradient: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.text,
    ...SHADOWS.lg,
  },
  avatarText: {
    fontSize: 48,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.gold,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    ...SHADOWS.md,
  },
  levelBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  titleIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
  },
  xpSection: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.text,
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    minWidth: 20,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  loader: {
    marginTop: SPACING.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
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
    textAlign: 'center',
  },
});
