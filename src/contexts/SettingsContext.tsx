/**
 * Settings Context
 * Global settings management with persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
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

const SETTINGS_STORAGE_KEY = '@wittsy_settings';

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

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (settings.theme.useSystemTheme) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        updateTheme({ mode: colorScheme === 'dark' ? 'dark' : 'light' });
      });
      return () => subscription.remove();
    }
  }, [settings.theme.useSystemTheme]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_USER_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateTheme = async (theme: Partial<ThemeSettings>) => {
    const newSettings = {
      ...settings,
      theme: { ...settings.theme, ...theme },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const updateAudio = async (audio: Partial<AudioSettings>) => {
    const newSettings = {
      ...settings,
      audio: { ...settings.audio, ...audio },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const updateGameplay = async (gameplay: Partial<GameplaySettings>) => {
    const newSettings = {
      ...settings,
      gameplay: { ...settings.gameplay, ...gameplay },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const updatePrivacy = async (privacy: Partial<PrivacySettings>) => {
    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, ...privacy },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const updateNotifications = async (notifications: Partial<NotificationSettings>) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...notifications },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const updateAccessibility = async (accessibility: Partial<AccessibilitySettings>) => {
    const newSettings = {
      ...settings,
      accessibility: { ...settings.accessibility, ...accessibility },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const updateLanguage = async (language: Partial<LanguageSettings>) => {
    const newSettings = {
      ...settings,
      language: { ...settings.language, ...language },
      lastUpdated: new Date().toISOString(),
    };
    await saveSettings(newSettings);
  };

  const resetSettings = async () => {
    await saveSettings(DEFAULT_USER_SETTINGS);
  };

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
