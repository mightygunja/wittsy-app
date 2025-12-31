/**
 * Welcome Screen
 * First screen users see - offers instant guest access or account creation
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/common/Button';
import { SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';

interface WelcomeScreenProps {
  navigation: any;
  onGuestStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation, onGuestStart }) => {
  const { colors: COLORS } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.backgroundElevated]}
        style={styles.gradient}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Title */}
        <View style={styles.logoContainer}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={[styles.title, { color: COLORS.text }]}>Wittz</Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
            Battle of Wits
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={[styles.featureText, { color: COLORS.text }]}>
              Quick 5-minute games
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={[styles.featureText, { color: COLORS.text }]}>
              Compete with friends
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏆</Text>
            <Text style={[styles.featureText, { color: COLORS.text }]}>
              Climb the leaderboard
            </Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary: Play as Guest */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={onGuestStart}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#A855F7', '#7C3AED'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playGradient}
              >
                <Text style={styles.playIcon}>🎮</Text>
                <Text style={styles.playText}>Play Now</Text>
                <Text style={styles.playSubtext}>No signup required</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary: Create Account */}
          <Button
            title="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            style={styles.createButton}
          />

          {/* Tertiary: Sign In */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.signInButton}
          >
            <Text style={[styles.signInText, { color: COLORS.primary }]}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustContainer}>
          <Text style={[styles.trustText, { color: COLORS.textSecondary }]}>
            ✓ Free to play  •  ✓ No ads  •  ✓ Save progress anytime
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: SPACING.xl * 2,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: SPACING.md,
  },
  playButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  playGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  playText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  createButton: {
    height: 56,
  },
  signInButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  trustContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
