/**
 * StarCelebration
 * Full-screen overlay shown when a player earns a starred phrase (STAR_THRESHOLD+ votes).
 * – Haptic burst: heavy → success → light × 2
 * – Spring card pop with 6 outward particle stars
 * – 3-iteration pulsing glow (loop terminates cleanly before fade-out)
 * – "View Starred Phrases →" CTA shown only to the phrase owner
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../../services/haptics';
import { screenWidth } from '../../utils/responsive';

// Particle destinations relative to card centre (symmetric fan, all upward)
const PARTICLES: { dx: number; dy: number; delay: number; emoji: string }[] = [
  { dx: -28, dy: -145, delay: 0,   emoji: '⭐' },
  { dx:  28, dy: -145, delay: 30,  emoji: '✨' },
  { dx: -105, dy: -100, delay: 60, emoji: '⭐' },
  { dx:  105, dy: -100, delay: 60, emoji: '✨' },
  { dx: -135, dy: -30,  delay: 90, emoji: '⭐' },
  { dx:  135, dy: -30,  delay: 90, emoji: '✨' },
];

interface StarCelebrationProps {
  visible: boolean;
  username: string;
  phrase: string;
  voteCount: number;
  /** True when the current device's user earned this star */
  isOwnStar?: boolean;
  onComplete?: () => void;
  /** Called when user taps "View Starred Phrases →"; only fires when isOwnStar */
  onViewStarred?: () => void;
}

export const StarCelebration: React.FC<StarCelebrationProps> = ({
  visible,
  username,
  phrase,
  voteCount,
  isOwnStar = false,
  onComplete,
  onViewStarred,
}) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  // Keep a ref to pending timers so we can clear them on unmount / re-trigger
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!visible) return;

    // --- Reset ---
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    glowAnim.setValue(0);
    particleAnims.forEach(a => a.setValue(0));
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // --- Haptics ---
    // Staggered: big impact → celebratory success → two light sparkles
    haptics.heavy();
    timersRef.current.push(setTimeout(() => haptics.success(), 160));
    timersRef.current.push(setTimeout(() => haptics.light(),   480));
    timersRef.current.push(setTimeout(() => haptics.light(),   720));

    // --- Particles: fire after card pops in (~380 ms) ---
    PARTICLES.forEach((cfg, i) => {
      const t = setTimeout(() => {
        Animated.timing(particleAnims[i], {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }).start();
      }, 380 + cfg.delay);
      timersRef.current.push(t);
    });

    // --- Main sequence ---
    Animated.sequence([
      // 1. Fade in dimmed backdrop
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      // 2. Spring-pop the card
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      // 3. Pulsing glow — exactly 3 iterations, then stops
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 580, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 580, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ),
      // 4. Hold so user can read the card
      Animated.delay(1600),
      // 5. Fade everything out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => {
      timersRef.current.forEach(clearTimeout);
      onComplete?.();
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [visible]);

  if (!visible) return null;

  // Interpolations
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });

  const handleViewStarred = () => {
    onComplete?.();
    onViewStarred?.();
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Outward-burst particle stars */}
      {PARTICLES.map((cfg, i) => {
        const pX  = particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, cfg.dx] });
        const pY  = particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, cfg.dy] });
        const pOp = particleAnims[i].interpolate({ inputRange: [0, 0.35, 0.85, 1], outputRange: [0, 1, 0.8, 0] });
        const pSc = particleAnims[i].interpolate({ inputRange: [0, 0.3, 1],         outputRange: [0, 1.3, 0.7] });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.particle,
              { transform: [{ translateX: pX }, { translateY: pY }, { scale: pSc }], opacity: pOp },
            ]}
          >
            {cfg.emoji}
          </Animated.Text>
        );
      })}

      {/* Card */}
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#FFD700', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Pulsing main star */}
          <Animated.Text
            style={[styles.mainStar, { transform: [{ scale: glowScale }], opacity: glowOpacity }]}
          >
            ⭐
          </Animated.Text>

          <Text style={styles.title}>STAR EARNED!</Text>
          <Text style={styles.voteBadge}>{voteCount} votes</Text>

          {/* Phrase card */}
          <View style={styles.phraseBox}>
            <Text style={styles.phraseText}>"{phrase}"</Text>
            <Text style={styles.authorText}>by {username}</Text>
          </View>

          {/* Footer message + optional CTA */}
          {isOwnStar ? (
            <>
              <Text style={styles.savedText}>Saved to your Starred Phrases ⭐</Text>
              {onViewStarred && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={handleViewStarred}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewButtonText}>View Starred Phrases →</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.savedText}>
              Added to {username}'s Starred Phrases
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  particle: {
    position: 'absolute',
    fontSize: 36,
    // Particles are centred at the card centre by default (absolute pos)
  },
  cardWrapper: {
    width: screenWidth * 0.88,
    maxWidth: 420,
    borderRadius: 28,
    // Elevated gold shadow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 16,
  },
  card: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
  },
  mainStar: {
    fontSize: 88,
    marginBottom: 8,
    // Soft text glow via textShadow
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  voteBadge: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 22,
  },
  phraseBox: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 18,
  },
  phraseText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  authorText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  savedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  viewButton: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8C00',
  },
});
