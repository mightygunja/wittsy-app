/**
 * Battle Pass Info Modal
 * Explains what Battle Pass is and how it works
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';

interface BattlePassInfoModalProps {
  visible: boolean;
  onClose: () => void;
  seasonPrice: number;
}

export const BattlePassInfoModal: React.FC<BattlePassInfoModalProps> = ({
  visible,
  onClose,
  seasonPrice,
}) => {
  const { colors: COLORS } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: COLORS.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>⭐ What is Battle Pass?</Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              {/* Main Description */}
              <Text style={[styles.description, { color: COLORS.text }]}>
                Battle Pass is a seasonal progression system that rewards you for playing games!
              </Text>

              {/* How It Works */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                  🎮 How It Works
                </Text>
                <View style={styles.stepContainer}>
                  <Text style={[styles.step, { color: COLORS.textSecondary }]}>
                    <Text style={styles.stepNumber}>1.</Text> Play games to earn XP
                  </Text>
                  <Text style={[styles.step, { color: COLORS.textSecondary }]}>
                    <Text style={styles.stepNumber}>2.</Text> Level up to unlock rewards
                  </Text>
                  <Text style={[styles.step, { color: COLORS.textSecondary }]}>
                    <Text style={styles.stepNumber}>3.</Text> Claim exclusive avatar items, coins, and more!
                  </Text>
                </View>
              </View>

              {/* Free vs Premium */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                  🆓 Free vs 👑 Premium
                </Text>
                
                <View style={[styles.tierCard, { backgroundColor: COLORS.background }]}>
                  <Text style={[styles.tierTitle, { color: COLORS.primary }]}>
                    Free Track
                  </Text>
                  <Text style={[styles.tierDesc, { color: COLORS.textSecondary }]}>
                    • Basic rewards every few levels{'\n'}
                    • Coins and common avatar items{'\n'}
                    • Available to everyone
                  </Text>
                </View>

                <View style={[styles.tierCard, styles.premiumCard]}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.premiumGradient}
                  >
                    <Text style={styles.tierTitle}>Premium Track</Text>
                    <Text style={styles.tierDesc}>
                      • Rewards at EVERY level{'\n'}
                      • Exclusive legendary avatar items{'\n'}
                      • 3x more coins{'\n'}
                      • Special effects and backgrounds{'\n'}
                      • Only ${seasonPrice}!
                    </Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Value Proposition */}
              <View style={[styles.valueBox, { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]}>
                <Text style={[styles.valueTitle, { color: COLORS.success }]}>
                  💎 Amazing Value!
                </Text>
                <Text style={[styles.valueText, { color: COLORS.text }]}>
                  Unlock 100+ rewards worth over $50 for just ${seasonPrice}!
                </Text>
              </View>

              {/* How to Earn XP */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                  ⚡ How to Earn XP
                </Text>
                <View style={styles.xpList}>
                  <Text style={[styles.xpItem, { color: COLORS.textSecondary }]}>
                    🎮 Play a game: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+10 XP</Text>
                  </Text>
                  <Text style={[styles.xpItem, { color: COLORS.textSecondary }]}>
                    🏆 Win a game: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+25 XP</Text>
                  </Text>
                  <Text style={[styles.xpItem, { color: COLORS.textSecondary }]}>
                    ⭐ Win a round: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+5 XP</Text>
                  </Text>
                  <Text style={[styles.xpItem, { color: COLORS.textSecondary }]}>
                    👍 Get votes: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+3 XP each</Text>
                  </Text>
                  <Text style={[styles.xpItem, { color: COLORS.textSecondary }]}>
                    📅 Daily challenges: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+50 XP</Text>
                  </Text>
                  <Text style={[styles.xpItem, { color: COLORS.textSecondary }]}>
                    📆 Weekly challenges: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+200 XP</Text>
                  </Text>
                </View>
              </View>

              {/* Tip */}
              <View style={[styles.tipBox, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}>
                <Text style={[styles.tipText, { color: COLORS.text }]}>
                  💡 <Text style={{ fontWeight: 'bold' }}>Pro Tip:</Text> You keep all rewards you've unlocked, even after the season ends!
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: COLORS.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Got It!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: SPACING.lg,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  stepContainer: {
    gap: SPACING.sm,
  },
  step: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  tierCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  premiumCard: {
    padding: 0,
    overflow: 'hidden',
  },
  premiumGradient: {
    padding: SPACING.md,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    color: '#FFFFFF',
  },
  tierDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  valueBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  valueText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  xpList: {
    gap: SPACING.sm,
  },
  xpItem: {
    fontSize: 15,
    lineHeight: 22,
  },
  tipBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
