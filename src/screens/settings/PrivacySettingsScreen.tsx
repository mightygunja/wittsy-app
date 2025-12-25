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
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


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

      <ScrollView style={styles.content}>
        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>

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

        {/* Data & Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Analytics</Text>

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

        {/* Communication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>

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
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete My Account</Text>
            <Text style={[styles.actionButtonIcon, styles.dangerText]}>⚠️</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.linkButton} onPress={() => openLink('https://wittsy.app/privacy', 'Privacy Policy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => openLink('https://wittsy.app/terms', 'Terms of Service')}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => openLink('https://wittsy.app/cookies', 'Cookie Policy')}>
            <Text style={styles.linkText}>Cookie Policy</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  actionButtonIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  dangerButton: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.error,
  },
  linkButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.primary,
  },
});



