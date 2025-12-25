import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../utils/constants'
import { useTheme } from '../../hooks/useTheme';;

interface BadgeProps {
  text: string | number;
  variant?: 'primary' | 'gold' | 'success' | 'error' | 'info' | 'rank';
  size?: 'sm' | 'md' | 'lg';
  shine?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'md',
  shine = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (shine) {
      // Shine animation that sweeps across
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        ])
      ).start();
    }
  }, [shine]);

  const getGradientColors = () => {
    switch (variant) {
      case 'gold':
        return COLORS.gradientGold;
      case 'success':
        return COLORS.gradientSuccess;
      case 'error':
        return COLORS.gradientDanger;
      case 'info':
        return COLORS.gradientCyan;
      case 'rank':
        return ['#FCD34D', '#F59E0B', '#D97706'];
      default:
        return COLORS.gradientPrimary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: styles.containerSm,
          text: styles.textSm,
        };
      case 'lg':
        return {
          container: styles.containerLg,
          text: styles.textLg,
        };
      default:
        return {
          container: styles.containerMd,
          text: styles.textMd,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.container, sizeStyles.container]}
      >
        {shine && (
          <Animated.View
            style={[
              styles.shine,
              {
                transform: [
                  {
                    translateX: shineAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-100, 100],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
        
        <View style={styles.contentContainer}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, sizeStyles.text, textStyle]}>
            {text}
          </Text>
        </View>
      </LinearGradient>
      
      {/* Glow effect */}
      <View style={[styles.glow, { backgroundColor: getGradientColors()[1] }]} />
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  container: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  containerSm: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  containerMd: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  containerLg: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  text: {
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  textMd: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  textLg: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.full,
    opacity: 0.3,
    zIndex: -1,
    transform: [{ scale: 1.1 }],
  },
});
