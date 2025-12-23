import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/constants';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
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

        <Text style={styles.subtitle}>More settings coming soon...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    padding: 24,
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
