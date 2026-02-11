import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { GamePhase } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { formatTime } from '../../utils/helpers';

interface TimerProps {
  timeRemaining: number;
  phase: GamePhase;
}

const Timer: React.FC<TimerProps> = ({ timeRemaining, phase }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const isUrgent = timeRemaining <= 5;
  const isWarning = timeRemaining <= 10;

  const getPhaseColor = () => {
    switch (phase) {
      case 'prompt':
        return COLORS.primary;
      case 'submission':
        return isUrgent ? COLORS.error : isWarning ? COLORS.warning : COLORS.cyan;
      case 'voting':
        return isUrgent ? COLORS.error : isWarning ? COLORS.warning : COLORS.primary;
      case 'waiting':
        return COLORS.textSecondary;
      case 'results':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'prompt':
        return 'GET READY';
      case 'submission':
        return 'SUBMIT';
      case 'voting':
        return 'VOTE';
      case 'waiting':
        return 'WAIT';
      case 'results':
        return 'RESULTS';
      default:
        return '';
    }
  };

  const progressPercentage = () => {
    const maxTime = {
      prompt: 3,
      submission: 25,
      voting: 10,
      waiting: 5,
      results: 8,
    }[phase] || 30;

    return (timeRemaining / maxTime) * 100;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: getPhaseColor() }]}>
        {getPhaseLabel()}
      </Text>
      
      <View style={styles.timerContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage()}%`,
                backgroundColor: getPhaseColor(),
              },
            ]}
          />
        </View>
        
        <Text
          style={[
            styles.time,
            {
              color: getPhaseColor(),
              fontSize: isUrgent ? 28 : 24,
            },
          ]}
        >
          {formatTime(timeRemaining)}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 70,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  time: {
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
  },
});

export default Timer;

