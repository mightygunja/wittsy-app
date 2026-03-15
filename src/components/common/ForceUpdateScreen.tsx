/**
 * ForceUpdateScreen
 * Full-screen, non-dismissable blocker shown when the installed app
 * version is below the minimum required version stored in Firestore.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  minimumVersion: string;
  storeUrl: string;
}

export const ForceUpdateScreen: React.FC<Props> = ({ minimumVersion, storeUrl }) => {
  const openStore = () => {
    Linking.openURL(storeUrl).catch(() => {});
  };

  // Auto-open the store as soon as this screen mounts
  useEffect(() => {
    Linking.openURL(storeUrl).catch(() => {});
  }, [storeUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.body}>
          A new version of Wittz is available with improvements and bug fixes.
          You need to update before you can continue playing.
        </Text>
        <Text style={styles.version}>Required version: {minimumVersion}</Text>

        <TouchableOpacity style={styles.button} onPress={openStore} activeOpacity={0.85}>
          <Text style={styles.buttonText}>
            {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Google Play'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6C63FF',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  version: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
  },
});
