/**
 * Account Upgrade Modal
 * Prompts guest users to create a permanent account at strategic moments
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { validateEmail, validatePassword, validateUsername } from '../../utils/validation';
import { linkGuestToAccount } from '../../services/guestAuth';
import { SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';

interface AccountUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  progress: {
    gamesPlayed: number;
    level: number;
    achievements: number;
    stars: number;
  };
  reason: string;
}

export const AccountUpgradeModal: React.FC<AccountUpgradeModalProps> = ({
  visible,
  onClose,
  onSuccess,
  progress,
  reason,
}) => {
  const { colors: COLORS } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const getReasonMessage = () => {
    switch (reason) {
      case 'first_win':
        return '🎉 Congratulations on your first win!';
      case 'level_milestone':
        return `🎊 You've reached Level ${progress.level}!`;
      case 'achievements':
        return `🏆 ${progress.achievements} achievements unlocked!`;
      case 'stars':
        return `⭐ You've earned ${progress.stars} stars!`;
      case 'games_played':
        return `🎮 ${progress.gamesPlayed} games played!`;
      default:
        return '🎮 You\'re doing great!';
    }
  };

  const handleCreateAccount = async () => {
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (usernameError || emailError || passwordError) {
      setErrors({
        username: usernameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await linkGuestToAccount(email, password, username);
      Alert.alert(
        '✅ Account Created!',
        'Your progress has been saved. Welcome to Wittz!',
        [{ text: 'Awesome!', onPress: onSuccess }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.modalContainer, { backgroundColor: COLORS.surface }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <LinearGradient
              colors={['#A855F7', '#7C3AED'] as any}
              style={styles.header}
            >
              <Text style={styles.headerEmoji}>💾</Text>
              <Text style={styles.headerTitle}>Save Your Progress!</Text>
              <Text style={styles.headerSubtitle}>{getReasonMessage()}</Text>
            </LinearGradient>

            {/* Progress Summary */}
            <View style={styles.progressContainer}>
              <Text style={[styles.progressTitle, { color: COLORS.text }]}>
                Your Progress So Far:
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{progress.gamesPlayed}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Games</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{progress.level}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Level</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{progress.achievements}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Achievements</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{progress.stars}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Stars</Text>
                </View>
              </View>
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={[styles.warningText, { color: COLORS.text }]}>
                Without an account, you'll lose all your progress if you uninstall the app!
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: COLORS.text }]}>
                Create Your Account (30 seconds)
              </Text>

              <Input
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                autoCapitalize="none"
                error={errors.username}
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password (min 6 characters)"
                secureTextEntry
                error={errors.password}
              />

              <Button
                title="Save My Progress"
                onPress={handleCreateAccount}
                loading={loading}
                style={styles.createButton}
              />

              <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                <Text style={[styles.skipText, { color: COLORS.textSecondary }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    ...SHADOWS.xl,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressContainer: {
    padding: SPACING.lg,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING.sm,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A855F7',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500' + '20',
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  formContainer: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  createButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  skipButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
