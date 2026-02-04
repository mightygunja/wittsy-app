/**
 * Referral Screen
 * Invite friends and track referral rewards
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Animated,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { referralService, REFERRAL_REWARDS } from '../services/referralService';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';

export const ReferralScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    analytics.screenView('Referral');
    loadReferralData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      const data = await referralService.getReferralData(user.uid);
      const statsData = await referralService.getReferralStats(user.uid);

      if (data) {
        setReferralCode(data.referralCode);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;

    haptics.light();
    Clipboard.setString(referralCode);
    setCopied(true);

    analytics.logEvent('referral_code_copied', {
      code: referralCode,
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode) return;

    haptics.medium();

    try {
      const message = `🎮 Join me on Wittsy - the funniest party game!\n\nUse my code: ${referralCode}\n\nYou'll get ${REFERRAL_REWARDS.INVITEE_BONUS} free coins when you sign up! 🎁`;

      await Share.share({
        message,
        title: 'Join Wittsy!',
      });

      analytics.logEvent('referral_shared', {
        code: referralCode,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const getMilestoneProgress = () => {
    if (!stats) return null;

    const milestones = [
      { count: 3, reward: REFERRAL_REWARDS.MILESTONE_3_FRIENDS, icon: '🥉' },
      { count: 5, reward: REFERRAL_REWARDS.MILESTONE_5_FRIENDS, icon: '🥈' },
      { count: 10, reward: REFERRAL_REWARDS.MILESTONE_10_FRIENDS, icon: '🥇' },
    ];

    return milestones.map((milestone) => {
      const reached = stats.totalReferrals >= milestone.count;
      const isCurrent = stats.nextMilestone?.count === milestone.count;

      return (
        <View key={milestone.count} style={styles.milestoneItem}>
          <View style={[styles.milestoneIcon, reached && styles.milestoneIconReached]}>
            <Text style={styles.milestoneIconText}>{milestone.icon}</Text>
          </View>
          <View style={styles.milestoneInfo}>
            <Text style={[styles.milestoneTitle, reached && styles.milestoneReachedText]}>
              {milestone.count} Friends
            </Text>
            <Text style={styles.milestoneReward}>
              {reached ? '✅ ' : ''}+{milestone.reward} coins
            </Text>
          </View>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>NEXT</Text>
            </View>
          )}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🎁 Invite Friends</Text>
              <Text style={styles.subtitle}>
                Earn coins by inviting your friends to play!
              </Text>
            </View>

            {/* Referral Code Card */}
            <Card variant="elevated" style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.code}>{referralCode}</Text>
                <TouchableOpacity
                  style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                  onPress={handleCopyCode}
                >
                  <Text style={styles.copyButtonText}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Button
                title="📤 Share with Friends"
                onPress={handleShare}
                variant="primary"
                size="lg"
                fullWidth
                style={styles.shareButton}
              />
            </Card>

            {/* Stats Card */}
            {stats && (
              <Card variant="glass" style={styles.statsCard}>
                <Text style={styles.statsTitle}>Your Referral Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                    <Text style={styles.statLabel}>Friends Invited</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.coinsEarned}</Text>
                    <Text style={styles.statLabel}>Coins Earned</Text>
                  </View>
                </View>

                {/* Progress to next milestone */}
                {stats.nextMilestone && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>
                        Next Milestone: {stats.nextMilestone.count} friends
                      </Text>
                      <Text style={styles.progressReward}>
                        +{stats.nextMilestone.reward} coins
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${Math.min(stats.progress, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {stats.totalReferrals} / {stats.nextMilestone.count} friends
                    </Text>
                  </View>
                )}
              </Card>
            )}

            {/* Rewards Info */}
            <Card variant="elevated" style={styles.rewardsCard}>
              <Text style={styles.rewardsTitle}>💰 How It Works</Text>

              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>👥</Text>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>Per Friend</Text>
                  <Text style={styles.rewardDescription}>
                    Get {REFERRAL_REWARDS.INVITER_PER_FRIEND} coins for each friend who joins
                  </Text>
                </View>
              </View>

              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🎁</Text>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>Welcome Bonus</Text>
                  <Text style={styles.rewardDescription}>
                    Your friend gets {REFERRAL_REWARDS.INVITEE_BONUS} coins too!
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.milestonesTitle}>🏆 Milestone Bonuses</Text>
              <View style={styles.milestonesList}>{getMilestoneProgress()}</View>
            </Card>

            {/* Instructions */}
            <Card variant="glass" style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>📋 How to Invite</Text>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>1</Text>
                  <Text style={styles.instructionText}>
                    Share your code with friends
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>2</Text>
                  <Text style={styles.instructionText}>
                    They enter it when signing up
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>3</Text>
                  <Text style={styles.instructionText}>
                    You both get coins instantly!
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  codeCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: SPACING.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6C63FF',
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  copyButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  shareButton: {
    marginTop: SPACING.sm,
  },
  statsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressSection: {
    marginTop: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: RADIUS.sm,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  rewardsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rewardIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: SPACING.md,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  milestonesList: {
    gap: SPACING.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  milestoneIconReached: {
    backgroundColor: '#4CAF50',
  },
  milestoneIconText: {
    fontSize: 20,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  milestoneReachedText: {
    color: '#FFFFFF',
  },
  milestoneReward: {
    fontSize: 14,
    color: '#FFD700',
  },
  currentBadge: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  instructionsList: {
    gap: SPACING.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: SPACING.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
