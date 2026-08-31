/**
 * Settings Context
 * Global settings management with persistence
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticService } from '../services/haptics';
import {
  UserSettings,
  ThemeSettings,
  AudioSettings,
  GameplaySettings,
  PrivacySettings,
  NotificationSettings,
  AccessibilitySettings,
  LanguageSettings,
  DEFAULT_USER_SETTINGS,
} from '../types/settings';

export const SETTINGS_STORAGE_KEY = '@wittz_settings';

interface SettingsContextType {
  settings: UserSettings;
  updateTheme: (theme: Partial<ThemeSettings>) => Promise<void>;
  updateAudio: (audio: Partial<AudioSettings>) => Promise<void>;
  updateGameplay: (gameplay: Partial<GameplaySettings>) => Promise<void>;
  updatePrivacy: (privacy: Partial<PrivacySettings>) => Promise<void>;
  updateNotifications: (notifications: Partial<NotificationSettings>) => Promise<void>;
  updateAccessibility: (accessibility: Partial<AccessibilitySettings>) => Promise<void>;
  updateLanguage: (language: Partial<LanguageSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  // Always holds the latest settings — updates derive from this, never from a
  // stale render closure.
  const settingsRef = useRef<UserSettings>(DEFAULT_USER_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // NOTE: system theme changes are handled by ThemeProvider (mode === 'auto' +
  // useColorScheme). No Appearance listener here — a listener that rewrote
  // theme.mode used to clobber the 'auto' selection with a stale settings copy.

  // Keep the haptic service in sync with the vibration setting
  useEffect(() => {
    hapticService.setEnabled(settings.audio.enableVibration);
  }, [settings.audio.enableVibration]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        settingsRef.current = { ...DEFAULT_USER_SETTINGS, ...parsed };
      } else {
        // No stored settings, use defaults
        settingsRef.current = DEFAULT_USER_SETTINGS;
      }
      setSettings(settingsRef.current);
    } catch (error) {
      console.error('Error loading settings:', error);
      // On error, use defaults to prevent crash
      settingsRef.current = DEFAULT_USER_SETTINGS;
      setSettings(DEFAULT_USER_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  // Functional update: always derives the next settings from the LATEST state
  // (never a stale closure), then persists the result.
  const applySettingsUpdate = async (
    updater: (prev: UserSettings) => UserSettings
  ): Promise<void> => {
    const next = updater(settingsRef.current);
    settingsRef.current = next;
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving settings:', error);
      // Don't crash, just log the error
    }
  };

  const updateSection = <K extends keyof Omit<UserSettings, 'lastUpdated'>>(
    section: K,
    partial: Partial<UserSettings[K]>
  ): Promise<void> =>
    applySettingsUpdate(prev => ({
      ...prev,
      [section]: { ...prev[section], ...partial },
      lastUpdated: new Date().toISOString(),
    }));

  const updateTheme = (theme: Partial<ThemeSettings>) => updateSection('theme', theme);
  const updateAudio = (audio: Partial<AudioSettings>) => updateSection('audio', audio);
  const updateGameplay = (gameplay: Partial<GameplaySettings>) => updateSection('gameplay', gameplay);
  const updatePrivacy = (privacy: Partial<PrivacySettings>) => updateSection('privacy', privacy);
  const updateNotifications = (notifications: Partial<NotificationSettings>) =>
    updateSection('notifications', notifications);
  const updateAccessibility = (accessibility: Partial<AccessibilitySettings>) =>
    updateSection('accessibility', accessibility);
  const updateLanguage = (language: Partial<LanguageSettings>) => updateSection('language', language);

  const resetSettings = () =>
    applySettingsUpdate(() => ({
      ...DEFAULT_USER_SETTINGS,
      lastUpdated: new Date().toISOString(),
    }));

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateTheme,
        updateAudio,
        updateGameplay,
        updatePrivacy,
        updateNotifications,
        updateAccessibility,
        updateLanguage,
        resetSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
