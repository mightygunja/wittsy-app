/**
 * Theme Settings Screen
 * Dark/Light mode, color customization
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/common/Card';
import { SPACING } from '../../utils/constants';
import { ThemeMode } from '../../types/settings';

export const ThemeSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateTheme } = useSettings();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const themeOptions: { mode: ThemeMode; title: string; icon: string; description: string }[] = [
    {
      mode: 'dark',
      title: 'Dark Mode',
      icon: '🌙',
      description: 'Easy on the eyes in low light',
    },
    {
      mode: 'light',
      title: 'Light Mode',
      icon: '☀️',
      description: 'Bright and vibrant',
    },
    {
      mode: 'auto',
      title: 'Auto',
      icon: '🌓',
      description: 'Follows system settings',
    },
  ];

  const colorPresets = [
    { name: 'Purple', primary: '#6C63FF', accent: '#FF6584' },
    { name: 'Blue', primary: '#4A90E2', accent: '#50E3C2' },
    { name: 'Green', primary: '#7ED321', accent: '#F5A623' },
    { name: 'Pink', primary: '#FF6B9D', accent: '#C06C84' },
    { name: 'Orange', primary: '#FF9500', accent: '#FF5E3A' },
  ];

  const handleThemeModeChange = async (mode: ThemeMode) => {
    await updateTheme({ mode, useSystemTheme: mode === 'auto' });
  };

  const handleColorPresetChange = async (primary: string, accent: string) => {
    await updateTheme({ primaryColor: primary, accentColor: accent });
  };

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Theme & Appearance</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Theme Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Theme Mode</Text>
              {themeOptions.map((option) => (
                <Card
                  key={option.mode}
                  variant={settings.theme.mode === option.mode ? 'glow' : 'elevated'}
                  style={styles.themeCard}
                  onPress={() => handleThemeModeChange(option.mode)}
                >
                  <View style={styles.themeContent}>
                    <View style={styles.themeIcon}>
                      <Text style={styles.themeIconText}>{option.icon}</Text>
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={styles.themeTitle}>{option.title}</Text>
                      <Text style={styles.themeDescription}>{option.description}</Text>
                    </View>
                    {settings.theme.mode === option.mode && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </Card>
              ))}
            </View>

            {/* Color Presets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color Theme</Text>
              <View style={styles.colorGrid}>
                {colorPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={[
                      styles.colorPreset,
                      settings.theme.primaryColor === preset.primary && styles.colorPresetActive,
                    ]}
                    onPress={() => handleColorPresetChange(preset.primary, preset.accent)}
                  >
                    <LinearGradient
                      colors={[preset.primary, preset.accent]}
                      style={styles.colorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {settings.theme.primaryColor === preset.primary && (
                        <Text style={styles.colorCheckmark}>✓</Text>
                      )}
                    </LinearGradient>
                    <Text style={styles.colorName}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* System Theme Toggle */}
            <Card variant="glass" style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Use System Theme</Text>
                  <Text style={styles.settingDescription}>
                    Automatically switch between light and dark
                  </Text>
                </View>
                <Switch
                  value={settings.theme.useSystemTheme}
                  onValueChange={(value) => updateTheme({ useSystemTheme: value })}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.text}
                />
              </View>
            </Card>

            {/* Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <Card variant="elevated" style={styles.previewCard}>
                <Text style={styles.previewTitle}>Sample Card</Text>
                <Text style={styles.previewText}>
                  This is how your theme will look in the app
                </Text>
                <View style={styles.previewButtons}>
                  <View style={[styles.previewButton, { backgroundColor: settings.theme.primaryColor }]}>
                    <Text style={styles.previewButtonText}>Primary</Text>
                  </View>
                  <View style={[styles.previewButton, { backgroundColor: settings.theme.accentColor }]}>
                    <Text style={styles.previewButtonText}>Accent</Text>
                  </View>
                </View>
              </Card>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  themeCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  themeIconText: {
    fontSize: 24,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  checkmark: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorPreset: {
    alignItems: 'center',
    width: '30%',
  },
  colorPresetActive: {
    transform: [{ scale: 1.05 }],
  },
  colorGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  colorCheckmark: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  colorName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  settingCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.sm,
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
  previewCard: {
    padding: SPACING.lg,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  previewButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
