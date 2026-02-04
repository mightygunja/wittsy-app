import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
export const PrivacySettingsScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { settings, updatePrivacy } = useSettings();

  const handleToggle = async (key: keyof typeof settings.privacy, value: boolean) => {
    await updatePrivacy({ [key]: value });
  };

  const handleManageBlockedUsers = () => {
    Alert.alert(
      'Blocked Users',
      'You have no blocked users. Block users from their profile or during gameplay.',
      [{ text: 'OK' }]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      'Your data export will be prepared and sent to your email within 24-48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Export', 
          onPress: () => {
            console.log('📦 Data export requested');
            Alert.alert('Success', 'Data export request submitted. Check your email in 24-48 hours.');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone. All your data, progress, and achievements will be lost forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Forever', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'I Understand', 
                  style: 'destructive',
                  onPress: () => {
                    console.log('🗑️ Account deletion initiated');
                    Alert.alert('Account Deletion', 'Your account deletion request has been submitted. You will be logged out shortly.');
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Online Status</Text>
                <Text style={styles.settingDescription}>
                  Let others see when you're online
                </Text>
              </View>
              <Switch
                value={settings.privacy.showOnlineStatus}
                onValueChange={(value) => handleToggle('showOnlineStatus', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Game Activity</Text>
                <Text style={styles.settingDescription}>
                  Display what game you're currently playing
                </Text>
              </View>
              <Switch
                value={settings.privacy.showActivity}
                onValueChange={(value) => handleToggle('showActivity', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Stats</Text>
                <Text style={styles.settingDescription}>
                  Display your wins, rating, and achievements
                </Text>
              </View>
              <Switch
                value={settings.privacy.showStats}
                onValueChange={(value) => handleToggle('showStats', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Data & Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Analytics</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Analytics</Text>
                <Text style={styles.settingDescription}>
                  Help improve the app by sharing usage data
                </Text>
              </View>
              <Switch
                value={settings.privacy.analytics}
                onValueChange={(value) => handleToggle('analytics', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Personalized Ads</Text>
                <Text style={styles.settingDescription}>
                  Show ads based on your interests
                </Text>
              </View>
              <Switch
                value={settings.privacy.personalizedAds}
                onValueChange={(value) => handleToggle('personalizedAds', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Communication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow Friend Requests</Text>
                <Text style={styles.settingDescription}>
                  Let other players send you friend requests
                </Text>
              </View>
              <Switch
                value={settings.privacy.allowFriendRequests}
                onValueChange={(value) => handleToggle('allowFriendRequests', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow Game Invites</Text>
                <Text style={styles.settingDescription}>
                  Receive invitations to join games
                </Text>
              </View>
              <Switch
                value={settings.privacy.allowGameInvites}
                onValueChange={(value) => handleToggle('allowGameInvites', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Blocked Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleManageBlockedUsers}>
            <Text style={styles.actionButtonText}>Manage Blocked Users</Text>
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadData}>
            <Text style={styles.actionButtonText}>Download My Data</Text>
            <Text style={styles.actionButtonIcon}>↓</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteAccount}>
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Delete My Account</Text>
            <Text style={[styles.actionButtonIcon, styles.dangerButtonText]}>⚠️</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => openLink('https://wittsy.app/privacy', 'Privacy Policy')}>
            <Text style={styles.actionButtonText}>Privacy Policy →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => openLink('https://wittsy.app/terms', 'Terms of Service')}>
            <Text style={styles.actionButtonText}>Terms of Service →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => openLink('https://wittsy.app/cookies', 'Cookie Policy')}>
            <Text style={styles.actionButtonText}>Cookie Policy →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles now imported from unified settingsStyles



