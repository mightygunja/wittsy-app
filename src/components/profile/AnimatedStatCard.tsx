import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
  delay?: number;
}

export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({ 
  label, 
  value, 
  icon, 
  color = COLORS.primary,
  subtitle,
  delay = 0
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      {icon && (
        <Animated.Text 
          style={[
            styles.icon,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {icon}
        </Animated.Text>
      )}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    margin: '1%',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  icon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  }
});
