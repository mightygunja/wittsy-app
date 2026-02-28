/**
 * Gameplay Settings Screen
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';

export const GameplaySettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateGameplay } = useSettings();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const gameplayToggles = [
    { key: 'autoSubmit', label: 'Auto Submit', description: 'Automatically submit when time runs out' },
    { key: 'confirmBeforeSubmit', label: 'Confirm Before Submit', description: 'Ask for confirmation before submitting' },
    { key: 'showTimer', label: 'Show Timer', description: 'Display countdown timer' },
    { key: 'showTypingIndicators', label: 'Typing Indicators', description: 'Show when others are typing' },
    { key: 'autoReadyUp', label: 'Auto Ready Up', description: 'Automatically ready for next round' },
    { key: 'quickChatEnabled', label: 'Quick Chat', description: 'Enable quick chat messages' },
    { key: 'emotesEnabled', label: 'Emotes', description: 'Enable emote reactions' },
    { key: 'animationsEnabled', label: 'Animations', description: 'Enable UI animations' },
    { key: 'reducedMotion', label: 'Reduced Motion', description: 'Minimize animations for accessibility' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Gameplay</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gameplay Options</Text>
          
          {gameplayToggles.map((toggle) => (
            <View key={toggle.key} style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{toggle.label}</Text>
                  <Text style={styles.settingDescription}>{toggle.description}</Text>
                </View>
                <Switch
                  value={settings.gameplay[toggle.key as keyof typeof settings.gameplay] as boolean}
                  onValueChange={(value) => updateGameplay({ [toggle.key]: value })}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
