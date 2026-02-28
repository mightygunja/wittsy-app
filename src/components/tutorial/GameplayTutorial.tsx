/**
 * Gameplay Tutorial Component
 * Professional, animated tutorial showing how to play the game
 * Uses screen mockups and smooth animations
 */

import React, { useState, useEffect } from 'react';
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
import { contentWidth } from '../../utils/responsive';

const width = contentWidth;

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  screenMockup: 'prompt' | 'submission' | 'voting' | 'results' | 'rewards';
  tips?: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Wittsy! 🎮',
    description: 'Learn how to play in just 60 seconds. Get ready to unleash your creativity!',
    icon: '👋',
    screenMockup: 'prompt',
  },
  {
    id: 'join',
    title: 'Join a Game Room 🚪',
    description: 'Tap "Quick Play" to instantly join a game with other players, or browse rooms to find the perfect match.',
    icon: '🎯',
    screenMockup: 'prompt',
    tips: ['Quick Play finds games fast', 'Ranked mode affects your rating', 'Casual mode is for practice'],
  },
  {
    id: 'prompt',
    title: 'Get Your Prompt 📝',
    description: 'Each round, you\'ll receive a creative prompt. Read it carefully - this is what you\'ll respond to!',
    icon: '💡',
    screenMockup: 'prompt',
    tips: ['Prompts change every round', 'Think creative and funny', 'You have time to prepare'],
  },
  {
    id: 'submit',
    title: 'Submit Your Response ✍️',
    description: 'Type your wittiest response to the prompt. Be creative, funny, or clever - whatever fits your style!',
    icon: '✨',
    screenMockup: 'submission',
    tips: ['You have 60 seconds to submit', 'Max 200 characters', 'Make it memorable!'],
  },
  {
    id: 'vote',
    title: 'Vote for the Best 🗳️',
    description: 'Read all responses (anonymously) and vote for your favorite. You can\'t vote for your own!',
    icon: '⭐',
    screenMockup: 'voting',
    tips: ['All responses are anonymous', 'Vote for the funniest or cleverest', 'You can\'t vote for yourself'],
  },
  {
    id: 'results',
    title: 'See the Winner 🏆',
    description: 'The response with the most votes wins! See who wrote each response and celebrate the winner.',
    icon: '🎉',
    screenMockup: 'results',
    tips: ['Winner gets bonus coins', 'Get 4+ votes for a ⭐ star', 'Stars unlock special rewards'],
  },
  {
    id: 'rewards',
    title: 'Earn Rewards 💰',
    description: 'Win coins, XP, and level up your Battle Pass. Unlock avatar items and climb the leaderboard!',
    icon: '🎁',
    screenMockup: 'rewards',
    tips: ['Coins unlock avatar items', 'XP levels up your Battle Pass', 'Daily challenges give bonus rewards'],
  },
  {
    id: 'ready',
    title: 'You\'re Ready to Play! 🚀',
    description: 'That\'s it! Jump into a game and show off your wit. Have fun!',
    icon: '🎮',
    screenMockup: 'prompt',
  },
];

interface GameplayTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

export const GameplayTutorial: React.FC<GameplayTutorialProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [mockupAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible, currentStep]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    mockupAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(mockupAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
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
      });
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    haptics.light();
    
    if (currentStep > 0) {
      animateOut(() => {
        setCurrentStep(currentStep - 1);
      });
    }
  };

  const handleSkip = () => {
    haptics.light();
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const handleComplete = () => {
    haptics.success();
    onComplete();
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
      <BlurView intensity={90} style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Screen Mockup */}
          <Animated.View
            style={[
              styles.mockupContainer,
              {
                opacity: mockupAnim,
                transform: [
                  {
                    scale: mockupAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderScreenMockup(step.screenMockup)}
          </Animated.View>

          {/* Tutorial Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.background]}
              style={styles.cardGradient}
            >
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                      },
                    ]}
                  />
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

              {/* Tips */}
              {step.tips && step.tips.length > 0 && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>💡 Tips:</Text>
                  {step.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>•</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                )}

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
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.nextButtonGradient}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentStep === TUTORIAL_STEPS.length - 1 ? "Let's Play! 🚀" : 'Next →'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Dots Indicator */}
              <View style={styles.dotsContainer}>
                {TUTORIAL_STEPS.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      haptics.light();
                      animateOut(() => setCurrentStep(index));
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.dot,
                        index === currentStep && styles.dotActive,
                        index < currentStep && styles.dotCompleted,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// Screen Mockup Renderer
const renderScreenMockup = (type: string) => {
  switch (type) {
    case 'prompt':
      return (
        <View style={mockupStyles.screen}>
          <View style={mockupStyles.header}>
            <Text style={mockupStyles.headerText}>Round 1</Text>
          </View>
          <View style={mockupStyles.promptCard}>
            <Text style={mockupStyles.promptLabel}>YOUR PROMPT</Text>
            <Text style={mockupStyles.promptText}>
              "What's the worst advice you could give to a time traveler?"
            </Text>
          </View>
          <Text style={mockupStyles.subtitle}>Get ready to submit!</Text>
        </View>
      );

    case 'submission':
      return (
        <View style={mockupStyles.screen}>
          <View style={mockupStyles.promptCardSmall}>
            <Text style={mockupStyles.promptLabelSmall}>PROMPT</Text>
            <Text style={mockupStyles.promptTextSmall}>
              "What's the worst advice..."
            </Text>
          </View>
          <View style={mockupStyles.inputBox}>
            <Text style={mockupStyles.inputPlaceholder}>
              Type your witty response here...
            </Text>
          </View>
          <View style={mockupStyles.charCount}>
            <Text style={mockupStyles.charCountText}>0/200</Text>
          </View>
          <View style={mockupStyles.submitButton}>
            <Text style={mockupStyles.submitButtonText}>SUBMIT PHRASE</Text>
          </View>
        </View>
      );

    case 'voting':
      return (
        <View style={mockupStyles.screen}>
          <View style={mockupStyles.voteHeader}>
            <Text style={mockupStyles.voteHeaderText}>VOTE FOR THE BEST!</Text>
          </View>
          <View style={mockupStyles.phraseCard}>
            <Text style={mockupStyles.phraseNumber}>1</Text>
            <Text style={mockupStyles.phraseText}>
              "Just wing it, what could go wrong?"
            </Text>
          </View>
          <View style={mockupStyles.phraseCard}>
            <Text style={mockupStyles.phraseNumber}>2</Text>
            <Text style={mockupStyles.phraseText}>
              "Always trust the dinosaurs"
            </Text>
          </View>
          <View style={mockupStyles.phraseCard}>
            <Text style={mockupStyles.phraseNumber}>3</Text>
            <Text style={mockupStyles.phraseText}>
              "Bring back lottery numbers"
            </Text>
          </View>
        </View>
      );

    case 'results':
      return (
        <View style={mockupStyles.screen}>
          <View style={mockupStyles.winnerBanner}>
            <Text style={mockupStyles.winnerText}>🏆 WINNER! 🏆</Text>
          </View>
          <View style={mockupStyles.winningCard}>
            <Text style={mockupStyles.winningPhrase}>
              "Just wing it, what could go wrong?"
            </Text>
            <Text style={mockupStyles.winningAuthor}>by @Player123</Text>
            <Text style={mockupStyles.winningVotes}>⭐ 5 votes</Text>
          </View>
        </View>
      );

    case 'rewards':
      return (
        <View style={mockupStyles.screen}>
          <View style={mockupStyles.rewardCard}>
            <Text style={mockupStyles.rewardIcon}>🎁</Text>
            <Text style={mockupStyles.rewardTitle}>Rewards Earned!</Text>
            <View style={mockupStyles.rewardItem}>
              <Text style={mockupStyles.rewardEmoji}>🪙</Text>
              <Text style={mockupStyles.rewardText}>+50 Coins</Text>
            </View>
            <View style={mockupStyles.rewardItem}>
              <Text style={mockupStyles.rewardEmoji}>⚡</Text>
              <Text style={mockupStyles.rewardText}>+100 XP</Text>
            </View>
            <View style={mockupStyles.rewardItem}>
              <Text style={mockupStyles.rewardEmoji}>🎯</Text>
              <Text style={mockupStyles.rewardText}>Battle Pass +1</Text>
            </View>
          </View>
        </View>
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    width: width * 0.95,
    maxWidth: 450,
    alignItems: 'center',
  },
  mockupContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
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
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
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
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  tipBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: SPACING.xs,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nextButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: COLORS.success,
  },
});

// Screen Mockup Styles
const mockupStyles = StyleSheet.create({
  screen: {
    width: '100%',
    minHeight: 280,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  promptCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 26,
  },
  promptCardSmall: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  promptLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  promptTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: 100,
    marginBottom: SPACING.xs,
  },
  inputPlaceholder: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  charCount: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  charCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  voteHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  voteHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  phraseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phraseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SPACING.sm,
    width: 30,
  },
  phraseText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  winnerBanner: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  winningCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
  },
  winningPhrase: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 24,
  },
  winningAuthor: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  winningVotes: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
  },
  rewardCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    width: '100%',
    justifyContent: 'center',
  },
  rewardEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
