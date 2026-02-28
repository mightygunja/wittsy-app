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
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';

const FONT_SIZES = [
  { value: 'small', label: 'Small', size: 14 },
  { value: 'medium', label: 'Medium (Default)', size: 16 },
  { value: 'large', label: 'Large', size: 18 },
  { value: 'xlarge', label: 'Extra Large', size: 20 },
];

const CONTRAST_MODES = [
  { value: 'normal', label: 'Normal', description: 'Standard colors' },
  { value: 'high', label: 'High Contrast', description: 'Enhanced visibility' },
  { value: 'dark', label: 'Dark Mode', description: 'Reduced eye strain' },
];

export const AccessibilitySettingsScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { settings, updateAccessibility } = useSettings();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const handleToggle = async (key: keyof typeof settings.accessibility, value: boolean) => {
    await updateAccessibility({ [key]: value });
  };

  const handleFontSizeChange = async (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    await updateAccessibility({ fontSize: size });
  };

  const handleContrastChange = async (mode: 'normal' | 'high' | 'dark') => {
    await updateAccessibility({ highContrast: mode === 'high' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Accessibility</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Size</Text>

          {FONT_SIZES.map((font) => (
            <TouchableOpacity
              key={font.value}
              style={[
                styles.optionCard,
                settings.accessibility.fontSize === font.value && styles.optionSelected,
              ]}
              onPress={() => handleFontSizeChange(font.value as any)}
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { fontSize: font.size }]}>{font.label}</Text>
              </View>
              {settings.accessibility.fontSize === font.value && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contrast Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contrast</Text>

          {CONTRAST_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.optionCard,
                (mode.value === 'high' && settings.accessibility.highContrast) && styles.optionSelected,
              ]}
              onPress={() => handleContrastChange(mode.value as any)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{mode.label}</Text>
                <Text style={styles.optionDescription}>{mode.description}</Text>
              </View>
              {(mode.value === 'high' && settings.accessibility.highContrast) && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Accessibility Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Screen Reader</Text>
                <Text style={styles.settingDescription}>
                  Enable screen reader support
                </Text>
              </View>
              <Switch
                value={settings.accessibility.screenReader}
                onValueChange={(value) => handleToggle('screenReader', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Reduce Motion</Text>
                <Text style={styles.settingDescription}>
                  Minimize animations and transitions
                </Text>
              </View>
              <Switch
                value={settings.accessibility.reduceMotion}
                onValueChange={(value) => handleToggle('reduceMotion', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Colorblind Mode</Text>
                <Text style={styles.settingDescription}>
                  Adjust colors for colorblindness
                </Text>
              </View>
              <Switch
                value={settings.accessibility.colorblindMode}
                onValueChange={(value) => handleToggle('colorblindMode', value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
