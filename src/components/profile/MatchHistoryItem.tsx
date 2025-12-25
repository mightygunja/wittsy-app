import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';;

interface MatchHistoryItemProps {
  roomName: string;
  result: 'win' | 'loss';
  score: string;
  stars: number;
  votes: number;
  playedAt: Date;
  onPress?: () => void;
}

export const MatchHistoryItem: React.FC<MatchHistoryItemProps> = ({
  roomName,
  result,
  score,
  stars,
  votes,
  playedAt,
  onPress
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const isWin = result === 'win';

  return (
    <TouchableOpacity 
      style={[styles.container, isWin ? styles.win : styles.loss]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.roomName}>{roomName}</Text>
        <Text style={[styles.result, isWin ? styles.winText : styles.lossText]}>
          {result.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{score}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stars} ⭐</Text>
          <Text style={styles.statLabel}>Stars</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{votes}</Text>
          <Text style={styles.statLabel}>Total Votes</Text>
        </View>
      </View>
      
      <Text style={styles.date}>
        {playedAt.toLocaleDateString()} {playedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1
  },
  win: {
    borderLeftColor: COLORS.success
  },
  loss: {
    borderLeftColor: COLORS.error
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1
  },
  result: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  winText: {
    color: COLORS.success,
    backgroundColor: COLORS.success + '20'
  },
  lossText: {
    color: COLORS.error,
    backgroundColor: COLORS.error + '20'
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right'
  }
});


