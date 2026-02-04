import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';

export const NotificationSettingsScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { settings, updateNotifications } = useSettings();

  const handleToggle = async (key: keyof typeof settings.notifications, value: boolean) => {
    await updateNotifications({ [key]: value });
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Push Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications on your device
                </Text>
              </View>
              <Switch
                value={settings.notifications.pushEnabled}
                onValueChange={(value) => handleToggle('pushEnabled', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Game Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Notifications</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Game Invites</Text>
                <Text style={styles.settingDescription}>
                  When someone invites you to a game
                </Text>
              </View>
              <Switch
                value={settings.notifications.gameInvites}
                onValueChange={(value) => handleToggle('gameInvites', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Game Start</Text>
                <Text style={styles.settingDescription}>
                  When a game you joined is starting
                </Text>
              </View>
              <Switch
                value={settings.notifications.gameStart}
                onValueChange={(value) => handleToggle('gameStart', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Turn Reminders</Text>
                <Text style={styles.settingDescription}>
                  Remind you when it's your turn
                </Text>
              </View>
              <Switch
                value={settings.notifications.turnReminders}
                onValueChange={(value) => handleToggle('turnReminders', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Social Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Notifications</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Friend Requests</Text>
                <Text style={styles.settingDescription}>
                  When someone sends you a friend request
                </Text>
              </View>
              <Switch
                value={settings.notifications.friendRequests}
                onValueChange={(value) => handleToggle('friendRequests', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Messages</Text>
                <Text style={styles.settingDescription}>
                  When you receive a new message
                </Text>
              </View>
              <Switch
                value={settings.notifications.messages}
                onValueChange={(value) => handleToggle('messages', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Achievement Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements & Progress</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Achievements</Text>
                <Text style={styles.settingDescription}>
                  When you unlock a new achievement
                </Text>
              </View>
              <Switch
                value={settings.notifications.achievements}
                onValueChange={(value) => handleToggle('achievements', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Level Up</Text>
                <Text style={styles.settingDescription}>
                  When you reach a new level
                </Text>
              </View>
              <Switch
                value={settings.notifications.levelUp}
                onValueChange={(value) => handleToggle('levelUp', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Leaderboard Updates</Text>
                <Text style={styles.settingDescription}>
                  When your rank changes significantly
                </Text>
              </View>
              <Switch
                value={settings.notifications.leaderboard}
                onValueChange={(value) => handleToggle('leaderboard', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Marketing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing & Updates</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Promotions</Text>
                <Text style={styles.settingDescription}>
                  Special offers and promotions
                </Text>
              </View>
              <Switch
                value={settings.notifications.promotions}
                onValueChange={(value) => handleToggle('promotions', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>News & Updates</Text>
                <Text style={styles.settingDescription}>
                  App updates and new features
                </Text>
              </View>
              <Switch
                value={settings.notifications.updates}
                onValueChange={(value) => handleToggle('updates', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            🔔 You can manage system notification permissions in your device settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
