/**
 * Profile Edit Screen
 * Edit username, email, avatar, and other profile information
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
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../services/firebase';

export const ProfileEditScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const [username, setUsername] = useState(userProfile?.username || '');
  const [email, setEmail] = useState(userProfile?.email || user?.email || '');
  const [saving, setSaving] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (username === userProfile?.username) return true; // Same username is OK
    
    const q = query(
      collection(firestore, 'users'),
      where('username', '==', username.trim())
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (email.trim() && !validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailability(username.trim());
      if (!isUsernameAvailable) {
        Alert.alert('Error', 'Username is already taken. Please choose another one.');
        setSaving(false);
        return;
      }

      // Update Firebase Auth display name
      if (user.displayName !== username) {
        await updateProfile(user, { displayName: username });
      }

      // Update Firestore user document (including email in Firestore only)
      const userRef = doc(firestore, 'users', user.uid);
      const updateData: any = {
        username: username.trim(),
      };
      
      // Store email in Firestore for guest users or email updates
      if (email.trim()) {
        updateData.email = email.trim();
      }

      await updateDoc(userRef, updateData);

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Avatar</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('AvatarCreator')}
          >
            <Text style={styles.actionButtonText}>Customize Avatar</Text>
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Basic Information</Text>

          <View style={styles.settingCard}>
            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Username</Text>
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
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={20}
            />
          </View>

          <View style={styles.settingCard}>
            <Text style={[styles.settingLabel, { marginBottom: SPACING.xs }]}>Email</Text>
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
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.settingDescription, { marginTop: SPACING.xs }]}>
              Add or update your email for account recovery
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Stats</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Games Played</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>
                {userProfile?.stats?.gamesPlayed || 0}
              </Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Games Won</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>
                {userProfile?.stats?.gamesWon || 0}
              </Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Win Rate</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>
                {userProfile?.stats?.gamesPlayed 
                  ? Math.round((userProfile.stats.gamesWon / userProfile.stats.gamesPlayed) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: COLORS.primary,
              marginTop: SPACING.lg,
              marginBottom: SPACING.xl,
            }
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.actionButtonText, { color: COLORS.text, fontWeight: 'bold' }]}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
