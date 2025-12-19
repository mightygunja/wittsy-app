import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../../utils/constants';

interface PhraseCardProps {
  number: number;
  phrase: string;
  onPress: () => void;
  disabled?: boolean;
  isOwnPhrase?: boolean;
  hasVoted?: boolean;
}

const PhraseCard: React.FC<PhraseCardProps> = ({
  number,
  phrase,
  onPress,
  disabled = false,
  isOwnPhrase = false,
  hasVoted = false,
}) => {
  const getCardStyle = () => {
    if (isOwnPhrase) {
      return [styles.card, styles.ownPhraseCard];
    }
    if (hasVoted) {
      return [styles.card, styles.votedCard];
    }
    if (disabled) {
      return [styles.card, styles.disabledCard];
    }
    return styles.card;
  };

  return (
    <TouchableOpacity
      style={getCardStyle()}
      onPress={onPress}
      disabled={disabled || isOwnPhrase}
      activeOpacity={0.7}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.number}>{number}</Text>
      </View>
      
      <Text style={[
        styles.phrase,
        (disabled || isOwnPhrase) && styles.disabledText,
      ]}>
        "{phrase}"
      </Text>
      
      {isOwnPhrase && (
        <Text style={styles.ownPhraseLabel}>Your phrase</Text>
      )}
      
      {hasVoted && (
        <View style={styles.votedBadge}>
          <Text style={styles.votedText}>✓ Voted</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  ownPhraseCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  votedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  disabledCard: {
    opacity: 0.6,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  number: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  phrase: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  ownPhraseLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  votedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  votedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PhraseCard;
