import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { submitPrompt, containsProfanity, getActiveCategories, getCategoryCounts } from '../services/prompts';
import { PromptCategory, PromptDifficulty } from '../types/prompts';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/common/Button';
import { tabletHorizontalPadding } from '../utils/responsive';

// Category metadata mapping
const CATEGORY_METADATA: Record<string, { name: string; icon: string }> = {
  'general': { name: 'General', icon: '💬' },
  'food': { name: 'Food', icon: '�' },
  'entertainment': { name: 'Entertainment', icon: '�' },
  'technology': { name: 'Tech', icon: '💻' },
  'sports': { name: 'Sports', icon: '⚽' },
  'music': { name: 'Music', icon: '🎵' },
  'travel': { name: 'Travel', icon: '✈️' },
  'animals': { name: 'Animals', icon: '🐾' },
  'personal': { name: 'Personal', icon: '👤' },
  'relationships': { name: 'Love', icon: '💕' },
  'work': { name: 'Work', icon: '💼' },
  'gaming': { name: 'Gaming', icon: '🎮' },
  'fashion': { name: 'Fashion', icon: '�' },
  'social-media': { name: 'Social Media', icon: '�' },
};

const getDefaultCategoryMetadata = (category: string) => ({
  name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
  icon: '�',
});

const DIFFICULTIES: { id: PromptDifficulty; name: string; description: string }[] = [
  { id: 'easy', name: 'Easy', description: 'Simple, straightforward prompts' },
  { id: 'medium', name: 'Medium', description: 'Requires some creativity' },
  { id: 'hard', name: 'Hard', description: 'Challenging, abstract prompts' },
];

export const SubmitPromptScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { user } = useAuth();
  const [promptText, setPromptText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('general');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PromptDifficulty>('medium');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeCategories, setActiveCategories] = useState<PromptCategory[]>([
    'general', 'food', 'technology', 'relationships', 'work', 
    'sports', 'music', 'animals', 'travel', 'history', 'science'
  ] as PromptCategory[]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load categories immediately
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const [categories, counts] = await Promise.all([
        getActiveCategories(),
        getCategoryCounts(),
      ]);
      setActiveCategories(categories);
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

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

      const categoryToSubmit = showCustomCategory && customCategory.trim() 
        ? customCategory.trim().toLowerCase().replace(/\s+/g, '-') as PromptCategory
        : selectedCategory;

      await submitPrompt(
        user.uid,
        promptText,
        categoryToSubmit,
        selectedDifficulty,
        tagArray
      );

      Alert.alert(
        'Submitted Successfully! 🎉',
        'Your prompt is now in the approval queue. Our team will review it shortly and you\'ll be credited as the creator if approved!',
        [
          {
            text: 'Submit Another',
            style: 'default',
            onPress: () => {
              setPromptText('');
              setTags('');
              setSelectedCategory('general');
              setCustomCategory('');
              setShowCustomCategory(false);
              setSelectedDifficulty('medium');
            },
          },
          {
            text: 'Back to Library',
            style: 'cancel',
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
            {activeCategories
              .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0))
              .slice(0, 12)
              .map((categoryId) => {
                const metadata = CATEGORY_METADATA[categoryId] || getDefaultCategoryMetadata(categoryId);
                return (
                  <TouchableOpacity
                    key={categoryId}
                    style={[
                      styles.optionCard,
                      selectedCategory === categoryId && !showCustomCategory && styles.optionCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(categoryId);
                      setShowCustomCategory(false);
                    }}
                  >
                    <Text style={styles.optionIcon}>{metadata.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        selectedCategory === categoryId && !showCustomCategory && styles.optionTextSelected,
                      ]}
                    >
                      {metadata.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            <TouchableOpacity
              style={[
                styles.optionCard,
                showCustomCategory && styles.optionCardSelected,
              ]}
              onPress={() => setShowCustomCategory(true)}
            >
              <Text style={styles.optionIcon}>➕</Text>
              <Text
                style={[
                  styles.optionText,
                  showCustomCategory && styles.optionTextSelected,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>
          {showCustomCategory && (
            <View style={styles.customCategoryContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter custom category name"
                placeholderTextColor={COLORS.textSecondary}
                value={customCategory}
                onChangeText={setCustomCategory}
                autoFocus
              />
            </View>
          )}
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
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Admin Review Process</Text>
            <Text style={styles.infoText}>
              All submissions go through our approval queue to ensure quality and appropriateness. You'll be credited as the creator if your prompt is approved!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
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
    paddingHorizontal: SPACING.xl + tabletHorizontalPadding,
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
  customCategoryContainer: {
    marginTop: SPACING.md,
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
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xxs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
});
