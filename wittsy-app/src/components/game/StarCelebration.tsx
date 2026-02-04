/**
 * Star Celebration Component
 * High-level animation when a player earns a star (4+ votes on their phrase)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface StarCelebrationProps {
  visible: boolean;
  username: string;
  phrase: string;
  voteCount: number;
  onComplete?: () => void;
}

export const StarCelebration: React.FC<StarCelebrationProps> = ({
  visible,
  username,
  phrase,
  voteCount,
  onComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0)).current;
  const starAnim3 = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      starAnim1.setValue(0);
      starAnim2.setValue(0);
      starAnim3.setValue(0);
      glowAnim.setValue(0);
      shakeAnim.setValue(0);

      // Sequence of animations
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale in main star with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        // Animate surrounding stars
        Animated.parallel([
          Animated.timing(starAnim1, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(starAnim2, {
            toValue: 1,
            duration: 600,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.timing(starAnim3, {
            toValue: 1,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
          }),
          // Pulsing glow effect
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(glowAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          ),
          // Shake animation
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Hold for a moment
        Animated.delay(1500),
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const starScale1 = starAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const starTranslateY1 = starAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const starScale2 = starAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const starTranslateX2 = starAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  const starTranslateY2 = starAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const starScale3 = starAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const starTranslateX3 = starAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const starTranslateY3 = starAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.9],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 215, 0, 0.95)', 'rgba(255, 165, 0, 0.95)']}
        style={styles.gradient}
      >
        {/* Animated stars */}
        <Animated.Text
          style={[
            styles.floatingStar,
            {
              transform: [
                { scale: starScale1 },
                { translateY: starTranslateY1 },
              ],
            },
          ]}
        >
          ⭐
        </Animated.Text>

        <Animated.Text
          style={[
            styles.floatingStar,
            {
              transform: [
                { scale: starScale2 },
                { translateX: starTranslateX2 },
                { translateY: starTranslateY2 },
              ],
            },
          ]}
        >
          ⭐
        </Animated.Text>

        <Animated.Text
          style={[
            styles.floatingStar,
            {
              transform: [
                { scale: starScale3 },
                { translateX: starTranslateX3 },
                { translateY: starTranslateY3 },
              ],
            },
          ]}
        >
          ⭐
        </Animated.Text>

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Glowing star */}
          <Animated.View
            style={[
              styles.glowContainer,
              {
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              },
            ]}
          >
            <Text style={styles.mainStar}>⭐</Text>
          </Animated.View>

          <Text style={styles.title}>STAR EARNED!</Text>
          <Text style={styles.subtitle}>{voteCount} votes</Text>

          <View style={styles.phraseContainer}>
            <Text style={styles.phrase}>"{phrase}"</Text>
            <Text style={styles.author}>by {username}</Text>
          </View>

          <Text style={styles.message}>
            This phrase will be saved to your starred collection!
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingStar: {
    position: 'absolute',
    fontSize: 40,
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  glowContainer: {
    marginBottom: 16,
  },
  mainStar: {
    fontSize: 80,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
  },
  phraseContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  phrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
});
