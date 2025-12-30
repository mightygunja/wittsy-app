/**
 * Audio Settings Screen
 * Volume controls, sound effects, music, vibration
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
// Slider removed - using +/- buttons instead
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/common/Card';
import { SPACING } from '../../utils/constants';
import { audioService } from '../../services/audioService';

export const AudioSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateAudio } = useSettings();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS, SPACING), [COLORS]);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    updateAudio({ [key]: value });
    
    // Update audio service
    if (key === 'enableMusic') {
      await audioService.setMusicEnabled(value);
    } else if (key === 'enableSFX') {
      await audioService.setSFXEnabled(value);
    }
    
    // Play click sound for feedback
    audioService.playClick();
  };

  const handleVolumeChange = async (key: string, delta: number) => {
    const currentVolume = settings.audio[key] || 50;
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
    updateAudio({ [key]: newVolume });
    
    // Update audio service volumes (convert 0-100 to 0-1)
    if (key === 'musicVolume') {
      await audioService.setMusicVolume(newVolume / 100);
    } else if (key === 'sfxVolume') {
      await audioService.setSFXVolume(newVolume / 100);
    }
    
    // Play click sound for feedback
    audioService.playClick();
  };

  const volumeSettings = [
    { key: 'masterVolume', label: 'Master Volume', icon: '🔊' },
    { key: 'musicVolume', label: 'Music', icon: '🎵' },
    { key: 'sfxVolume', label: 'Sound Effects', icon: '🔔' },
    { key: 'voiceVolume', label: 'Voice Chat', icon: '🎤' },
  ];

  const toggleSettings = [
    { key: 'enableMusic', label: 'Enable Music', description: 'Background music during gameplay' },
    { key: 'enableSFX', label: 'Enable Sound Effects', description: 'Button clicks, notifications' },
    { key: 'enableVoice', label: 'Enable Voice Chat', description: 'In-game voice communication' },
    { key: 'enableVibration', label: 'Enable Vibration', description: 'Haptic feedback' },
  ];

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Audio & Sound</Text>
          <View style={styles.headerRight} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Mute All */}
            <Card variant="glass" style={styles.muteCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>🔇 Mute All</Text>
                  <Text style={styles.settingDescription}>Disable all sounds</Text>
                </View>
                <Switch
                  value={settings.audio.muteAll}
                  onValueChange={(value) => updateAudio({ muteAll: value })}
                  trackColor={{ false: COLORS.border, true: COLORS.error }}
                  thumbColor={COLORS.text}
                />
              </View>
            </Card>

            {/* Volume Sliders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Volume Levels</Text>
              {volumeSettings.map((setting) => (
                <Card key={setting.key} variant="elevated" style={styles.volumeCard}>
                  <View style={styles.volumeHeader}>
                    <Text style={styles.volumeIcon}>{setting.icon}</Text>
                    <Text style={styles.volumeLabel}>{setting.label}</Text>
                    <View style={styles.volumeControls}>
                      <TouchableOpacity
                        style={styles.volumeButton}
                        onPress={() => handleVolumeChange(setting.key, -10)}
                        disabled={settings.audio.muteAll}
                      >
                        <Text style={styles.volumeButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.volumeValue}>
                        {settings.audio[setting.key as keyof typeof settings.audio]}%
                      </Text>
                      <TouchableOpacity
                        style={styles.volumeButton}
                        onPress={() => handleVolumeChange(setting.key, 10)}
                        disabled={settings.audio.muteAll}
                      >
                        <Text style={styles.volumeButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            {/* Audio Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audio Options</Text>
              {toggleSettings.map((setting) => (
                <Card key={setting.key} variant="glass" style={styles.toggleCard}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>{setting.label}</Text>
                      <Text style={styles.settingDescription}>{setting.description}</Text>
                    </View>
                    <Switch
                      value={settings.audio[setting.key as keyof typeof settings.audio] as boolean}
                      onValueChange={(value) => handleToggle(setting.key, value)}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.text}
                      disabled={settings.audio.muteAll}
                    />
                  </View>
                </Card>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any, SPACING: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  backButtonText: { fontSize: 24, color: COLORS.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerRight: { width: 40 },
  content: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  muteCard: { padding: SPACING.md, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  volumeCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  volumeHeader: { flexDirection: 'row', alignItems: 'center' },
  volumeIcon: { fontSize: 20, marginRight: SPACING.xs },
  volumeLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  volumeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  volumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeButtonText: { fontSize: 24, color: COLORS.text, fontWeight: 'bold' },
  volumeValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, minWidth: 50, textAlign: 'center' },
  toggleCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, marginRight: SPACING.sm },
  settingTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  settingDescription: { fontSize: 13, color: COLORS.textSecondary },
});
