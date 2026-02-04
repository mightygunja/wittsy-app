/**
 * Enhanced Settings Screen
 * Main settings hub with navigation to all setting categories
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { Card } from '../components/common/Card';
import { GameplayTutorial } from '../components/tutorial/GameplayTutorial';
import { isUserAdmin } from '../utils/adminCheck';
import { Badge } from '../components/common/Badge';
import { SPACING } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;

export const EnhancedSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const { settings, resetSettings } = useSettings();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showTutorial, setShowTutorial] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('Success', 'Settings have been reset to default');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled automatically by auth state change
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const settingsCategories = [
    {
      id: 'tutorial',
      title: 'How to Play',
      icon: '🎮',
      description: 'View gameplay tutorial',
      action: () => setShowTutorial(true),
    },
    {
      id: 'theme',
      title: 'Theme & Appearance',
      icon: '🎨',
      description: 'Dark/Light mode, colors',
      screen: 'ThemeSettings',
      badge: settings.theme.mode === 'dark' ? 'Dark' : 'Light',
    },
    {
      id: 'audio',
      title: 'Audio & Sound',
      icon: '🔊',
      description: 'Volume, music, sound effects',
      screen: 'AudioSettings',
      badge: settings.audio.muteAll ? 'Muted' : `${settings.audio.masterVolume}%`,
    },
    {
      id: 'gameplay',
      title: 'Gameplay',
      icon: '🎮',
      description: 'Auto-submit, timers, animations',
      screen: 'GameplaySettings',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: '🔒',
      description: 'Profile visibility, blocking',
      screen: 'PrivacySettings',
      badge: settings.privacy.profileVisibility,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      description: 'Push, email, in-app alerts',
      screen: 'NotificationSettings',
      badge: settings.notifications.enabled ? 'On' : 'Off',
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      icon: '♿',
      description: 'Font size, contrast, colorblind',
      screen: 'AccessibilitySettings',
    },
    {
      id: 'language',
      title: 'Language & Region',
      icon: '🌍',
      description: 'Language, date/time format',
      screen: 'LanguageSettings',
      badge: settings.language.language.toUpperCase(),
    },
  ];

  const renderSettingCard = (category: typeof settingsCategories[0]) => (
    <Card
      key={category.id}
      variant="elevated"
      style={styles.settingCard}
      onPress={() => category.action ? category.action() : navigation.navigate(category.screen)}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingIcon}>
          <Text style={styles.settingIconText}>{category.icon}</Text>
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{category.title}</Text>
          <Text style={styles.settingDescription}>{category.description}</Text>
        </View>
        {category.badge && (
          <Badge text={category.badge} variant="info" size="sm" />
        )}
        <Text style={styles.settingArrow}>›</Text>
      </View>
    </Card>
  );
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <GameplayTutorial
        visible={showTutorial}
        onComplete={() => setShowTutorial(false)}
        onSkip={() => setShowTutorial(false)}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* User Info */}
        <Animated.View style={[styles.userInfo, { opacity: fadeAnim }]}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{userProfile?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
        </Animated.View>

        {/* Settings Categories */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {settingsCategories.map(renderSettingCard)}

            {/* Admin Section - Only for admins */}
            {isUserAdmin(user) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔧 Admin</Text>
                <Card
                  variant="glass"
                  style={styles.adminCard}
                  onPress={() => navigation.navigate('AdminConsole')}
                >
                  <View style={styles.adminContent}>
                    <Text style={styles.adminTitle}>Season Management</Text>
                    <Text style={styles.adminDescription}>
                      Create and manage competitive seasons
                    </Text>
                  </View>
                  <Text style={styles.settingArrow}>›</Text>
                </Card>
              </View>
            )}

            {/* Danger Zone */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Danger Zone</Text>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleResetSettings}
              >
                <Text style={styles.dangerButtonText}>Reset All Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, styles.signOutButton]}
                onPress={handleSignOut}
              >
                <Text style={styles.dangerButtonText}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>WITTSY v1.0.0</Text>
              <Text style={styles.appInfoText}>
                Last updated: {new Date(settings.lastUpdated).toLocaleDateString()}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  settingCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  settingIconText: {
    fontSize: 24,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  settingArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  section: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  adminCard: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminContent: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  adminDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButton: {
    marginTop: SPACING.sm,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  appInfoText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
});
