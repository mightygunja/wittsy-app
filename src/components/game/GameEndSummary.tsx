/**
 * Game End Summary Component
 * Shows rewards earned, Battle Pass progress, and final scores
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../utils/constants';
import { haptics } from '../../services/haptics';
import { RatingUpdate, getRatingTier, getRatingColor } from '../../services/eloRatingService';

interface GameEndSummaryProps {
  visible: boolean;
  rewards: {
    coins: number;
    xp: number;
    battlePassXP: number;
    battlePassLevelUp?: boolean;
    newBattlePassLevel?: number;
  };
  finalScores: { userId: string; username: string; score: number }[];
  ratingChanges?: {
    winner: RatingUpdate;
    loser: RatingUpdate;
  } | null;
  multiplayerRatingChanges?: Record<string, RatingUpdate> | null;
  currentUserId?: string;
  isHost?: boolean;
  playerCount?: number;
  onContinue: () => void;
  onRestart?: () => void;
}

export const GameEndSummary: React.FC<GameEndSummaryProps> = ({
  visible,
  rewards,
  finalScores,
  ratingChanges,
  multiplayerRatingChanges,
  currentUserId,
  isHost,
  playerCount,
  onContinue,
  onRestart,
}) => {
  const { colors: COLORS } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    if (visible) {
      haptics.success();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary as any}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎉 Game Complete!</Text>
            <Text style={styles.subtitle}>Here's what you earned</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Rewards Section */}
            <View style={styles.rewardsSection}>
              <Text style={styles.sectionTitle}>Rewards Earned</Text>

              {/* Coins */}
              <View style={styles.rewardCard}>
                <View style={styles.rewardIcon}>
                  <Text style={styles.rewardEmoji}>🪙</Text>
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardLabel}>Coins</Text>
                  <Text style={styles.rewardValue}>+{rewards.coins}</Text>
                </View>
              </View>

              {/* XP */}
              <View style={styles.rewardCard}>
                <View style={styles.rewardIcon}>
                  <Text style={styles.rewardEmoji}>⭐</Text>
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardLabel}>Experience</Text>
                  <Text style={styles.rewardValue}>+{rewards.xp} XP</Text>
                </View>
              </View>

              {/* Battle Pass XP */}
              <View style={styles.rewardCard}>
                <View style={styles.rewardIcon}>
                  <Text style={styles.rewardEmoji}>🎯</Text>
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardLabel}>Battle Pass</Text>
                  <Text style={styles.rewardValue}>+{rewards.battlePassXP} XP</Text>
                </View>
              </View>
            </View>

            {/* Rating Changes - supports both 1v1 and multiplayer */}
            {currentUserId && (() => {
              // Determine the current user's rating update
              let userRating: RatingUpdate | null = null;
              
              if (ratingChanges) {
                // 1v1 game
                const isWinner = finalScores.sort((a, b) => b.score - a.score)[0]?.userId === currentUserId;
                userRating = isWinner ? ratingChanges.winner : ratingChanges.loser;
              } else if (multiplayerRatingChanges && multiplayerRatingChanges[currentUserId]) {
                // Multiplayer game
                userRating = multiplayerRatingChanges[currentUserId];
              }
              
              if (!userRating) return null;
              
              const ratingChange = userRating.ratingChange;
              const isPositive = ratingChange > 0;
              
              return (
                <View style={styles.ratingSection}>
                  <Text style={styles.sectionTitle}>Rating Update</Text>
                  <View style={styles.ratingCard}>
                    <View style={styles.ratingHeader}>
                      <Text style={styles.ratingEmoji}>
                        {isPositive ? '📈' : ratingChange === 0 ? '➡️' : '📉'}
                      </Text>
                      <View style={styles.ratingInfo}>
                        <Text style={styles.ratingLabel}>Your Rating</Text>
                        <View style={styles.ratingChange}>
                          <Text style={styles.oldRating}>{userRating.oldRating}</Text>
                          <Text style={styles.ratingArrow}>→</Text>
                          <Text style={[styles.newRating, { color: getRatingColor(userRating.newRating) }]}>
                            {userRating.newRating}
                          </Text>
                          <Text style={[styles.ratingDelta, isPositive ? styles.ratingPositive : styles.ratingNegative]}>
                            ({isPositive ? '+' : ''}{ratingChange})
                          </Text>
                        </View>
                        <Text style={[styles.ratingTier, { color: getRatingColor(userRating.newRating) }]}>
                          {getRatingTier(userRating.newRating)} Tier
                        </Text>
                        {userRating.isPlacement && (
                          <Text style={styles.placementText}>Placement Match ({userRating.gamesPlayed}/10)</Text>
                        )}
                        {userRating.marginBonus && userRating.marginBonus > 0 && (
                          <Text style={styles.bonusText}>+{userRating.marginBonus} margin bonus</Text>
                        )}
                      </View>
                    </View>
                    {userRating.winStreak >= 3 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>🔥 {userRating.winStreak} Win Streak!</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Battle Pass Level Up */}
            {rewards.battlePassLevelUp && (
              <View style={styles.levelUpSection}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.levelUpCard}
                >
                  <Text style={styles.levelUpEmoji}>🎊</Text>
                  <Text style={styles.levelUpTitle}>Battle Pass Level Up!</Text>
                  <Text style={styles.levelUpText}>
                    You reached Level {rewards.newBattlePassLevel}
                  </Text>
                  <Text style={styles.levelUpHint}>
                    Check the Battle Pass to claim your rewards!
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Final Scores */}
            <View style={styles.scoresSection}>
              <Text style={styles.sectionTitle}>Final Scores</Text>
              {finalScores
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <View key={player.userId} style={styles.scoreCard}>
                    <View style={styles.scoreRank}>
                      <Text style={styles.scoreRankText}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </Text>
                    </View>
                    <Text style={styles.scoreUsername}>{player.username}</Text>
                    <Text style={styles.scoreValue}>{player.score}</Text>
                  </View>
                ))}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Restart button for host if 3+ players */}
            {isHost && playerCount && playerCount >= 3 && onRestart && (
              <TouchableOpacity
                style={styles.restartButton}
                onPress={() => {
                  haptics.light();
                  onRestart();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>🔄 Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {/* Continue/Leave button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                haptics.light();
                onContinue();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Leave Room</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      width: '90%',
      maxWidth: 500,
      maxHeight: '85%',
      borderRadius: 24,
      overflow: 'hidden',
    },
    gradient: {
      flex: 1,
    },
    header: {
      padding: SPACING.lg,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      fontSize: 16,
      color: COLORS.textSecondary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: SPACING.lg,
    },
    rewardsSection: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: SPACING.md,
    },
    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    rewardIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
    },
    rewardEmoji: {
      fontSize: 24,
    },
    rewardInfo: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rewardLabel: {
      fontSize: 16,
      color: COLORS.text,
      fontWeight: '600',
    },
    rewardValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.primary,
    },
    levelUpSection: {
      marginBottom: SPACING.lg,
    },
    levelUpCard: {
      borderRadius: 16,
      padding: SPACING.lg,
      alignItems: 'center',
    },
    levelUpEmoji: {
      fontSize: 48,
      marginBottom: SPACING.sm,
    },
    levelUpTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: SPACING.xs,
    },
    levelUpText: {
      fontSize: 18,
      color: '#FFFFFF',
      marginBottom: SPACING.sm,
    },
    levelUpHint: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    scoresSection: {
      marginBottom: SPACING.md,
    },
    scoreCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    scoreRank: {
      width: 40,
      alignItems: 'center',
    },
    scoreRankText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    scoreUsername: {
      flex: 1,
      fontSize: 16,
      color: COLORS.text,
      fontWeight: '600',
      marginLeft: SPACING.sm,
    },
    scoreValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 20,
      marginBottom: 20,
      marginHorizontal: 20,
      gap: 12,
    },
    restartButton: {
      flex: 1,
    },
    continueButton: {
      flex: 1,
    },
    continueButtonSmall: {
      flex: 1,
    },
    buttonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    ratingSection: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: SPACING.lg,
      borderWidth: 2,
      borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    ratingCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: SPACING.lg,
      borderWidth: 2,
      borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    ratingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingEmoji: {
      fontSize: 40,
      marginRight: SPACING.md,
    },
    ratingInfo: {
      flex: 1,
    },
    ratingLabel: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginBottom: SPACING.xs,
    },
    ratingChange: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    oldRating: {
      fontSize: 20,
      color: COLORS.textSecondary,
      fontWeight: '600',
    },
    ratingArrow: {
      fontSize: 18,
      color: COLORS.textSecondary,
      marginHorizontal: SPACING.xs,
    },
    newRating: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    ratingDelta: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: SPACING.xs,
    },
    ratingPositive: {
      color: '#10B981',
    },
    ratingNegative: {
      color: '#EF4444',
    },
    ratingTier: {
      fontSize: 16,
      fontWeight: '600',
    },
    streakBadge: {
      marginTop: SPACING.md,
      backgroundColor: 'rgba(255, 107, 107, 0.2)',
      borderRadius: 12,
      padding: SPACING.sm,
      alignItems: 'center',
    },
    streakText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FF6B6B',
    },
    placementText: {
      fontSize: 12,
      color: COLORS.primary,
      fontWeight: '600',
      marginTop: SPACING.xs,
    },
    bonusText: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '600',
      marginTop: 2,
    },
  });
