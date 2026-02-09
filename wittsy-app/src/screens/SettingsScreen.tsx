import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants'
import { useTheme } from '../hooks/useTheme';;
import { tabletHorizontalPadding } from '../utils/responsive';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ General Settings</Text>
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => navigation.navigate('EnhancedSettings')}
          >
            <Text style={styles.settingButtonText}>🎨 Theme & Appearance</Text>
            <Text style={styles.settingButtonSubtext}>Customize colors and display</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => navigation.navigate('EnhancedSettings')}
          >
            <Text style={styles.settingButtonText}>🔊 Audio & Sound</Text>
            <Text style={styles.settingButtonSubtext}>Volume and sound effects</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => navigation.navigate('EnhancedSettings')}
          >
            <Text style={styles.settingButtonText}>🎮 Gameplay</Text>
            <Text style={styles.settingButtonSubtext}>Game preferences and options</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Admin</Text>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminConsole')}
          >
            <Text style={styles.adminButtonText}>🎯 Season Management</Text>
            <Text style={styles.adminButtonSubtext}>Create and manage competitive seasons</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    padding: 24,
    paddingHorizontal: 24 + tabletHorizontalPadding,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.text
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 24,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  settingButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingButtonSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  adminButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  adminButtonSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

