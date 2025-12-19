import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.7)).current;
  
  const isDisabled = disabled || loading;

  React.useEffect(() => {
    if (!isDisabled && variant !== 'outline' && variant !== 'ghost') {
      // Subtle pulsing glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isDisabled, variant]);

  const handlePressIn = () => {
    if (!isDisabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress();
    }
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'gold':
        return COLORS.gradientGold;
      case 'success':
        return COLORS.gradientSuccess;
      case 'danger':
        return COLORS.gradientDanger;
      default:
        return COLORS.gradientPrimary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { container: styles.buttonSm, text: styles.textSm };
      case 'lg':
        return { container: styles.buttonLg, text: styles.textLg };
      case 'xl':
        return { container: styles.buttonXl, text: styles.textXl };
      default:
        return { container: styles.buttonMd, text: styles.textMd };
    }
  };

  const sizeStyles = getSizeStyles();
  const needsGradient = variant !== 'outline' && variant !== 'ghost';

  const buttonContent = (
    <>
      {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.text} 
        />
      ) : (
        <Text style={[styles.text, sizeStyles.text, styles[`${variant}Text`], textStyle]}>
          {title}
        </Text>
      )}
    </>
  );

  const containerStyle = [
    styles.button,
    sizeStyles.container,
    fullWidth && styles.fullWidth,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    isDisabled && styles.disabled,
    Platform.OS === 'web' && styles.web,
    style,
  ];

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={styles.pressable}
      >
        {needsGradient ? (
          <LinearGradient
            colors={isDisabled ? [COLORS.textDisabled, COLORS.textMuted] : getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {buttonContent}
          </LinearGradient>
        ) : (
          <Animated.View style={styles.content}>{buttonContent}</Animated.View>
        )}
      </Pressable>
      
      {/* Glow effect for gradient buttons */}
      {needsGradient && !isDisabled && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: getGradientColors()[1],
              opacity: glowAnim,
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonSm: {
    minHeight: 36,
  },
  buttonMd: {
    minHeight: 48,
  },
  buttonLg: {
    minHeight: 56,
  },
  buttonXl: {
    minHeight: 64,
  },
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  textSm: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  textMd: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  textLg: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  textXl: {
    fontSize: TYPOGRAPHY.fontSize.xl,
  },
  primaryText: {
    color: COLORS.text,
  },
  goldText: {
    color: COLORS.text,
  },
  successText: {
    color: COLORS.text,
  },
  dangerText: {
    color: COLORS.text,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.text,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.lg,
    zIndex: -1,
    transform: [{ scale: 1.05 }],
  },
  web: Platform.OS === 'web' ? ({
    cursor: 'pointer',
    userSelect: 'none',
    outlineStyle: 'none',
  } as any) : {},
});
