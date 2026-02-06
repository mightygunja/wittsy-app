import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';

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
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const handleLanguageChange = async (languageCode: string) => {
    await updateLanguage({ language: languageCode });
  };

  const handleDateFormatChange = async (format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => {
    await updateLanguage({ dateFormat: format });
  };

  const handleTimeFormatChange = async (format: '12h' | '24h') => {
    await updateLanguage({ timeFormat: format });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Language & Region</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>

          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.optionCard,
                settings.language.language === lang.code && styles.optionSelected,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={styles.optionIcon}>{lang.flag}</Text>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{lang.name}</Text>
              </View>
              {settings.language.language === lang.code && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Format</Text>

          {DATE_FORMATS.map((format) => (
            <TouchableOpacity
              key={format.value}
              style={[
                styles.optionCard,
                settings.language.dateFormat === format.value && styles.optionSelected,
              ]}
              onPress={() => handleDateFormatChange(format.value as any)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{format.label}</Text>
                <Text style={styles.optionDescription}>{format.example}</Text>
              </View>
              {settings.language.dateFormat === format.value && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Format</Text>

          {TIME_FORMATS.map((format) => (
            <TouchableOpacity
              key={format.value}
              style={[
                styles.optionCard,
                settings.language.timeFormat === format.value && styles.optionSelected,
              ]}
              onPress={() => handleTimeFormatChange(format.value as any)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{format.label}</Text>
              </View>
              {settings.language.timeFormat === format.value && (
                <Text style={styles.optionCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
