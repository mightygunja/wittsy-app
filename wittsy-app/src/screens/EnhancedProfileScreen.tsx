import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { getUserMatches } from '../services/database';
import { getUserAchievements } from '../services/achievements';
import { getXPProgress, getAvailableTitles, updateUserTitle, TITLES } from '../services/progression';
import { getUserSeasonHistory, SeasonStats } from '../services/seasonHistory';
import { AnimatedStatCard } from '../components/profile/AnimatedStatCard';
import { AnimatedAchievementBadge } from '../components/profile/AnimatedAchievementBadge';
import { AnimatedMatchHistoryItem } from '../components/profile/AnimatedMatchHistoryItem';
import { XPProgressBar } from '../components/profile/XPProgressBar';
import { TitleSelector } from '../components/profile/TitleSelector';
import { AvatarDisplay } from '../components/avatar/AvatarDisplay';
import { Achievement } from '../types';
import { AvatarConfig } from '../types/avatar';
import { avatarService } from '../services/avatarService';
import { firestore } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../utils/constants';
import { getRatingTier, getRatingColor } from '../services/eloRatingService';

export const EnhancedProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { userProfile: currentUserProfile } = useAuth();
  const { colors: COLORS } = useTheme();
  
  // Get userId from route params, default to current user
  const viewingUserId = route?.params?.userId || currentUserProfile?.uid;
  const isOwnProfile = viewingUserId === currentUserProfile?.uid;
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history' | 'seasons'>('stats');
  const [matches, setMatches] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [seasonHistory, setSeasonHistory] = useState<SeasonStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    // Load the profile for the viewing user
    loadUserProfile();
    
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
  }, [viewingUserId]);

  useEffect(() => {
    if (userProfile) {
      loadAvatar();
      loadAchievements();
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'history' && userProfile) {
      loadMatchHistory();
    } else if (activeTab === 'seasons' && userProfile) {
      loadSeasonHistory();
    }
  }, [activeTab, userProfile]);

  const loadUserProfile = async () => {
    if (!viewingUserId) return;
    
    try {
      if (isOwnProfile && currentUserProfile) {
        setUserProfile(currentUserProfile);
      } else {
        // Load other user's profile from Firestore
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(firestore, 'users', viewingUserId));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Reload avatar when screen comes into focus (e.g., after saving in Avatar Creator)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAvatar();
    });
    return unsubscribe;
  }, [navigation, userProfile]);

  const loadAvatar = async () => {
    if (!userProfile?.uid) {
      console.log('❌ No user profile, cannot load avatar');
      return;
    }
    
    console.log('🔄 Loading avatar for user:', userProfile.uid);
    try {
      const userAvatar = await avatarService.getUserAvatar(viewingUserId);
      console.log('📦 Avatar data received:', userAvatar);
      if (userAvatar && userAvatar.config) {
        console.log('✅ Setting avatar config:', userAvatar.config);
        setAvatarConfig(userAvatar.config);
      } else {
        console.log('⚠️ No avatar config found, using default');
      }
    } catch (error) {
      console.error('❌ Error loading avatar:', error);
    }
  };

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

  const loadSeasonHistory = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    try {
      const history = await getUserSeasonHistory(userProfile.uid);
      setSeasonHistory(history);
    } catch (error) {
      console.error('Error loading season history:', error);
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
    } else if (activeTab === 'seasons') {
      await loadSeasonHistory();
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

  console.log('🔥 ENHANCED PROFILE RENDERING - NEW VERSION WITH STATS ROW');
  console.log('📊 Stats:', { wins: userProfile.stats.gamesWon, winRate, rating: userProfile.rating });
  console.log('👤 Avatar config:', avatarConfig ? 'LOADED' : 'NOT LOADED');
  console.log('⭐ XP Debug:', { 
    totalXP: userProfile.xp, 
    level: userProfile.level, 
    current: xpProgress.current, 
    required: xpProgress.required,
    percentage: xpProgress.percentage 
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Content */}
        <Animated.View 
          style={[
            styles.profileContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.profileContent}>
            {/* Avatar Section - REBUILT */}
            <View style={styles.avatarSection}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('AvatarCreator')}
                activeOpacity={0.9}
              >
                <View style={styles.avatarWrapper}>
                  {/* Avatar Circle */}
                  <View style={styles.avatarCircle}>
                    {avatarConfig ? (
                      <>
                        <AvatarDisplay config={avatarConfig} size={140} />
                        {!avatarConfig.positions && (
                          <View style={styles.warningBadge}>
                            <Text style={styles.warningText}>!</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={styles.avatarEmoji}>👤</Text>
                    )}
                  </View>
                  
                  {/* Level Badge */}
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{userProfile.level}</Text>
                  </View>
                  
                  {/* Edit Badge */}
                  <View style={styles.editBadge}>
                    <Text style={styles.editIcon}>✏️</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.username}>{userProfile.username}</Text>
              <View style={styles.badgesRow}>
                <View style={styles.titleBadge}>
                  <Text style={styles.titleIcon}>{currentTitle.icon}</Text>
                  <Text style={styles.titleText}>{currentTitle.name}</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: getRatingColor(userProfile.rating) + '20', borderColor: getRatingColor(userProfile.rating) }]}>
                  <Text style={[styles.tierText, { color: getRatingColor(userProfile.rating) }]}>
                    {getRatingTier(userProfile.rating)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile.stats.gamesWon}</Text>
                <Text style={styles.statLabel}>WINS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile.stats.gamesPlayed}</Text>
                <Text style={styles.statLabel}>PLAYED</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getRatingColor(userProfile.rating) }]}>{userProfile.rating}</Text>
                <Text style={styles.statLabel}>RATING</Text>
              </View>
            </View>

            {/* XP Progress - Redesigned */}
            <View style={styles.xpSection}>
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>Experience Points</Text>
                <Text style={styles.xpNumbers}>{userProfile.xp} XP</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, xpProgress.percentage)}%` }]} />
              </View>
              <Text style={styles.xpSubtext}>
                Level {userProfile.level} • {xpProgress.percentage}% to next level
              </Text>
              <TouchableOpacity 
                style={styles.fixLevelButton}
                onPress={async () => {
                  const { getLevelFromXP } = await import('../services/progression');
                  const correctLevel = getLevelFromXP(userProfile.xp);
                  console.log(`🔧 Fixing level: Current=${userProfile.level}, Should be=${correctLevel}`);
                  if (correctLevel !== userProfile.level) {
                    await updateDoc(doc(firestore, 'users', userProfile.uid), { level: correctLevel });
                    Alert.alert('Level Fixed!', `Your level has been corrected to ${correctLevel}`);
                  } else {
                    Alert.alert('Level OK', 'Your level is already correct');
                  }
                }}
              >
                <Text style={styles.fixLevelText}>Fix My Level</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Title Selector */}
        <View style={styles.content}>
          <TitleSelector
            availableTitles={availableTitles}
            selectedTitle={userProfile.selectedTitle}
            onSelectTitle={handleSelectTitle}
          />
        </View>

        {/* Starred Phrases Quick Access */}
        <TouchableOpacity 
          style={styles.starredPhrasesButton}
          onPress={() => navigation.navigate('StarredPhrases')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.starredPhrasesGradient}
          >
            <Text style={styles.starredPhrasesIcon}>⭐</Text>
            <View style={styles.starredPhrasesTextContainer}>
              <Text style={styles.starredPhrasesTitle}>View Your Starred Phrases</Text>
              <Text style={styles.starredPhrasesSubtitle}>See all your best phrases that earned 4+ votes</Text>
            </View>
            <Text style={styles.starredPhrasesArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Modern Tab Navigation */}
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
            style={[styles.tab, activeTab === 'seasons' && styles.activeTab]}
            onPress={() => setActiveTab('seasons')}
          >
            <Text style={[styles.tabText, activeTab === 'seasons' && styles.activeTabText]}>
              📅 Seasons
            </Text>
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

          {activeTab === 'seasons' && (
            <View>
              <Text style={styles.sectionTitle}>Season History</Text>
              <Text style={styles.sectionSubtitle}>
                Your ranked performance across all seasons
              </Text>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
              ) : seasonHistory.length > 0 ? (
                seasonHistory.map((season, index) => (
                  <Animated.View
                    key={season.seasonId}
                    style={[
                      styles.seasonCard,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                      },
                    ]}
                  >
                    <View style={styles.seasonHeader}>
                      <Text style={styles.seasonName}>📅 {season.seasonName}</Text>
                      <Text style={styles.seasonNumber}>Season {season.seasonNumber}</Text>
                    </View>
                    
                    <View style={styles.seasonStatsGrid}>
                      <View style={styles.seasonStat}>
                        <Text style={styles.seasonStatValue}>{season.gamesPlayed}</Text>
                        <Text style={styles.seasonStatLabel}>Games</Text>
                      </View>
                      <View style={styles.seasonStat}>
                        <Text style={[styles.seasonStatValue, { color: COLORS.success }]}>{season.gamesWon}</Text>
                        <Text style={styles.seasonStatLabel}>Wins</Text>
                      </View>
                      <View style={styles.seasonStat}>
                        <Text style={styles.seasonStatValue}>
                          {season.gamesPlayed > 0 ? Math.round((season.gamesWon / season.gamesPlayed) * 100) : 0}%
                        </Text>
                        <Text style={styles.seasonStatLabel}>Win Rate</Text>
                      </View>
                      <View style={styles.seasonStat}>
                        <Text style={[styles.seasonStatValue, { color: COLORS.primary }]}>{season.totalVotes}</Text>
                        <Text style={styles.seasonStatLabel}>Votes</Text>
                      </View>
                    </View>

                    <View style={styles.seasonRankRow}>
                      <View style={styles.seasonRankItem}>
                        <Text style={styles.seasonRankLabel}>Best Rank</Text>
                        <Text style={styles.seasonRankValue}>#{season.bestRank}</Text>
                      </View>
                      <View style={styles.seasonRankItem}>
                        <Text style={styles.seasonRankLabel}>Final Rank</Text>
                        <Text style={styles.seasonRankValue}>#{season.finalRank}</Text>
                      </View>
                      <View style={styles.seasonRankItem}>
                        <Text style={styles.seasonRankLabel}>Final ELO</Text>
                        <Text style={[styles.seasonRankValue, { color: getRatingColor(season.finalElo) }]}>
                          {season.finalElo}
                        </Text>
                      </View>
                    </View>

                    {season.topPhrases.length > 0 && (
                      <View style={styles.topPhrasesSection}>
                        <Text style={styles.topPhrasesTitle}>⭐ Top Phrases</Text>
                        {season.topPhrases.slice(0, 3).map((phrase, i) => (
                          <Text key={i} style={styles.topPhrase}>"{phrase}"</Text>
                        ))}
                      </View>
                    )}
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📅</Text>
                  <Text style={styles.emptyText}>No season history yet</Text>
                  <Text style={styles.emptySubtext}>Play ranked games to build your season history!</Text>
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

const createStyles = (COLORS: any) => StyleSheet.create({
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
  profileContainer: {
    paddingTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  profileContent: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  avatarSection: {
    marginBottom: SPACING.md,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  debugText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 8,
    color: 'red',
    fontWeight: 'bold',
  },
  warningBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'orange',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.gold,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...SHADOWS.lg,
  },
  levelBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...SHADOWS.lg,
  },
  editIcon: {
    fontSize: 14,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  titleIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tierBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 2,
  },
  tierText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpNumbers: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  xpSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  fixLevelButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    alignSelf: 'center',
  },
  fixLevelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    position: 'relative',
    minHeight: 44,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  starredPhrasesButton: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  starredPhrasesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  starredPhrasesIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  starredPhrasesTextContainer: {
    flex: 1,
  },
  starredPhrasesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  starredPhrasesSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  starredPhrasesArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    marginLeft: SPACING.sm,
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
  seasonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  seasonName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  seasonNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  seasonStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  seasonStat: {
    alignItems: 'center',
  },
  seasonStatValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  seasonStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
    textTransform: 'uppercase',
  },
  seasonRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  seasonRankItem: {
    alignItems: 'center',
  },
  seasonRankLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxs,
  },
  seasonRankValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  topPhrasesSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  topPhrasesTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  topPhrase: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
  },
});
