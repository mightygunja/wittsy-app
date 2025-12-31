/**
 * Guest Banner Component
 * Displays a persistent banner for guest users with account creation CTA
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';

interface GuestBannerProps {
  onUpgrade: () => void;
}

export const GuestBanner: React.FC<GuestBannerProps> = ({ onUpgrade }) => {
  const { colors: COLORS } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onUpgrade}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FFA500', '#FF8C00'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.icon}>⚠️</Text>
            <View style={styles.textContent}>
              <Text style={styles.title}>Playing as Guest</Text>
              <Text style={styles.subtitle}>Create account to save progress</Text>
            </View>
          </View>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Save →</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
