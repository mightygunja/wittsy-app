/**
 * ScaledText Component
 * Automatically scales font sizes based on system font settings
 * Use this instead of React Native's Text component for accessibility
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { scaleFontSize } from '../../utils/responsive';

interface ScaledTextProps extends RNTextProps {
  /** Base font size - will be scaled automatically */
  fontSize?: number;
  /** Disable automatic font scaling (use sparingly) */
  disableScaling?: boolean;
}

export const ScaledText: React.FC<ScaledTextProps> = ({
  fontSize,
  disableScaling = false,
  style,
  children,
  ...props
}) => {
  // Extract fontSize from style if not provided as prop
  const styleArray = StyleSheet.flatten(style);
  const baseFontSize = fontSize || (styleArray?.fontSize as number) || 14;
  
  // Scale the font size unless disabled
  const scaledFontSize = disableScaling ? baseFontSize : scaleFontSize(baseFontSize);
  
  // Merge scaled fontSize with other styles
  const mergedStyle = [
    style,
    { fontSize: scaledFontSize },
  ];

  return (
    <RNText
      {...props}
      style={mergedStyle}
      allowFontScaling={!disableScaling}
    >
      {children}
    </RNText>
  );
};

/**
 * Usage:
 * 
 * Instead of:
 * <Text style={{ fontSize: 16 }}>Hello</Text>
 * 
 * Use:
 * <ScaledText fontSize={16}>Hello</ScaledText>
 * 
 * Or with existing styles:
 * <ScaledText style={styles.myText}>Hello</ScaledText>
 * 
 * To disable scaling (use sparingly):
 * <ScaledText fontSize={16} disableScaling>Hello</ScaledText>
 */
