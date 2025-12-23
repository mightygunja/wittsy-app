import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { submitPrompt, containsProfanity } from '../services/prompts';
import { PromptCategory, PromptDifficulty } from '../types/prompts';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants';
import { Button } from '../components/common/Button';

const CATEGORIES: { id: PromptCategory; name: string; icon: string }[] = [
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'pop-culture', name: 'Pop Culture', icon: '🎬' },
  { id: 'food', name: 'Food', icon: '🍕' },
  { id: 'technology', name: 'Tech', icon: '💻' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'movies', name: 'Movies', icon: '🎥' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'animals', name: 'Animals', icon: '🐾' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'relationships', name: 'Love', icon: '💕' },
];

const DIFFICULTIES: { id: PromptDifficulty; name: string; description: string }[] = [
  { id: 'easy', name: 'Easy', description: 'Simple, straightforward prompts' },
  { id: 'medium', name: 'Medium', description: 'Requires some creativity' },
  { id: 'hard', name: 'Hard', description: 'Challenging, abstract prompts' },
];

export const SubmitPromptScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [promptText, setPromptText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('general');
  const [selectedDifficulty, setSelectedDifficulty] = useState<PromptDifficulty>('medium');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to submit prompts');
      return;
    }

    if (promptText.trim().length < 10) {
      Alert.alert('Too Short', 'Prompt must be at least 10 characters long');
      return;
    }

    if (containsProfanity(promptText)) {
      Alert.alert(
        'Inappropriate Content',
        'Your prompt contains inappropriate language. Please revise and try again.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await submitPrompt(
        user.uid,
        promptText,
        selectedCategory,
        selectedDifficulty,
        tagArray
      );

      Alert.alert(
        'Success! 🎉',
        'Your prompt has been submitted for review. Thank you for contributing!',
        [
          {
            text: 'Submit Another',
            onPress: () => {
              setPromptText('');
              setTags('');
              setSelectedCategory('general');
              setSelectedDifficulty('medium');
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit prompt');
    } finally {
      setSubmitting(false);
    }
  };

  const characterCount = promptText.length;
  const isValid = characterCount >= 10 && characterCount <= 200;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight]}
        style={styles.gradient}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Submit a Prompt</Text>
          <Text style={styles.subtitle}>
            Share your creative prompts with the community
          </Text>
        </Animated.View>

        {/* Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>📋 Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Keep it clean and appropriate for all ages{'\n'}
            • Make it fun and creative{'\n'}
            • Avoid overly specific or niche topics{'\n'}
            • No personal information or offensive content
          </Text>
        </View>

        {/* Prompt Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Prompt *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., The best thing about weekends..."
              placeholderTextColor={COLORS.textSecondary}
              value={promptText}
              onChangeText={setPromptText}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <View style={styles.characterCount}>
              <Text
                style={[
                  styles.characterCountText,
                  !isValid && characterCount > 0 && styles.characterCountError,
                  isValid && styles.characterCountValid,
                ]}
              >
                {characterCount}/200
              </Text>
            </View>
          </View>
          {characterCount > 0 && !isValid && (
            <Text style={styles.errorText}>
              {characterCount < 10
                ? `Need ${10 - characterCount} more characters`
                : 'Too long! Max 200 characters'}
            </Text>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.optionsGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.optionCard,
                  selectedCategory === category.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.optionIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.optionText,
                    selectedCategory === category.id && styles.optionTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Difficulty *</Text>
          <View style={styles.difficultyContainer}>
            {DIFFICULTIES.map((difficulty) => (
              <TouchableOpacity
                key={difficulty.id}
                style={[
                  styles.difficultyCard,
                  selectedDifficulty === difficulty.id && styles.difficultyCardSelected,
                ]}
                onPress={() => setSelectedDifficulty(difficulty.id)}
              >
                <Text
                  style={[
                    styles.difficultyName,
                    selectedDifficulty === difficulty.id && styles.difficultyNameSelected,
                  ]}
                >
                  {difficulty.name}
                </Text>
                <Text style={styles.difficultyDescription}>{difficulty.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., fun, weekend, relaxation (comma-separated)"
            placeholderTextColor={COLORS.textSecondary}
            value={tags}
            onChangeText={setTags}
          />
          <Text style={styles.helperText}>
            Add tags to help categorize your prompt
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={submitting ? 'Submitting...' : 'Submit Prompt'}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            loading={submitting}
            size="lg"
            fullWidth
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            All submissions are reviewed by our team before being added to the game.
            You'll be credited as the creator if approved!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  guidelinesCard: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  guidelinesTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  guidelinesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    position: 'relative',
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    minHeight: 120,
    ...SHADOWS.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    ...SHADOWS.sm,
  },
  characterCount: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  characterCountText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  characterCountError: {
    color: COLORS.error,
  },
  characterCountValid: {
    color: COLORS.success,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  optionCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  difficultyContainer: {
    gap: SPACING.sm,
  },
  difficultyCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  difficultyCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  difficultyName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xxs,
  },
  difficultyNameSelected: {
    color: COLORS.primary,
  },
  difficultyDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  submitContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
