/**
 * Rejoin Room Prompt Component
 * Shows when user returns to app and can rejoin their last room
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING } from '../../utils/constants';
import * as haptics from '../../utils/haptics';

interface RejoinRoomPromptProps {
  visible: boolean;
  roomName: string;
  onRejoin: () => void;
  onDismiss: () => void;
}

export const RejoinRoomPrompt: React.FC<RejoinRoomPromptProps> = ({
  visible,
  roomName,
  onRejoin,
  onDismiss,
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleRejoin = () => {
    haptics.success();
    onRejoin();
  };

  const handleDismiss = () => {
    haptics.light();
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.surface, COLORS.background]}
            style={styles.card}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🚪</Text>
            </View>

            {/* Content */}
            <Text style={styles.title}>Rejoin Game?</Text>
            <Text style={styles.description}>
              You were in <Text style={styles.roomName}>"{roomName}"</Text>
            </Text>
            <Text style={styles.subtitle}>
              The room is still active. Would you like to rejoin?
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.dismissButtonText}>No Thanks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejoinButton}
                onPress={handleRejoin}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.rejoinButtonGradient}
                >
                  <Text style={styles.rejoinButtonText}>Rejoin Room 🎮</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    width: '90%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  roomName: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rejoinButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejoinButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejoinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
