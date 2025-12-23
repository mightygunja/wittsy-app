import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';

interface XPProgressBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  animated?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  requiredXP,
  level,
  animated = true,
}) => {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Pulse glow effect
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
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
        <Text style={styles.xpText}>
          {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
        </Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View 
            style={[
              styles.barFillContainer,
              { width: widthInterpolated }
            ]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldLight, COLORS.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barFill}
            >
              <Animated.View 
                style={[
                  styles.barGlow,
                  { opacity: glowOpacity }
                ]}
              />
            </LinearGradient>
          </Animated.View>
        </View>
        
        <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
      </View>
      
      {progress >= 100 && (
        <View style={styles.levelUpBadge}>
          <Text style={styles.levelUpText}>🎉 READY TO LEVEL UP!</Text>
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
  levelBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  xpText: {
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.9,
    fontWeight: '600',
  },
  barContainer: {
    position: 'relative',
  },
  barBackground: {
    height: 12,
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
    backgroundColor: COLORS.goldGlow,
  },
  percentageText: {
    position: 'absolute',
    right: SPACING.sm,
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.background,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelUpBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.success + '30',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  levelUpText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
  },
});
