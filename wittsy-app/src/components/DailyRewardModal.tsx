/**
 * Daily Reward Modal
 * Beautiful modal that appears when user can claim daily reward
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { dailyRewardsService, DAILY_REWARDS } from '../services/dailyRewardsService';
import { haptics } from '../services/haptics';
import { SPACING, RADIUS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

interface DailyRewardModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onClaimed: (coins: number, streak: number) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  visible,
  userId,
  onClose,
  onClaimed,
}) => {
  const { colors: COLORS } = useTheme();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [rewardInfo, setRewardInfo] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadRewardInfo();
      animateIn();
    } else {
      setClaimed(false);
    }
  }, [visible]);

  const loadRewardInfo = async () => {
    const status = await dailyRewardsService.canClaimToday(userId);
    setRewardInfo(status.nextReward);
    setCurrentStreak(status.currentStreak);
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleClaim = async () => {
    if (claiming || claimed) {
      console.log('⏭️ Claim blocked: claiming or already claimed');
      return;
    }

    console.log('🎁 CLAIMING daily reward...');
    haptics.medium();
    setClaiming(true);

    try {
      const result = await dailyRewardsService.claimDailyReward(userId);
      console.log('🎁 Claim result:', result);

      if (result.success && result.reward) {
        console.log(`✅ Claim SUCCESS: ${result.reward.coins} coins, streak ${result.newStreak}`);
        setClaimed(true);
        haptics.success();

        // Notify parent immediately (parent will handle closing and refreshing)
        onClaimed(result.reward.coins, result.newStreak || 0);

        // Quick coin burst animation then close
        Animated.timing(coinAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Close modal after brief animation
          setTimeout(() => {
            animateOut();
          }, 200);
        });
      } else {
        console.log('❌ Claim FAILED:', result.error);
        haptics.error();
        animateOut();
      }
    } catch (error) {
      console.error('❌ Claim ERROR:', error);
      haptics.error();
      animateOut();
    } finally {
      setClaiming(false);
    }
  };

  if (!rewardInfo) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={animateOut}>
      <BlurView intensity={80} style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#6C63FF', '#5A52D5']}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Close button */}
            {!claimed && (
              <TouchableOpacity style={styles.closeButton} onPress={animateOut}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🎁 Daily Reward</Text>
              <Text style={styles.subtitle}>
                {claimed ? 'Reward Claimed!' : 'Come back every day!'}
              </Text>
            </View>

            {/* Streak indicator */}
            <View style={styles.streakContainer}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>
                {currentStreak > 0 ? `${currentStreak} Day Streak!` : 'Start Your Streak!'}
              </Text>
            </View>

            {/* Reward display */}
            <View style={styles.rewardContainer}>
              <Animated.View
                style={[
                  styles.coinBurst,
                  {
                    opacity: coinAnim,
                    transform: [
                      {
                        scale: coinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.coinBurstText}>💰</Text>
              </Animated.View>

              <View style={styles.rewardCard}>
                <Text style={styles.dayLabel}>Day {rewardInfo.day}</Text>
                <Text style={styles.coinAmount}>{rewardInfo.coins}</Text>
                <Text style={styles.coinLabel}>Coins</Text>
                {rewardInfo.bonus && (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusText}>✨ BONUS ✨</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Week calendar */}
            <View style={styles.calendar}>
              {DAILY_REWARDS.map((reward, index) => {
                const isToday = reward.day === rewardInfo.day;
                const isPast = reward.day < rewardInfo.day && currentStreak >= reward.day;
                const isFuture = reward.day > rewardInfo.day || (reward.day < rewardInfo.day && currentStreak < 7);

                return (
                  <View
                    key={reward.day}
                    style={[
                      styles.calendarDay,
                      isToday && styles.calendarDayActive,
                      isPast && styles.calendarDayPast,
                    ]}
                  >
                    <Text style={styles.calendarDayNumber}>{reward.day}</Text>
                    <Text style={[styles.calendarDayCoins, isPast && styles.calendarDayCoinsGray]}>
                      {reward.coins}
                    </Text>
                    {isPast && <Text style={styles.calendarCheck}>✓</Text>}
                  </View>
                );
              })}
            </View>

            {/* Claim button */}
            {!claimed ? (
              <TouchableOpacity
                style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
                onPress={handleClaim}
                disabled={claiming}
              >
                <Text style={styles.claimButtonText}>
                  {claiming ? 'Claiming...' : 'Claim Reward'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.claimedContainer}>
                <Text style={styles.claimedText}>✅ Reward Claimed!</Text>
                <Text style={styles.claimedSubtext}>Come back tomorrow for more!</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rewardContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  coinBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    zIndex: 10,
  },
  coinBurstText: {
    fontSize: 80,
  },
  rewardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: SPACING.xs,
  },
  coinAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: SPACING.xs,
  },
  coinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bonusBadge: {
    marginTop: SPACING.sm,
    backgroundColor: '#FFD700',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  calendarDay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    minWidth: 40,
  },
  calendarDayActive: {
    backgroundColor: '#FFD700',
  },
  calendarDayPast: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  calendarDayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  calendarDayCoins: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  calendarDayCoinsGray: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  calendarCheck: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  claimedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  claimedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  claimedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
