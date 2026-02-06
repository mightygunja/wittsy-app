/**
 * Theme Settings Screen
 * Dark/Light mode, color customization
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
import { ThemeMode } from '../../types/settings';

export const ThemeSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateTheme } = useSettings();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const themeOptions: { mode: ThemeMode; title: string; icon: string; description: string }[] = [
    { mode: 'dark', title: 'Dark Mode', icon: '🌙', description: 'Easy on the eyes in low light' },
    { mode: 'light', title: 'Light Mode', icon: '☀️', description: 'Bright and vibrant' },
    { mode: 'auto', title: 'Auto', icon: '🌓', description: 'Follows system settings' },
  ];

  const handleThemeModeChange = async (mode: ThemeMode) => {
    await updateTheme({ mode, useSystemTheme: mode === 'auto' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Theme & Appearance</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme Mode</Text>

          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.optionCard,
                settings.theme.mode === option.mode && styles.optionSelected,
              ]}
              onPress={() => handleThemeModeChange(option.mode)}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {settings.theme.mode === option.mode && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
