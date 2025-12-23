import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Achievement } from '../../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

interface AnimatedAchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  delay?: number;
}

export const AnimatedAchievementBadge: React.FC<AnimatedAchievementBadgeProps> = ({ 
  achievement, 
  onPress,
  delay = 0
}) => {
  const isUnlocked = achievement.unlocked;
  const progress = Math.round((achievement.progress / achievement.requirement) * 100);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        delay,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation for unlocked achievements
    if (isUnlocked) {
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
    }
  }, [isUnlocked]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        style={[styles.container, !isUnlocked && styles.locked]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {isUnlocked && (
          <Animated.View 
            style={[
              styles.glow,
              {
                opacity: glowOpacity,
              }
            ]}
          />
        )}
        
        <Animated.View 
          style={[
            styles.iconContainer, 
            !isUnlocked && styles.lockedIcon,
            {
              transform: [{ rotate: isUnlocked ? rotate : '0deg' }]
            }
          ]}
        >
          <Text style={styles.icon}>{achievement.icon}</Text>
        </Animated.View>
        
        <Text style={[styles.name, !isUnlocked && styles.lockedText]}>
          {achievement.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {achievement.description}
        </Text>
        
        {!isUnlocked && achievement.progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress}/{achievement.requirement}
            </Text>
          </View>
        )}
        
        {isUnlocked && achievement.unlockedAt && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>✓ UNLOCKED</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '31%',
    margin: '1.16%',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
    position: 'relative',
    overflow: 'hidden',
  },
  locked: {
    opacity: 0.6,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.lg,
    opacity: 0.3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  lockedIcon: {
    backgroundColor: COLORS.surfaceActive,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  lockedText: {
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceActive,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  unlockedBadge: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  unlockedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});
