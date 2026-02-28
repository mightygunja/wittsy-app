/**
 * Audio Settings Screen
 * Volume controls, sound effects, music, vibration
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { BackButton } from '../../components/common/BackButton';
import { SPACING } from '../../utils/constants';
import { createSettingsStyles } from '../../styles/settingsStyles';
import { audioService } from '../../services/audioService';

export const AudioSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateAudio } = useSettings();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createSettingsStyles(COLORS, SPACING), [COLORS]);

  const handleToggle = async (key: string, value: boolean) => {
    updateAudio({ [key]: value });
    
    if (key === 'enableMusic') {
      await audioService.setMusicEnabled(value);
    } else if (key === 'enableSFX') {
      await audioService.setSFXEnabled(value);
    }
    
    audioService.playClick();
  };

  const handleVolumeChange = async (key: string, delta: number) => {
    const currentVolume = settings.audio[key] || 50;
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
    updateAudio({ [key]: newVolume });
    
    if (key === 'musicVolume') {
      await audioService.setMusicVolume(newVolume / 100);
    } else if (key === 'sfxVolume') {
      await audioService.setSFXVolume(newVolume / 100);
    }
    
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Audio & Sound</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Mute All */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Controls</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>🔇 Mute All</Text>
                <Text style={styles.settingDescription}>Disable all sounds</Text>
              </View>
              <Switch
                value={settings.audio.muteAll}
                onValueChange={(value) => updateAudio({ muteAll: value })}
                trackColor={{ false: COLORS.border, true: COLORS.error }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Volume Sliders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume Levels</Text>
          {volumeSettings.map((setting) => (
            <View key={setting.key} style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{setting.icon} {setting.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => handleVolumeChange(setting.key, -10)}
                    disabled={settings.audio.muteAll}
                  >
                    <Text style={{ fontSize: 24, color: COLORS.text, fontWeight: 'bold' }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.primary, minWidth: 50, textAlign: 'center' }}>
                    {settings.audio[setting.key as keyof typeof settings.audio]}%
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => handleVolumeChange(setting.key, 10)}
                    disabled={settings.audio.muteAll}
                  >
                    <Text style={{ fontSize: 24, color: COLORS.text, fontWeight: 'bold' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Audio Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Options</Text>
          {toggleSettings.map((setting) => (
            <View key={setting.key} style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={settings.audio[setting.key as keyof typeof settings.audio] as boolean}
                  onValueChange={(value) => handleToggle(setting.key, value)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
                  disabled={settings.audio.muteAll}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
