import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
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

  const handleToggle = async (key: keyof typeof settings.accessibility, value: boolean) => {
    await updateAccessibility({ [key]: value });
  };

  const handleFontSizeChange = async (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    await updateAccessibility({ fontSize: size });
  };

  const handleContrastChange = async (mode: 'normal' | 'high' | 'dark') => {
    await updateAccessibility({ highContrast: mode === 'high' });
  };
  const styles = useMemo(() => createStyles(COLORS, SPACING), [COLORS]);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accessibility</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Visual Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual</Text>
          
          {/* Font Size */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Font Size</Text>
            <Text style={styles.subsectionDescription}>
              Adjust text size throughout the app
            </Text>
            {FONT_SIZES.map((font) => (
              <TouchableOpacity
                key={font.value}
                style={[
                  styles.option,
                  settings.accessibility.fontSize === font.value && styles.optionSelected,
                ]}
                onPress={() => handleFontSizeChange(font.value as any)}
              >
                <Text style={[styles.optionText, { fontSize: font.size }]}>
                  {font.label}
                </Text>
                {settings.accessibility.fontSize === font.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* High Contrast */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Contrast Mode</Text>
            {CONTRAST_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.option,
                  (mode.value === 'high' && settings.accessibility.highContrast) && styles.optionSelected,
                ]}
                onPress={() => handleContrastChange(mode.value as any)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{mode.label}</Text>
                  <Text style={styles.optionDescription}>{mode.description}</Text>
                </View>
                {(mode.value === 'high' && settings.accessibility.highContrast) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Blind Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Color Blind Mode</Text>
              <Text style={styles.settingDescription}>
                Adjust colors for better visibility
              </Text>
            </View>
            <Switch
              value={settings.accessibility.colorBlindMode}
              onValueChange={(value) => handleToggle('colorBlindMode', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {/* Motion & Animation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motion & Animation</Text>

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

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reduce Transparency</Text>
              <Text style={styles.settingDescription}>
                Use solid backgrounds instead of transparency
              </Text>
            </View>
            <Switch
              value={settings.accessibility.reduceTransparency}
              onValueChange={(value) => handleToggle('reduceTransparency', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {/* Audio & Captions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Captions</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Screen Reader Support</Text>
              <Text style={styles.settingDescription}>
                Enable enhanced screen reader compatibility
              </Text>
            </View>
            <Switch
              value={settings.accessibility.screenReader}
              onValueChange={(value) => handleToggle('screenReader', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibration feedback for interactions
              </Text>
            </View>
            <Switch
              value={settings.accessibility.hapticFeedback}
              onValueChange={(value) => handleToggle('hapticFeedback', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ♿ These settings help make WITTSY more accessible to everyone. If you have suggestions for additional accessibility features, please contact support.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any, SPACING: any) => StyleSheet.create({
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
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subsectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
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
  noteContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: COLORS.info + '20',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});



