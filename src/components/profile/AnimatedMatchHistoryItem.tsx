import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SPACING, RADIUS, SHADOWS } from '../../utils/constants'
import { useTheme } from '../../hooks/useTheme';;

interface AnimatedMatchHistoryItemProps {
  roomName: string;
  result: 'win' | 'loss';
  score: string;
  stars: number;
  votes: number;
  playedAt: Date;
  playerCount?: number;
  bestPhrase?: string;
  onPress?: () => void;
  delay?: number;
}

export const AnimatedMatchHistoryItem: React.FC<AnimatedMatchHistoryItemProps> = ({
  roomName,
  result,
  score,
  stars,
  votes,
  playedAt,
  playerCount,
  bestPhrase,
  onPress,
  delay = 0,
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const isWin = result === 'win';
  const [expanded, setExpanded] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity 
        style={[styles.container, isWin ? styles.win : styles.loss]} 
        onPress={() => {
          setExpanded(!expanded);
          onPress?.();
        }}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.resultIcon}>{isWin ? '🏆' : '💔'}</Text>
            <View>
              <Text style={styles.roomName}>{roomName}</Text>
              <Text style={styles.date}>{formatDate(playedAt)}</Text>
            </View>
          </View>
          <View style={[styles.resultBadge, isWin ? styles.winBadge : styles.lossBadge]}>
            <Text style={[styles.resultText, isWin ? styles.winText : styles.lossText]}>
              {result.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {/* Stats Grid */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={styles.starContainer}>
              <Text style={styles.statValue}>{stars}</Text>
              <Text style={styles.starIcon}>⭐</Text>
            </View>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{votes}</Text>
            <Text style={styles.statLabel}>Votes</Text>
          </View>
          
          {playerCount && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerCount}</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
            </>
          )}
        </View>

        {/* Expandable Section */}
        {bestPhrase && (
          <Animated.View style={[styles.expandedContent, { height: expandHeight }]}>
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseLabel}>Best Phrase:</Text>
              <Text style={styles.phraseText}>"{bestPhrase}"</Text>
            </View>
          </Animated.View>
        )}

        {/* Expand Indicator */}
        {bestPhrase && (
          <View style={styles.expandIndicator}>
            <Text style={styles.expandText}>
              {expanded ? '▲ Tap to collapse' : '▼ Tap for details'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.md,
  },
  win: {
    borderLeftColor: COLORS.success,
  },
  loss: {
    borderLeftColor: COLORS.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resultBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  winBadge: {
    backgroundColor: COLORS.success + '20',
  },
  lossBadge: {
    backgroundColor: COLORS.error + '20',
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  winText: {
    color: COLORS.success,
  },
  lossText: {
    color: COLORS.error,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  starIcon: {
    fontSize: 16,
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  expandedContent: {
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  phraseContainer: {
    backgroundColor: COLORS.backgroundElevated,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  phraseLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  phraseText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  expandIndicator: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  expandText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
