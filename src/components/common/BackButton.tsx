/**
 * Standardized Back Button Component
 * Consistent back button across all screens
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { haptics } from '../../services/haptics';
import { useTheme } from '../../hooks/useTheme';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style, color }) => {
  const { colors: COLORS } = useTheme();
  
  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.backButtonText, { color: color || COLORS.text }]}>←</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
