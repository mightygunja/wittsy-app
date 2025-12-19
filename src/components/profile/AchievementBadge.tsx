import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement } from '../../types';
import { COLORS } from '../../utils/constants';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  onPress 
}) => {
  const isUnlocked = achievement.unlocked;
  const progress = Math.round((achievement.progress / achievement.requirement) * 100);

  return (
    <TouchableOpacity 
      style={[styles.container, !isUnlocked && styles.locked]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, !isUnlocked && styles.lockedIcon]}>
        <Text style={styles.icon}>{achievement.icon}</Text>
      </View>
      <Text style={[styles.name, !isUnlocked && styles.lockedText]}>
        {achievement.name}
      </Text>
      {!isUnlocked && achievement.progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.requirement}
          </Text>
        </View>
      )}
      {isUnlocked && achievement.unlockedAt && (
        <Text style={styles.date}>
          {new Date(achievement.unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '30%',
    margin: '1.5%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
  },
  locked: {
    opacity: 0.5
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  lockedIcon: {
    backgroundColor: COLORS.surfaceVariant
  },
  icon: {
    fontSize: 32
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 4
  },
  lockedText: {
    color: COLORS.textSecondary
  },
  progressContainer: {
    width: '100%',
    marginTop: 4
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2
  },
  date: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4
  }
});
