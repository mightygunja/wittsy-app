/**
 * ProgressBar Component
 * Animated progress bar with customizable colors and height
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../utils/constants';

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
  backgroundColor = COLORS.border,
  progressColor = COLORS.primary,
  animated = true,
}) => {
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
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.progress,
          {
            width: widthInterpolated,
            backgroundColor: progressColor,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 100,
  },
});
