import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RANK_TIERS } from '../../services/ranking';
import { SPACING, RADIUS, SHADOWS } from '../../utils/constants'
import { useTheme } from '../../hooks/useTheme';;

interface RankBadgeProps {
  rank: string;
  tier: string;
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
  animated?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  tier,
  rating,
  size = 'md',
  showRating = true,
  animated = true,
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const tierData = Object.values(RANK_TIERS).find(t => t.name === tier);
  const tierColor = tierData?.color || COLORS.textSecondary;
  const tierIcon = tierData?.icon || '🥉';

  useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [animated]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const sizeStyles = {
    sm: { width: 60, height: 60, iconSize: 24, fontSize: 10 },
    md: { width: 80, height: 80, iconSize: 32, fontSize: 12 },
    lg: { width: 100, height: 100, iconSize: 40, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: currentSize.width,
          height: currentSize.height,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow Effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            backgroundColor: tierColor,
          },
        ]}
      />

      {/* Badge */}
      <LinearGradient
        colors={[tierColor, tierColor + 'CC'] as any}
        style={styles.badge}
      >
        <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>
          {tierIcon}
        </Text>
        <Text style={[styles.rankText, { fontSize: currentSize.fontSize }]}>
          {rank}
        </Text>
        {showRating && (
          <Text style={[styles.ratingText, { fontSize: currentSize.fontSize - 2 }]}>
            {rating}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 999,
    opacity: 0.3,
  },
  badge: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.text,
    ...SHADOWS.lg,
  },
  icon: {
    marginBottom: SPACING.xs,
  },
  rankText: {
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
  },
  ratingText: {
    fontWeight: '600',
    color: COLORS.background,
    opacity: 0.9,
    marginTop: 2,
  },
});
