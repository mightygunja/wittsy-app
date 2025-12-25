import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)', example: '12/23/2025' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)', example: '23/12/2025' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)', example: '2025-12-23' },
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour (3:45 PM)' },
  { value: '24h', label: '24-hour (15:45)' },
];

export const LanguageSettingsScreen: React.FC = () => {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { settings, updateLanguage } = useSettings();

  const handleLanguageChange = async (languageCode: string) => {
    await updateLanguage({ language: languageCode });
  };

  const handleDateFormatChange = async (format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => {
    await updateLanguage({ dateFormat: format });
  };

  const handleTimeFormatChange = async (format: '12h' | '24h') => {
    await updateLanguage({ timeFormat: format });
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
        <Text style={styles.headerTitle}>Language & Region</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Text style={styles.sectionDescription}>
            Choose your preferred language for the app
          </Text>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                settings.language.language === lang.code && styles.optionSelected,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={styles.optionText}>{lang.name}</Text>
              {settings.language.language === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Format</Text>
          <Text style={styles.sectionDescription}>
            Choose how dates are displayed
          </Text>
          {DATE_FORMATS.map((format) => (
            <TouchableOpacity
              key={format.value}
              style={[
                styles.option,
                settings.language.dateFormat === format.value && styles.optionSelected,
              ]}
              onPress={() => handleDateFormatChange(format.value as any)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{format.label}</Text>
                <Text style={styles.optionExample}>{format.example}</Text>
              </View>
              {settings.language.dateFormat === format.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Format</Text>
          <Text style={styles.sectionDescription}>
            Choose how time is displayed
          </Text>
          {TIME_FORMATS.map((format) => (
            <TouchableOpacity
              key={format.value}
              style={[
                styles.option,
                settings.language.timeFormat === format.value && styles.optionSelected,
              ]}
              onPress={() => handleTimeFormatChange(format.value as any)}
            >
              <Text style={styles.optionText}>{format.label}</Text>
              {settings.language.timeFormat === format.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ℹ️ Language translations are currently in development. Most content will remain in English.
          </Text>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
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
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionExample: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
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



