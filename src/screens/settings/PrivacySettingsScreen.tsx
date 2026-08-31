import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
import { deleteAccount } from '../../services/auth';

// NOTE: This screen intentionally contains no privacy toggles or blocked-users
// management. The old toggles (online status, friend requests, analytics, ...)
// persisted values that no code enforced, and user blocking does not exist in
// the app yet. Re-add each control only once it is actually honored.

export const PrivacySettingsScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone. All your data, progress, achievements, and purchases will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This will permanently delete your account and all associated data. This action cannot be reversed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount();
                      // Auth state listener will handle navigation after deletion
                    } catch (error: any) {
                      console.error('❌ Account deletion failed:', error);
                      Alert.alert(
                        'Deletion Failed',
                        error.message || 'Failed to delete account. Please try again.'
                      );
                      setDeleting(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const openLink = (url: string, title: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    });
  };
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Account & Privacy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Your Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              To request a copy or deletion of your data, use the Data Deletion
              Policy page below or contact us via Send Feedback in Settings.
            </Text>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => openLink('https://wittz-support.netlify.app/privacy.html', 'Privacy Policy')}>
            <Text style={styles.actionButtonText}>Privacy Policy →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => openLink('https://wittz-support.netlify.app/terms.html', 'Terms of Service')}>
            <Text style={styles.actionButtonText}>Terms of Service →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => openLink('https://wittz-support.netlify.app/data-deletion.html', 'Data Deletion')}>
            <Text style={styles.actionButtonText}>Data Deletion Policy →</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton, deleting && { opacity: 0.6 }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              {deleting ? 'Deleting Account…' : 'Delete My Account'}
            </Text>
            {deleting ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={[styles.actionButtonIcon, styles.dangerButtonText]}>⚠️</Text>
            )}
          </TouchableOpacity>
          {deleting && (
            <Text style={styles.noteText}>
              Deleting your account and data — this can take a few seconds…
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
