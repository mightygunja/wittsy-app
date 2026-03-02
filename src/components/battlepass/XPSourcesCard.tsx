/**
 * XP Sources Card
 * Shows how players can earn XP to level up Battle Pass
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';
import { XP_REWARDS } from '../../types/battlePass';

export const XPSourcesCard: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const xpSources = [
    { icon: '🎮', label: 'Play a game', xp: XP_REWARDS.GAME_PLAYED },
    { icon: '🏆', label: 'Win a game', xp: XP_REWARDS.GAME_WON },
    { icon: '⭐', label: 'Win a round', xp: XP_REWARDS.ROUND_WON },
    { icon: '👍', label: 'Get a vote', xp: XP_REWARDS.VOTE_RECEIVED },
    { icon: '📅', label: 'Daily challenge', xp: XP_REWARDS.DAILY_CHALLENGE },
    { icon: '📆', label: 'Weekly challenge', xp: XP_REWARDS.WEEKLY_CHALLENGE },
  ];

  return (
    <View style={[styles.container, { backgroundColor: COLORS.surface }]}>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>⚡ How to Earn XP</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
            Level up faster by completing these activities:
          </Text>

          <View style={styles.sourcesGrid}>
            {xpSources.map((source, index) => (
              <View
                key={index}
                style={[styles.sourceItem, { backgroundColor: COLORS.background }]}
              >
                <Text style={styles.sourceIcon}>{source.icon}</Text>
                <View style={styles.sourceInfo}>
                  <Text style={[styles.sourceLabel, { color: COLORS.text }]}>
                    {source.label}
                  </Text>
                  <Text style={[styles.sourceXP, { color: COLORS.primary }]}>
                    +{source.xp} XP
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.tipBox, { backgroundColor: COLORS.primary + '20' }]}>
            <Text style={[styles.tipText, { color: COLORS.text }]}>
              💡 <Text style={{ fontWeight: 'bold' }}>Tip:</Text> Play with friends to earn bonus XP!
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  header: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expandIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  sourcesGrid: {
    gap: SPACING.sm,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  sourceIcon: {
    fontSize: 24,
  },
  sourceInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceXP: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipBox: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
