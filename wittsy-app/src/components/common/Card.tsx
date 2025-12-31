import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS, SHADOWS } from '../../utils/constants'
import { useTheme } from '../../hooks/useTheme';;

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glow' | 'gold' | 'glass';
  style?: ViewStyle;
  onPress?: () => void;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
  animated = true,
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && variant === 'glow') {
      // Pulsing glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [animated, variant]);

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const getCardStyle = () => {
    const baseStyle = [styles.card, style];
    
    switch (variant) {
      case 'elevated':
        return [...baseStyle, styles.elevated, SHADOWS.lg];
      case 'glow':
        return [...baseStyle, styles.glow, SHADOWS.glow];
      case 'gold':
        return [...baseStyle, styles.gold, SHADOWS.glowGold];
      case 'glass':
        return [...baseStyle, styles.glass];
      default:
        return [...baseStyle, styles.default, SHADOWS.md];
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        getCardStyle(),
        { transform: [{ scale: scaleAnim }] },
        onPress && Platform.OS === 'web' && styles.pressable,
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onResponderRelease={onPress}
      onStartShouldSetResponder={() => !!onPress}
    >
      {variant === 'gold' && (
        <LinearGradient
          colors={COLORS.gradientGold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
      )}
      
      {variant === 'glow' && (
        <Animated.View 
          style={[
            styles.glowBorder,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]} 
        />
      )}
      
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  return cardContent;
};

const createStyles = (COLORS: any) => StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  glow: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  gold: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  glass: {
    backgroundColor: COLORS.surfaceGlass,
    borderWidth: 1,
    borderColor: COLORS.surfaceGlassBorder,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primaryGlow,
  },
  content: {
    padding: SPACING.base,
  },
  pressable: {
    cursor: 'pointer',
    userSelect: 'none',
  } as any,
});
