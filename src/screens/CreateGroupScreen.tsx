import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { createGroup } from '../services/groups';

export const CreateGroupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile } = useAuth();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const descRef = useRef<TextInput>(null);

  const handleCreate = async () => {
    if (!user || !userProfile) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a name for your group.');
      return;
    }
    if (trimmedName.length > 50) {
      Alert.alert('Name too long', 'Group name must be 50 characters or less.');
      return;
    }

    setLoading(true);
    try {
      const groupId = await createGroup(
        user.uid,
        userProfile.username,
        trimmedName,
        description.trim()
      );
      navigation.replace('GroupDetail', { groupId });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create a Group</Text>
          <Text style={styles.subtitle}>
            Invite friends and play together. Your group gets its own leaderboard and game history.
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Group Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Friday Night Crew"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => descRef.current?.focus()}
            />
            <Text style={styles.charCount}>{name.length}/50</Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              ref={descRef}
              style={[styles.input, styles.inputMultiline]}
              placeholder="What's this group about?"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              multiline
              numberOfLines={3}
              blurOnSubmit
              returnKeyType="done"
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, loading && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Create Group</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: COLORS.textSecondary,
      lineHeight: 20,
      marginBottom: 28,
    },
    fieldBlock: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: 6,
    },
    required: {
      color: COLORS.error,
    },
    optional: {
      color: COLORS.textSecondary,
      fontWeight: '400',
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: COLORS.text,
      backgroundColor: COLORS.surface,
    },
    inputMultiline: {
      height: 90,
      paddingTop: 12,
    },
    charCount: {
      fontSize: 11,
      color: COLORS.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },
    createBtn: {
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 12,
    },
    createBtnDisabled: {
      opacity: 0.6,
    },
    createBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    cancelBtn: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    cancelBtnText: {
      color: COLORS.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
  });
