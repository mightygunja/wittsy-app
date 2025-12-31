/**
 * Battle Pass Screen
 * Seasonal progression and rewards
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { battlePass } from '../services/battlePassService';
import { haptics } from '../services/haptics';
import { analytics } from '../services/analytics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import { UserBattlePass, BattlePassStats, BattlePassReward } from '../types/battlePass';

const { width } = Dimensions.get('window');
const REWARD_CARD_WIDTH = 120;

export const BattlePassScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [userBP, setUserBP] = useState<UserBattlePass | null>(null);
  const [stats, setStats] = useState<BattlePassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadBattlePass();
    analytics.screenView('BattlePass');

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (stats) {
      Animated.timing(progressAnim, {
        toValue: stats.progressPercent / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [stats]);

  const loadBattlePass = async () => {
    if (!user) return;

    try {
      const bp = await battlePass.getUserBattlePass(user.uid);
      const bpStats = await battlePass.getBattlePassStats(user.uid);
      
      setUserBP(bp);
      setStats(bpStats);

      // Scroll to current level
      if (bp && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: (bp.currentLevel - 1) * (REWARD_CARD_WIDTH + SPACING.sm),
            animated: true,
          });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to load battle pass:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePremium = async () => {
    if (!user) return;

    Alert.alert(
      '🎉 Upgrade to Premium',
      `Unlock all premium rewards for $${battlePass.getCurrentSeason().price}!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            haptics.medium();
            const success = await battlePass.purchasePremium(user.uid);
            
            if (success) {
              haptics.success();
              Alert.alert('Success!', 'You now have premium access!');
              loadBattlePass();
            } else {
              haptics.error();
              Alert.alert('Failed', 'Purchase failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClaimReward = async (level: number, isPremium: boolean) => {
    if (!user || !userBP) return;

    setClaiming(level);
    haptics.light();

    try {
      // Get the reward before claiming to check if it's an avatar item
      const reward = battlePass.getCurrentSeason().rewards.find((r) => r.level === level);
      const rewardItem = isPremium && userBP.isPremium ? reward?.premium : reward?.free;
      
      const success = await battlePass.claimReward(user.uid, level, isPremium);
      
      if (success) {
        haptics.success();
        await loadBattlePass();
        await refreshUserProfile(); // Refresh coins in header
        
        // Show special message for avatar items
        if (rewardItem?.type === 'avatar') {
          Alert.alert(
            '🎨 Avatar Item Unlocked!',
            `You unlocked "${rewardItem.name}"! Visit the Avatar Creator to use it.`,
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Go to Avatar Creator', 
                onPress: () => navigation.navigate('AvatarCreator')
              }
            ]
          );
        }
      } else {
        haptics.warning();
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      haptics.error();
    } finally {
      setClaiming(null);
    }
  };

  const handleClaimAll = async () => {
    if (!user) return;

    haptics.medium();
    const claimed = await battlePass.claimAllRewards(user.uid);
    
    if (claimed > 0) {
      haptics.success();
      Alert.alert(
        'Success!', 
        `Claimed ${claimed} rewards! Check the Avatar Creator for any new items.`,
        [
          { text: 'OK' },
          { 
            text: 'Go to Avatar Creator', 
            onPress: () => navigation.navigate('AvatarCreator')
          }
        ]
      );
      loadBattlePass();
      await refreshUserProfile();
    } else {
      Alert.alert('No Rewards', 'No rewards available to claim.');
    }
  };

  const handleBuyLevels = () => {
    Alert.alert(
      '⚡ Skip Levels',
      'Purchase level skips to unlock rewards faster!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 Level - $0.99', onPress: () => purchaseLevels(1) },
        { text: '5 Levels - $3.99', onPress: () => purchaseLevels(5) },
        { text: '10 Levels - $6.99', onPress: () => purchaseLevels(10) },
        { text: '25 Levels - $14.99', onPress: () => purchaseLevels(25) },
      ]
    );
  };

  const purchaseLevels = async (levels: 1 | 5 | 10 | 25) => {
    if (!user) return;

    haptics.medium();
    const success = await battlePass.purchaseLevelSkip(user.uid, levels);
    
    if (success) {
      haptics.success();
      Alert.alert('Success!', `Skipped ${levels} levels!`);
      loadBattlePass();
    } else {
      haptics.error();
      Alert.alert('Failed', 'Purchase failed. Please try again.');
    }
  };

  const renderRewardCard = (reward: BattlePassReward) => {
    if (!userBP || !reward) return null;

    const isUnlocked = userBP.currentLevel >= reward.level;
    const isClaimed = userBP.claimedRewards?.includes(reward.level) || false;
    const isCurrent = userBP.currentLevel === reward.level;

    // Determine which reward to show (premium if user has it, otherwise free)
    const displayReward = userBP.isPremium && reward.premium ? reward.premium : reward.free;
    if (!displayReward || !displayReward.icon) return null;

    const isPremiumReward = userBP.isPremium && reward.premium;
    const canClaim = isUnlocked && !isClaimed;
    const needsUpgrade = !userBP.isPremium && reward.premium && !reward.free;

    return (
      <View key={reward.level} style={styles.rewardContainer}>
        {/* Level Number */}
        <View style={[styles.levelCircle, isCurrent && styles.levelCircleCurrent]}>
          <Text style={styles.levelNumber}>{reward.level}</Text>
        </View>

        {/* Reward Card */}
        <TouchableOpacity
          style={[
            styles.rewardCard,
            canClaim && styles.rewardCardCanClaim,
            isClaimed && styles.rewardCardClaimed,
          ]}
          onPress={() => {
            if (needsUpgrade) {
              handlePurchasePremium();
            } else if (canClaim) {
              handleClaimReward(reward.level, !!isPremiumReward);
            }
          }}
          disabled={isClaimed || (!isUnlocked && !needsUpgrade)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={isPremiumReward ? ['#FFD700', '#FFA500'] : ['#4A90E2', '#357ABD']}
            style={styles.cardGradient}
          >
            {/* Reward Icon */}
            <Text style={styles.rewardEmoji}>{displayReward.icon}</Text>

            {/* Status Badge */}
            {isClaimed && (
              <View style={styles.claimedBadge}>
                <Text style={styles.claimedText}>✓</Text>
              </View>
            )}

            {needsUpgrade && (
              <View style={styles.lockBadge}>
                <Text style={styles.lockText}>🔒</Text>
              </View>
            )}
          </LinearGradient>

          {/* Reward Info */}
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardType} numberOfLines={1}>
              {displayReward.type === 'coins' ? `${displayReward.amount} Coins` :
               displayReward.type === 'premium' ? `${displayReward.amount} Gems` :
               displayReward.type === 'avatar' ? `🎨 ${displayReward.name}` :
               displayReward.name || displayReward.type}
            </Text>
            {canClaim && (
              <Text style={styles.claimPrompt}>Tap to Claim!</Text>
            )}
            {!isUnlocked && !needsUpgrade && (
              <Text style={styles.lockedText}>Locked</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const season = battlePass.getCurrentSeason();
  const daysRemaining = battlePass.getDaysRemaining();

  if (loading || !userBP || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Battle Pass...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{season.name}</Text>
            <Text style={styles.headerSubtitle}>
              {daysRemaining} days remaining
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.infoButton} 
            onPress={() => {
              haptics.light();
              Alert.alert(
                '⚔️ Battle Pass Info',
                `Season: ${season.name}\n\n` +
                `📅 ${daysRemaining} days remaining\n\n` +
                `🎯 How to Level Up:\n` +
                `• Play games: 10 XP\n` +
                `• Win games: 25 XP\n` +
                `• Daily challenges: 50 XP\n` +
                `• Weekly challenges: 200 XP\n\n` +
                `🎁 Rewards:\n` +
                `• Free Track: 8 rewards\n` +
                `• Premium Track: 17 rewards\n` +
                `• 100 levels total\n\n` +
                `💎 Premium Benefits:\n` +
                `• Exclusive avatar items\n` +
                `• More coins & gems\n` +
                `• Special effects\n` +
                `• $30+ value for $${season.price}!`,
                [{ text: 'Got it!' }]
              );
            }}
          >
            <Text style={styles.infoIcon}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          <Card variant="glass" style={styles.statsCardInner}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentLevel}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.claimedRewards}/{stats.totalRewards}
                </Text>
                <Text style={styles.statLabel}>Claimed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userBP.isPremium ? '✓ Premium' : 'Free'}
                </Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>

            {/* Currency Display */}
            <View style={styles.currencyRow}>
              <View style={styles.currencyItem}>
                <Text style={styles.currencyIcon}>🪙</Text>
                <Text style={styles.currencyValue}>{(userProfile as any)?.currency?.coins || 0}</Text>
              </View>
              <View style={styles.currencyItem}>
                <Text style={styles.currencyIcon}>💎</Text>
                <Text style={styles.currencyValue}>{(userProfile as any)?.currency?.gems || 0}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                {userBP.currentXP} / {stats.nextLevelXP} XP
              </Text>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!userBP.isPremium && (
            <View style={styles.buttonWrapper}>
              <Button
                title={`Upgrade - $${season.price}`}
                onPress={handlePurchasePremium}
                variant="gold"
                size="md"
                icon={<Text style={styles.buttonIcon}>👑</Text>}
                fullWidth
              />
            </View>
          )}
          <View style={styles.buttonWrapper}>
            <Button
              title="Claim All"
              onPress={handleClaimAll}
              variant="primary"
              size="md"
              icon={<Text style={styles.buttonIcon}>🎁</Text>}
              fullWidth
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Buy Levels"
              onPress={handleBuyLevels}
              variant="success"
              size="md"
              icon={<Text style={styles.buttonIcon}>⚡</Text>}
              fullWidth
            />
          </View>
        </View>

        {/* Rewards Track */}
        <View style={styles.trackContainer}>
          <Text style={styles.trackTitle}>🎁 Rewards</Text>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rewardsScroll}
            contentContainerStyle={styles.rewardsScrollContent}
          >
            {season?.rewards?.map((reward) => renderRewardCard(reward)) || null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
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
  backButtonText: { fontSize: 24, color: COLORS.text },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 24 },
  statsCard: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsCardInner: {
    padding: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  buttonWrapper: {
    flex: 1,
    minWidth: '45%',
  },
  trackContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  rewardsScroll: {
    flex: 1,
  },
  rewardsScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.lg,
  },
  rewardContainer: {
    alignItems: 'center',
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelCircleCurrent: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
    transform: [{ scale: 1.1 }],
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rewardCard: {
    width: 110,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  rewardCardCanClaim: {
    borderWidth: 3,
    borderColor: COLORS.success,
  },
  rewardCardClaimed: {
    opacity: 0.7,
  },
  cardGradient: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardEmoji: {
    fontSize: 48,
  },
  claimedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  rewardInfo: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    minHeight: 50,
    justifyContent: 'center',
  },
  rewardType: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  claimPrompt: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginTop: 2,
  },
  lockedText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  buttonIcon: {
    fontSize: 18,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  currencyIcon: {
    fontSize: 20,
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
