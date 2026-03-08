/**
 * FinalResultsScreen
 * Full-screen end-of-game standings with major animations, confetti,
 * placement quips, haptics for ALL players, and a Play Again option.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../../services/haptics';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { useTheme } from '../../hooks/useTheme';

const { width: W, height: H } = Dimensions.get('window');

// ─── Placement quips ─────────────────────────────────────────────────────────

const QUIPS_1ST = [
  'Absolute domination. The rest were NPCs. 👑',
  'Not even close. Built completely different. 🚀',
  'Someone call the authorities. This was robbery. 🔥',
  'The others played for the participation trophy. You played for blood. 💀',
  'Historic. Truly, historically unfair. 🏆',
];

const QUIPS_2ND = [
  'So close… yet so painfully far. 😬',
  'First loser. A very respectable loser. 🥈',
  'You could TASTE the victory. Just couldn\'t have it. 💔',
  'The eternal silver medalist strikes again. 🤏',
  'Story of your life: second place. Own it. 😤',
];

const QUIPS_3RD = [
  'Bronze is technically a medal. Technically. 🥉',
  'Podium finish! Nobody will make a poster about it, but still. 👏',
  'You peaked at third. Own it completely. 🎯',
  'Top 3! The bottom of the top. It counts. 😅',
];

const QUIPS_LAST = [
  'Last place. But you made memories. 💀',
  'The only way is up from here. WAY up. 📈',
  'Work a LOT harder next time. Like, a lot. 🤡',
  'Participation trophy incoming. Check your mailbox. 🫠',
  'Historic. Truly historic last-place performance. 📉',
  'Even the person who didn\'t submit outvibed you. 😂',
];

const QUIPS_MIDDLE = [
  'Solidly forgettable. And that\'s okay. 😐',
  'You showed up! That\'s… something, right? 👍',
  'Perfectly mid-tier. A true average legend. 🎭',
  'Not the worst. YOUR win today. 🫡',
  'Average is a vibe. You fully lived it. 💭',
  'Respectable mediocrity. There\'s a market for it. 🤷',
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getQuip(rank: number, total: number): string {
  if (rank === 1) return pick(QUIPS_1ST);
  if (rank === 2) return pick(QUIPS_2ND);
  if (rank === 3 && total > 3) return pick(QUIPS_3RD);
  if (rank === total) return pick(QUIPS_LAST);
  return pick(QUIPS_MIDDLE);
}

function getMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

// ─── Confetti particle ────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE',
];

interface ConfettiParticleProps {
  x: number;
  color: string;
  delay: number;
  size: number;
}

const ConfettiParticle: React.FC<ConfettiParticleProps> = ({ x, color, delay, size }) => {
  const yAnim  = useRef(new Animated.Value(-size)).current;
  const opAnim = useRef(new Animated.Value(1)).current;
  const rotAnim = useRef(new Animated.Value(0)).current;
  const xWobble = useRef(new Animated.Value(x)).current;

  useEffect(() => {
    const duration = 2500 + Math.random() * 1500;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(yAnim, {
          toValue: H + size + 20,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotAnim, {
            toValue: 1,
            duration: 400 + Math.random() * 400,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
  }, []);

  const rotate = rotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: x,
        width: size,
        height: size * 0.5,
        backgroundColor: color,
        borderRadius: 2,
        opacity: opAnim,
        transform: [{ translateY: yAnim }, { rotate }],
      }}
    />
  );
};

// ─── Player card ─────────────────────────────────────────────────────────────

interface PlayerCardProps {
  rank: number;
  totalPlayers: number;
  userId: string;
  username: string;
  score: number;
  avatarConfig?: any;
  isCurrentUser: boolean;
  delay: number;
  COLORS: any;
  styles: any;
  quip: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  rank, totalPlayers, userId, username, score, avatarConfig,
  isCurrentUser, delay, COLORS, styles, quip,
}) => {
  const slideAnim = useRef(new Animated.Value(W)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const isWinner = rank === 1;
  const isLast   = rank === totalPlayers;

  const cardBg = isWinner
    ? 'rgba(255, 215, 0, 0.2)'
    : isCurrentUser
    ? 'rgba(108, 99, 255, 0.25)'
    : 'rgba(255, 255, 255, 0.07)';

  const borderColor = isWinner
    ? '#FFD700'
    : isCurrentUser
    ? '#6C63FF'
    : 'rgba(255,255,255,0.12)';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Medal + Avatar */}
      <View style={styles.cardLeft}>
        <Text style={[styles.medal, isWinner && styles.medalWinner]}>
          {getMedal(rank)}
        </Text>
        {avatarConfig ? (
          <AvatarDisplay config={avatarConfig} size={isWinner ? 52 : 40} />
        ) : (
          <View style={[styles.avatarFallback, { width: isWinner ? 52 : 40, height: isWinner ? 52 : 40 }]}>
            <Text style={styles.avatarFallbackText}>{username[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Name + quip */}
      <View style={styles.cardMid}>
        <View style={styles.nameRow}>
          <Text style={[styles.playerName, isWinner && styles.playerNameWinner]}>
            {username}
          </Text>
          {isCurrentUser && <Text style={styles.youTag}>YOU</Text>}
        </View>
        <Text style={styles.quipText} numberOfLines={2}>{quip}</Text>
      </View>

      {/* Score */}
      <View style={styles.cardRight}>
        <Text style={[styles.scoreValue, isWinner && styles.scoreValueWinner]}>
          {score}
        </Text>
        <Text style={styles.scoreLabel}>votes</Text>
      </View>
    </Animated.View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export interface FinalPlayer {
  userId: string;
  username: string;
  score: number;
  avatarConfig?: any;
}

interface FinalResultsScreenProps {
  visible: boolean;
  players: FinalPlayer[];    // already sorted by score desc
  currentUserId?: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
  playAgainLoading?: boolean;
}

export const FinalResultsScreen: React.FC<FinalResultsScreenProps> = ({
  visible,
  players,
  currentUserId,
  isHost,
  onPlayAgain,
  onLeave,
  playAgainLoading = false,
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const headerScale = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Pre-generate quips (stable across re-renders)
  const quips = useMemo(
    () => players.map((_, i) => getQuip(i + 1, players.length)),
    [players.length]
  );

  // Confetti pieces
  const confetti = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      x: Math.random() * W,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 1200,
      size: 8 + Math.random() * 8,
      key: i,
    })),
    []
  );

  useEffect(() => {
    if (!visible) return;

    // Haptics — pattern varies by placement
    const myRank = players.findIndex(p => p.userId === currentUserId) + 1;
    const total  = players.length;

    if (myRank === 1) {
      // Winner: mega burst
      haptics.success();
      setTimeout(() => haptics.success(), 150);
      setTimeout(() => haptics.success(), 300);
      setTimeout(() => haptics.heavy(), 500);
      setTimeout(() => haptics.success(), 700);
      setTimeout(() => haptics.heavy(), 900);
    } else if (myRank === 2) {
      haptics.success();
      setTimeout(() => haptics.success(), 200);
      setTimeout(() => haptics.medium(), 500);
    } else if (myRank === total) {
      // Last place: a sad thud
      setTimeout(() => haptics.error(), 300);
      setTimeout(() => haptics.error(), 700);
    } else {
      haptics.success();
      setTimeout(() => haptics.light(), 300);
    }

    // Header animation
    Animated.parallel([
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.root}>
        <LinearGradient
          colors={['#0D0D1A', '#1A0D2E', '#0D1A2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Confetti */}
        {confetti.map(c => (
          <ConfettiParticle key={c.key} x={c.x} color={c.color} delay={c.delay} size={c.size} />
        ))}

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.title}>GAME OVER</Text>
          <Text style={styles.subtitle}>Final Standings</Text>
        </Animated.View>

        {/* Player cards */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {players.map((player, index) => (
            <PlayerCard
              key={player.userId}
              rank={index + 1}
              totalPlayers={players.length}
              userId={player.userId}
              username={player.username}
              score={player.score}
              avatarConfig={player.avatarConfig}
              isCurrentUser={player.userId === currentUserId}
              delay={300 + index * 150}
              COLORS={COLORS}
              styles={styles}
              quip={quips[index]}
            />
          ))}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttons}>
          {isHost ? (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.btnPlayAgain, playAgainLoading && styles.btnDisabled]}
                onPress={onPlayAgain}
                disabled={playAgainLoading}
              >
                <Text style={styles.btnPlayAgainText}>
                  {playAgainLoading ? 'Setting up...' : 'Play Again'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnLeave]} onPress={onLeave}>
                <Text style={styles.btnLeaveText}>Leave</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnLeave, { flex: 1 }]} onPress={onLeave}>
              <Text style={styles.btnLeaveText}>Leave Game</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: any) => StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
  },
  trophyEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  medal: {
    fontSize: 22,
    minWidth: 32,
    textAlign: 'center',
  },
  medalWinner: {
    fontSize: 28,
  },
  avatarFallback: {
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardMid: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerNameWinner: {
    fontSize: 17,
    color: '#FFD700',
  },
  youTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6C63FF',
    backgroundColor: 'rgba(108,99,255,0.25)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  quipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 15,
    fontStyle: 'italic',
  },
  cardRight: {
    alignItems: 'center',
    minWidth: 44,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreValueWinner: {
    color: '#FFD700',
    fontSize: 26,
  },
  scoreLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlayAgain: {
    flex: 2,
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPlayAgainText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  btnLeave: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnLeaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
