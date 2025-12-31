import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Player } from '../../types';
import { useTheme } from '../../hooks/useTheme';;

interface ScoreBoardProps {
  players: Player[];
  scores: { [userId: string]: number };
  compact?: boolean;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, scores, compact = false }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores[a.userId] || 0;
    const scoreB = scores[b.userId] || 0;
    return scoreB - scoreA;
  });

  const getLeaderIcon = (index: number) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  if (compact) {
    return (
      <ScrollView style={styles.compactContainer}>
        <Text style={styles.compactTitle}>SCORES</Text>
        {sortedPlayers.map((player, index) => {
          const score = scores[player.userId] || 0;
          const isLeader = index === 0;
          
          return (
            <View
              key={player.userId}
              style={[
                styles.compactRow,
                isLeader && styles.leaderRow,
              ]}
            >
              <Text style={styles.compactIcon}>{getLeaderIcon(index)}</Text>
              <View style={styles.compactInfo}>
                <Text
                  style={[
                    styles.compactUsername,
                    isLeader && styles.leaderText,
                  ]}
                  numberOfLines={1}
                >
                  {player.username}
                </Text>
                <Text style={styles.compactScore}>{score}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SCOREBOARD</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.rankColumn]}>Rank</Text>
          <Text style={[styles.headerText, styles.nameColumn]}>Player</Text>
          <Text style={[styles.headerText, styles.scoreColumn]}>Score</Text>
        </View>
        
        {sortedPlayers.map((player, index) => {
          const score = scores[player.userId] || 0;
          const isLeader = index === 0;
          
          return (
            <View
              key={player.userId}
              style={[
                styles.tableRow,
                isLeader && styles.leaderRow,
              ]}
            >
              <View style={styles.rankColumn}>
                <Text style={styles.rankText}>
                  {getLeaderIcon(index) || `#${index + 1}`}
                </Text>
              </View>
              
              <View style={styles.nameColumn}>
                <Text
                  style={[
                    styles.usernameText,
                    isLeader && styles.leaderText,
                  ]}
                  numberOfLines={1}
                >
                  {player.username}
                </Text>
              </View>
              
              <View style={styles.scoreColumn}>
                <Text
                  style={[
                    styles.scoreText,
                    isLeader && styles.leaderText,
                  ]}
                >
                  {score}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leaderRow: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  rankColumn: {
    width: 50,
    alignItems: 'center',
  },
  nameColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  scoreColumn: {
    width: 60,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    color: COLORS.text,
  },
  usernameText: {
    fontSize: 16,
    color: COLORS.text,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  leaderText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  
  // Compact styles
  compactContainer: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 1,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  compactIcon: {
    fontSize: 16,
    width: 24,
    marginRight: 8,
  },
  compactInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactUsername: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  compactScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
});

export default ScoreBoard;


