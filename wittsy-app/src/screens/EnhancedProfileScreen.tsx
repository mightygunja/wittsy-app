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
              {currentTitle && (
                <View style={styles.titleBadge}>
                  <Text style={styles.titleIcon}>{currentTitle.icon}</Text>
                  <Text style={styles.titleText}>{currentTitle.name}</Text>
                </View>
              )}
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
                <Text style={styles.statLabel}>GAMES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.ratingBadgeContainer}>
                  <Text style={[styles.statValue, { color: getRatingColor(userProfile.rating) }]}>{userProfile.rating}</Text>
                  <View style={[styles.tierBadgeCompact, { backgroundColor: getRatingColor(userProfile.rating) }]}>
                    <Text style={styles.tierTextCompact}>{getRatingTier(userProfile.rating)}</Text>
                  </View>
                </View>
                <Text style={styles.statLabel}>RATING</Text>
              </View>
            </View>

            {/* XP Progress - Professional */}
            <View style={styles.xpSection}>
              <View style={styles.xpHeader}>
                <View style={styles.xpLabelContainer}>
                  <Text style={styles.xpLabel}>Level {userProfile.level}</Text>
                  <Text style={styles.xpPercentage}>{xpProgress.percentage}%</Text>
                </View>
                <Text style={styles.xpNumbers}>{userProfile.xp.toLocaleString()} XP</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min(100, xpProgress.percentage)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.xpSubtext}>
                {xpProgress.required && !isNaN(xpProgress.required - xpProgress.current) 
                  ? `${(xpProgress.required - xpProgress.current).toLocaleString()} XP to Level ${userProfile.level + 1}`
                  : `Level ${userProfile.level} - Max Level Reached`
                }
              </Text>
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

        {/* Professional Tab Navigation */}
        <View style={styles.tabNavigationWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            <TouchableOpacity 
              style={[styles.modernTab, activeTab === 'stats' && styles.modernTabActive]}
              onPress={() => setActiveTab('stats')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Text style={styles.tabIcon}>📊</Text>
              </View>
              <Text style={[styles.modernTabText, activeTab === 'stats' && styles.modernTabTextActive]}>
                Stats
              </Text>
              {activeTab === 'stats' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernTab, activeTab === 'achievements' && styles.modernTabActive]}
              onPress={() => setActiveTab('achievements')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Text style={styles.tabIcon}>🏆</Text>
                <View style={styles.modernTabBadge}>
                  <Text style={styles.modernTabBadgeText}>{unlockedAchievements}</Text>
                </View>
              </View>
              <Text style={[styles.modernTabText, activeTab === 'achievements' && styles.modernTabTextActive]}>
                Achievements
              </Text>
              {activeTab === 'achievements' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernTab, activeTab === 'seasons' && styles.modernTabActive]}
              onPress={() => setActiveTab('seasons')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Text style={styles.tabIcon}>📅</Text>
              </View>
              <Text style={[styles.modernTabText, activeTab === 'seasons' && styles.modernTabTextActive]}>
                Seasons
              </Text>
              {activeTab === 'seasons' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernTab, activeTab === 'history' && styles.modernTabActive]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Text style={styles.tabIcon}>📜</Text>
              </View>
              <Text style={[styles.modernTabText, activeTab === 'history' && styles.modernTabTextActive]}>
                History
              </Text>
              {activeTab === 'history' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </ScrollView>
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
                      <Text style={styles.seasonName} numberOfLines={2} ellipsizeMode="tail">📅 {season.seasonName}</Text>
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
    paddingTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  profileContent: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  avatarSection: {
    marginBottom: SPACING.xl,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.95)',
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
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.gold,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    ...SHADOWS.glowGold,
  },
  levelBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    ...SHADOWS.glow,
  },
  editIcon: {
    fontSize: 14,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...SHADOWS.sm,
  },
  titleIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  titleText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  ratingBadgeContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tierBadgeCompact: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 2,
  },
  tierTextCompact: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...SHADOWS.md,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...SHADOWS.sm,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  xpLabelContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  xpLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  xpPercentage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  xpNumbers: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.gold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  xpSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  tabNavigationWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  modernTab: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    minWidth: 90,
  },
  modernTabActive: {
    // Active state handled by indicator
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  tabIcon: {
    fontSize: 24,
  },
  modernTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modernTabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  modernTabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  modernTabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
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
    fontSize: 36,
  },
  starredPhrasesTextContainer: {
    flex: 1,
  },
  starredPhrasesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starredPhrasesSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  starredPhrasesArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: SPACING.xl * 1.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2.5,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  seasonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  seasonHeader: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  seasonName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xxs,
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
