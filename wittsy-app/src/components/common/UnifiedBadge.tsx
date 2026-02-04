import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../utils/constants';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral';

interface UnifiedBadgeProps {
  label: string | number;
  size?: BadgeSize;
  variant?: BadgeVariant;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const UnifiedBadge: React.FC<UnifiedBadgeProps> = ({
  label,
  size = 'md',
  variant = 'primary',
  rounded = false,
  style,
  textStyle,
}) => {
  const { colors: COLORS } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: COLORS.primary, text: '#FFFFFF' };
      case 'secondary':
        return { bg: COLORS.surface, text: COLORS.text };
      case 'success':
        return { bg: COLORS.success, text: '#FFFFFF' };
      case 'warning':
        return { bg: COLORS.warning, text: '#000000' };
      case 'error':
        return { bg: COLORS.error, text: '#FFFFFF' };
      case 'info':
        return { bg: COLORS.info, text: '#FFFFFF' };
      case 'gold':
        return { bg: COLORS.gold, text: '#000000' };
      case 'neutral':
        return { bg: COLORS.textTertiary, text: '#FFFFFF' };
      default:
        return { bg: COLORS.primary, text: '#FFFFFF' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          paddingHorizontal: SPACING.xs,
          paddingVertical: 2,
          fontSize: TYPOGRAPHY.fontSize.xs,
          minWidth: 16,
          height: 16,
        };
      case 'sm':
        return {
          paddingHorizontal: SPACING.sm,
          paddingVertical: 3,
          fontSize: TYPOGRAPHY.fontSize.xs,
          minWidth: 20,
          height: 20,
        };
      case 'md':
        return {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.xs,
          fontSize: TYPOGRAPHY.fontSize.sm,
          minWidth: 24,
          height: 24,
        };
      case 'lg':
        return {
          paddingHorizontal: SPACING.base,
          paddingVertical: SPACING.sm,
          fontSize: TYPOGRAPHY.fontSize.base,
          minWidth: 32,
          height: 32,
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          minWidth: sizeStyles.minWidth,
          height: sizeStyles.height,
          borderRadius: rounded ? RADIUS.full : RADIUS.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: sizeStyles.fontSize,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
