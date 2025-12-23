import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRankProgression, RANK_TIERS } from '../../services/ranking';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

interface RankProgressBarProps {
  rating: number;
  animated?: boolean;
}

export const RankProgressBar: React.FC<RankProgressBarProps> = ({
  rating,
  animated = true,
}) => {
  const progression = getRankProgression(rating);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const currentTierData = Object.values(RANK_TIERS).find(
    t => t.name === progression.currentTier
  );
  const tierColor = currentTierData?.color || COLORS.primary;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progression.progressToNext,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      progressAnim.setValue(progression.progressToNext);
    }
  }, [progression.progressToNext, animated]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.currentRank}>
          <Text style={styles.currentRankText}>{progression.currentRank}</Text>
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        {progression.nextRank && (
          <View style={styles.nextRank}>
            <Text style={styles.nextRankLabel}>Next:</Text>
            <Text style={styles.nextRankText}>{progression.nextRank}</Text>
            <Text style={styles.ratingToNextText}>
              +{progression.ratingToNext} rating
            </Text>
          </View>
        )}
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View
            style={[
              styles.barFillContainer,
              { width: widthInterpolated },
            ]}
          >
            <LinearGradient
              colors={[tierColor, tierColor + 'CC'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barFill}
            >
              <Animated.View
                style={[
                  styles.barGlow,
                  {
                    opacity: glowOpacity,
                    backgroundColor: tierColor,
                  },
                ]}
              />
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      {progression.progressToNext >= 100 && (
        <View style={styles.rankUpBadge}>
          <Text style={styles.rankUpText}>🎉 READY TO RANK UP!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  currentRank: {
    alignItems: 'flex-start',
  },
  currentRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  nextRank: {
    alignItems: 'flex-end',
  },
  nextRankLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  nextRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  ratingToNextText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  barContainer: {
    position: 'relative',
  },
  barBackground: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  barFillContainer: {
    height: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.md,
    position: 'relative',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rankUpBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.success + '30',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  rankUpText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
  },
});
