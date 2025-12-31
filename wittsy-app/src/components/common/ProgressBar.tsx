/**
 * ProgressBar Component
 * Animated progress bar with customizable colors and height
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';;

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  backgroundColor,
  progressColor,
  animated = true,
}) => {
  const { colors: COLORS } = useTheme();
  const bgColor = backgroundColor || COLORS.border;
  const progColor = progressColor || COLORS.primary;
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { height, backgroundColor: bgColor }]}>
      <Animated.View
        style={[
          styles.progress,
          {
            width: widthInterpolated,
            backgroundColor: progColor,
            height,
          },
        ]}
      />
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 100,
  },
});



