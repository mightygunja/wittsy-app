/**
 * Challenges Screen
 * Display daily and weekly challenges with progress tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { Challenge } from '../types/social';
import {
  claimChallengeReward,
  getActiveChallenges,
} from '../services/challenges';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
// ProgressBar component inline
import { SPACING } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';
import { BackButton } from '../components/common/BackButton';;
import { tabletHorizontalPadding } from '../utils/responsive';

type TabType = 'daily' | 'weekly' | 'skill' | 'social';

export const ChallengesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (user?.uid) {
      loadChallenges();
    }
  }, [user]);

  const loadChallenges = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const allChallenges = await getActiveChallenges(user.uid);
      setChallenges(allChallenges);
    } catch (error: any) {
      console.error('Error loading challenges:', error?.message || error);
      Alert.alert('Error', 'Failed to load challenges. Pull down to try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
  };

  const handleClaimReward = async (challengeId: string, challengeTitle: string) => {
    if (!user?.uid) return;

    try {
      const reward = await claimChallengeReward(user.uid, challengeId);
      
      let rewardText = [];
      if (reward.xp) rewardText.push(`${reward.xp} XP`);
      if (reward.coins) rewardText.push(`${reward.coins} coins`);
      if (reward.badge) rewardText.push(`Badge: ${reward.badge}`);
      if (reward.title) rewardText.push(`Title: ${reward.title}`);
      if (reward.emote) rewardText.push(`Emote: ${reward.emote}`);

      Alert.alert(
        '🎉 Reward Claimed!',
        `You earned:\n${rewardText.join('\n')}`,
        [{ text: 'Awesome!', onPress: () => loadChallenges() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to claim reward');
    }
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const progress = challenge.progress || 0;
    const goal = challenge.requirement || 1;
    const progressPercent = Math.min((progress / goal) * 100, 100);
    // The Claim button is driven by the server-side completed flag, not raw progress
    const isCompleted = challenge.completed === true;
    const isClaimed = challenge.claimed || false;

    // Get icon based on category/type
    const getIcon = () => {
      if (challenge.category === 'skill') return '🎓';
      if (challenge.category === 'social') return '👥';
      switch (challenge.type) {
        case 'daily': return '📅';
        case 'weekly': return '📆';
        case 'seasonal': return '🏆';
        default: return '🎯';
      }
    };

    return (
      <Card key={challenge.id} variant="elevated" style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeIconContainer}>
            <Text style={styles.challengeIcon}>{getIcon()}</Text>
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {progress} / {goal}
            </Text>
            <Text style={styles.progressPercent}>{progressPercent.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={styles.rewardsLabel}>Rewards:</Text>
          <View style={styles.rewardsList}>
            {!!challenge.reward?.xp && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <Text style={styles.rewardText}>{challenge.reward.xp} XP</Text>
              </View>
            )}
            {!!challenge.reward?.coins && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🪙</Text>
                <Text style={styles.rewardText}>{challenge.reward.coins} coins</Text>
              </View>
            )}
            {!!challenge.reward?.badge && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🏅</Text>
                <Text style={styles.rewardText}>Badge</Text>
              </View>
            )}
            {!!challenge.reward?.title && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>👑</Text>
                <Text style={styles.rewardText}>{challenge.reward.title}</Text>
              </View>
            )}
            {!!challenge.reward?.emote && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>😄</Text>
                <Text style={styles.rewardText}>Emote</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Button */}
        {isCompleted && !isClaimed && (
          <Button
            title="🎁 Claim Reward"
            onPress={() => handleClaimReward(challenge.id, challenge.title)}
            variant="primary"
            style={styles.claimButton}
          />
        )}
        {isClaimed && (
          <View style={styles.claimedBadge}>
            <Text style={styles.claimedText}>✓ Claimed</Text>
          </View>
        )}
        {!isCompleted && (
          <View style={styles.inProgressBadge}>
            <Text style={styles.inProgressText}>In Progress</Text>
          </View>
        )}

        {/* Time Remaining */}
        <Text style={styles.timeRemaining}>
          ⏰ Ends: {new Date(challenge.endDate).toLocaleDateString()}
        </Text>
      </Card>
    );
  };

  // Daily/Weekly are challenge types; Skill/Social are categories that exist on
  // both daily and weekly challenges — filter accordingly so those tabs have content
  const matchesTab = (c: Challenge): boolean =>
    activeTab === 'skill' || activeTab === 'social'
      ? c.category === activeTab
      : c.type === activeTab;

  const renderStats = () => {
    const filteredChallenges = challenges.filter(matchesTab);
    const completed = filteredChallenges.filter((c: Challenge) => c.completed).length;
    const claimed = filteredChallenges.filter((c: Challenge) => c.claimed).length;
    const total = filteredChallenges.length;

    return (
      <Card variant="glass" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{claimed}</Text>
            <Text style={styles.statLabel}>Claimed</Text>
          </View>
        </View>
      </Card>
    );
  };

  const filteredChallenges = challenges.filter(matchesTab);

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
              📅 Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
              📆 Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'skill' && styles.activeTab]}
            onPress={() => setActiveTab('skill')}
          >
            <Text style={[styles.tabText, activeTab === 'skill' && styles.activeTabText]}>
              🎓 Skill
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'social' && styles.activeTab]}
            onPress={() => setActiveTab('social')}
          >
            <Text style={[styles.tabText, activeTab === 'social' && styles.activeTabText]}>
              👥 Social
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Stats */}
        {renderStats()}

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {filteredChallenges.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🎯</Text>
                <Text style={styles.emptyStateTitle}>No Challenges Available</Text>
                <Text style={styles.emptyStateText}>
                  Check back later for new challenges!
                </Text>
              </View>
            ) : (
              filteredChallenges.map(renderChallengeCard)
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  tabsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    height: 36,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  statsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingHorizontal: SPACING.md + tabletHorizontalPadding,
  },
  challengeCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  challengeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  challengeIcon: {
    fontSize: 20,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  progressSection: {
    marginBottom: SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rewardsSection: {
    marginBottom: SPACING.sm,
  },
  rewardsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  rewardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  claimButton: {
    marginBottom: 0,
  },
  claimedBadge: {
    backgroundColor: COLORS.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  claimedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inProgressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  inProgressText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  timeRemaining: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  tabsScroll: {
    marginBottom: SPACING.sm,
    maxHeight: 50,
  },
});
