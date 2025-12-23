import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
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
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: number * 50, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: number * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Vote animation
  useEffect(() => {
    if (hasVoted) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasVoted]);

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

  const handlePress = () => {
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        style={getCardStyle()}
        onPress={handlePress}
        disabled={disabled || isOwnPhrase}
        activeOpacity={0.9}
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
    </Animated.View>
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
    backgroundColor: COLORS.surface,
    borderColor: COLORS.textSecondary,
    opacity: 0.6,
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PhraseCard;
