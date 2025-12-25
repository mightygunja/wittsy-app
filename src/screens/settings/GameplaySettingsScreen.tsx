/**
 * Gameplay Settings Screen
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/common/Card';
import { SPACING } from '../../utils/constants';

export const GameplaySettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateGameplay } = useSettings();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const gameplayToggles = [
    { key: 'autoSubmit', label: 'Auto Submit', description: 'Automatically submit when time runs out', icon: '⚡' },
    { key: 'confirmBeforeSubmit', label: 'Confirm Before Submit', description: 'Ask for confirmation before submitting', icon: '✅' },
    { key: 'showTimer', label: 'Show Timer', description: 'Display countdown timer', icon: '⏱️' },
    { key: 'showTypingIndicators', label: 'Typing Indicators', description: 'Show when others are typing', icon: '💬' },
    { key: 'autoReadyUp', label: 'Auto Ready Up', description: 'Automatically ready for next round', icon: '🚀' },
    { key: 'quickChatEnabled', label: 'Quick Chat', description: 'Enable quick chat messages', icon: '💬' },
    { key: 'emotesEnabled', label: 'Emotes', description: 'Enable emote reactions', icon: '😊' },
    { key: 'animationsEnabled', label: 'Animations', description: 'Enable UI animations', icon: '✨' },
    { key: 'reducedMotion', label: 'Reduced Motion', description: 'Minimize animations for accessibility', icon: '🎯' },
  ];

  return (
    <LinearGradient colors={COLORS.gradientPrimary as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gameplay</Text>
          <View style={styles.headerRight} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {gameplayToggles.map((toggle) => (
              <Card key={toggle.key} variant="glass" style={styles.toggleCard}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingIcon}>{toggle.icon}</Text>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{toggle.label}</Text>
                    <Text style={styles.settingDescription}>{toggle.description}</Text>
                  </View>
                  <Switch
                    value={settings.gameplay[toggle.key as keyof typeof settings.gameplay] as boolean}
                    onValueChange={(value) => updateGameplay({ [toggle.key]: value })}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={COLORS.text}
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 24, color: COLORS.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerRight: { width: 40 },
  content: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  toggleCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { fontSize: 24, marginRight: SPACING.sm },
  settingInfo: { flex: 1, marginRight: SPACING.sm },
  settingTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  settingDescription: { fontSize: 13, color: COLORS.textSecondary },
});
