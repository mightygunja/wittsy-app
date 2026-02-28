/**
 * Feedback Screen
 * Allow users to submit feedback, report bugs, and suggest features
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../services/firebase';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

export const FeedbackScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const [selectedType, setSelectedType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { type: 'bug' as FeedbackType, label: '🐛 Bug Report', description: 'Report a problem or error' },
    { type: 'feature' as FeedbackType, label: '✨ Feature Request', description: 'Suggest a new feature' },
    { type: 'improvement' as FeedbackType, label: '🚀 Improvement', description: 'Suggest an enhancement' },
    { type: 'other' as FeedbackType, label: '💬 Other', description: 'General feedback' },
  ];

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      Alert.alert('Error', 'You must be logged in to submit feedback');
      return;
    }

    if (title.trim().length < 5) {
      Alert.alert('Error', 'Please provide a title (at least 5 characters)');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'feedback'), {
        userId: user.uid,
        username: userProfile.username,
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
        platform: 'mobile',
      });

      Alert.alert(
        'Thank You! 🎉',
        'Your feedback has been submitted. We appreciate you helping us improve Wittz!',
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
              setSelectedType('bug');
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>💭 Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Feedback Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What would you like to share?</Text>

          {feedbackTypes.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.optionCard,
                selectedType === item.type && styles.optionSelected,
              ]}
              onPress={() => setSelectedType(item.type)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{item.label}</Text>
                <Text style={styles.optionDescription}>{item.description}</Text>
              </View>
              {selectedType === item.type && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>

          <View style={styles.settingCard}>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief summary of your feedback"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={100}
            />
            <Text style={[styles.settingDescription, { marginTop: SPACING.xs }]}>
              {title.length}/100 characters
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.settingCard}>
            <TextInput
              style={{
                fontSize: 16,
                color: COLORS.text,
                padding: SPACING.sm,
                backgroundColor: COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide as much detail as possible..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={500}
            />
            <Text style={[styles.settingDescription, { marginTop: SPACING.xs }]}>
              {description.length}/500 characters
            </Text>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            💡 Your feedback helps us make Wittz better for everyone. We review all submissions and may reach out for more details.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: COLORS.primary,
              marginTop: SPACING.lg,
              marginBottom: SPACING.xl,
            }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={[styles.actionButtonText, { color: COLORS.text, fontWeight: 'bold' }]}>
            {submitting ? 'Submitting...' : '📤 Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
