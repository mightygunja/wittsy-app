/**
 * Onboarding Tutorial Component
 * Guides new users through the app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/constants';
import * as haptics from '../../utils/haptics';

const { width } = Dimensions.get('window');

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetScreen?: string;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Wittsy! 🎉',
    description: 'Get ready to unleash your creativity and wit! Let\'s show you around.',
    icon: '👋',
  },
  {
    id: 'avatar',
    title: 'Create Your Avatar 🎨',
    description: 'Customize your unique avatar to stand out in the community. Unlock new items as you play!',
    icon: '🎨',
    targetScreen: 'AvatarCreator',
  },
  {
    id: 'gameplay',
    title: 'How to Play 🎮',
    description: 'Join or create a room, get creative prompts, submit witty responses, and vote for the best ones!',
    icon: '🎮',
  },
  {
    id: 'rewards',
    title: 'Earn Rewards 🏆',
    description: 'Win coins, XP, and exclusive items by playing games, completing challenges, and unlocking achievements!',
    icon: '🏆',
  },
  {
    id: 'battlepass',
    title: 'Battle Pass 🎯',
    description: 'Level up your Battle Pass to unlock amazing rewards every season!',
    icon: '🎯',
    targetScreen: 'BattlePass',
  },
  {
    id: 'challenges',
    title: 'Daily Challenges 📋',
    description: 'Complete daily and weekly challenges for bonus rewards!',
    icon: '📋',
    targetScreen: 'Challenges',
  },
  {
    id: 'events',
    title: 'Join Events 🎪',
    description: 'Participate in tournaments and special events for exclusive prizes!',
    icon: '🎪',
    targetScreen: 'Events',
  },
  {
    id: 'social',
    title: 'Make Friends 👥',
    description: 'Add friends, compete on leaderboards, and climb the ranks together!',
    icon: '👥',
  },
  {
    id: 'ready',
    title: 'You\'re Ready! 🚀',
    description: 'Time to show off your wit! Tap "Get Started" to begin your journey.',
    icon: '🚀',
  },
];

interface OnboardingTutorialProps {
  visible: boolean;
  userId: string;
  onComplete: () => void;
  navigation?: any;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  visible,
  userId,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible, currentStep]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleNext = () => {
    haptics.light();
    
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      animateOut(() => {
        setCurrentStep(currentStep + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    haptics.light();
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      // Mark tutorial as completed in user profile
      await updateDoc(doc(firestore, 'users', userId), {
        tutorialCompleted: true,
        tutorialCompletedAt: new Date().toISOString(),
      });

      onComplete();
    } catch (error) {
      console.error('Failed to mark tutorial as completed:', error);
      onComplete(); // Complete anyway
    }
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.card}
          >
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} / {TUTORIAL_STEPS.length}
              </Text>
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{step.icon}</Text>
            </View>

            {/* Content */}
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {currentStep < TUTORIAL_STEPS.length - 1 ? (
                <>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[COLORS.success, COLORS.successDark]}
                      style={styles.nextButtonGradient}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleComplete}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[COLORS.success, COLORS.successDark]}
                    style={styles.completeButtonGradient}
                  >
                    <Text style={styles.completeButtonText}>Get Started! 🚀</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Dots Indicator */}
            <View style={styles.dotsContainer}>
              {TUTORIAL_STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                  ]}
                />
              ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    width: width * 0.9,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  skipButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  completeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: COLORS.success,
    width: 24,
  },
});
