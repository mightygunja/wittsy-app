/**
 * Victory Celebration Component
 * Vibrant, expressive celebration for game winners with haptics and animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../../services/haptics';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

const { height } = Dimensions.get('window');

interface VictoryCelebrationProps {
  visible: boolean;
  winners: Array<{
    userId: string;
    username: string;
    avatarConfig?: any;
    totalVotes: number;
  }>;
  onComplete: () => void;
}

const WITTY_MESSAGES = [
  (name: string) => `${name}, you absolutely DOMINATED! 🔥`,
  (name: string) => `${name} just destroyed the competition! 💪`,
  (name: string) => `BOW DOWN to ${name}! 👑`,
  (name: string) => `${name} is UNSTOPPABLE! 🚀`,
  (name: string) => `${name} brought the HEAT! 🌶️`,
  (name: string) => `${name} crushed it like a boss! 😎`,
  (name: string) => `${name} is the GOAT! 🐐`,
  (name: string) => `${name} just went NUCLEAR! ☢️`,
  (name: string) => `${name} is on FIRE! 🔥🔥🔥`,
  (name: string) => `${name} came, saw, and CONQUERED! ⚔️`,
];

const TIE_MESSAGES = [
  (names: string) => `${names} are EQUALLY LEGENDARY! 🏆`,
  (names: string) => `${names} tied for GREATNESS! 🤝`,
  (names: string) => `${names} are UNSTOPPABLE together! 💪`,
  (names: string) => `${names} shared the GLORY! ⭐`,
];

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  visible,
  winners,
  onComplete,
}) => {
  const styles = React.useMemo(() => createStyles(), []);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Intense haptic feedback sequence
      haptics.success();
      setTimeout(() => haptics.success(), 200);
      setTimeout(() => haptics.success(), 400);
      setTimeout(() => haptics.heavy(), 600);
      
      // Victory animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // Confetti animation
      Animated.loop(
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // No auto-close - user will manually close or restart
    }
  }, [visible]);

  if (!visible) return null;

  const isTie = winners.length > 1;
  const winnerNames = winners.map(w => w.username).join(' & ');
  const wittyMessage = isTie
    ? TIE_MESSAGES[Math.floor(Math.random() * TIE_MESSAGES.length)](winnerNames)
    : WITTY_MESSAGES[Math.floor(Math.random() * WITTY_MESSAGES.length)](winners[0].username);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  const confettiTranslate = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF6B6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {/* Confetti effect */}
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${(i * 5) % 100}%`,
                  transform: [
                    {
                      translateY: confettiTranslate,
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.confettiEmoji}>
                {['🎉', '🎊', '⭐', '🏆', '👑', '🔥'][i % 6]}
              </Text>
            </Animated.View>
          ))}

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              },
            ]}
          >
            {/* Trophy */}
            <Text style={styles.trophyEmoji}>🏆</Text>

            {/* Title */}
            <Text style={styles.victoryTitle}>
              {isTie ? 'EPIC TIE!' : 'VICTORY!'}
            </Text>

            {/* Winner Avatars */}
            <View style={styles.avatarsContainer}>
              {winners.map((winner) => (
                <View key={winner.userId} style={styles.winnerContainer}>
                  {winner.avatarConfig && (
                    <View style={styles.avatarGlow}>
                      <AvatarDisplay config={winner.avatarConfig} size={isTie ? 100 : 150} />
                    </View>
                  )}
                  <Text style={styles.winnerName}>{winner.username}</Text>
                  <Text style={styles.voteCount}>{winner.totalVotes} votes</Text>
                </View>
              ))}
            </View>

            {/* Witty Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.wittyMessage}>{wittyMessage}</Text>
            </View>

            {/* Close button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onComplete}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const createStyles = () =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    confetti: {
      position: 'absolute',
      top: -50,
    },
    confettiEmoji: {
      fontSize: 30,
    },
    trophyEmoji: {
      fontSize: 120,
      marginBottom: 20,
    },
    victoryTitle: {
      fontSize: 56,
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 30,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 10,
      letterSpacing: 4,
    },
    avatarsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 20,
      marginBottom: 30,
    },
    winnerContainer: {
      alignItems: 'center',
    },
    avatarGlow: {
      padding: 10,
      borderRadius: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
    winnerName: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 10,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 5,
    },
    voteCount: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 5,
    },
    messageContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    wittyMessage: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 36,
    },
    closeButton: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 40,
      paddingVertical: 16,
      borderRadius: 30,
      marginTop: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    closeButtonText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FF6B6B',
      letterSpacing: 1,
    },
  });
