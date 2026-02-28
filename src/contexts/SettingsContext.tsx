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

const SETTINGS_STORAGE_KEY = '@wittz_settings';

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
      try {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
          updateTheme({ mode: colorScheme === 'dark' ? 'dark' : 'light' });
        });
        return () => {
          try {
            subscription?.remove();
          } catch (error) {
            console.error('Error removing appearance listener:', error);
          }
        };
      } catch (error) {
        console.error('Error adding appearance listener:', error);
      }
    }
  }, [settings.theme.useSystemTheme]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setSettings({ ...DEFAULT_USER_SETTINGS, ...parsed });
      } else {
        // No stored settings, use defaults
        setSettings(DEFAULT_USER_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // On error, use defaults to prevent crash
      setSettings(DEFAULT_USER_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      // Validate settings object before saving
      if (!newSettings || typeof newSettings !== 'object') {
        console.error('Invalid settings object:', newSettings);
        return;
      }
      
      // Update state first (optimistic update)
      setSettings(newSettings);
      
      // Then persist to storage
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      // Don't crash, just log the error
    }
  };

  const updateTheme = async (theme: Partial<ThemeSettings>) => {
    try {
      const newSettings = {
        ...settings,
        theme: { ...settings.theme, ...theme },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const updateAudio = async (audio: Partial<AudioSettings>) => {
    try {
      const newSettings = {
        ...settings,
        audio: { ...settings.audio, ...audio },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating audio:', error);
    }
  };

  const updateGameplay = async (gameplay: Partial<GameplaySettings>) => {
    try {
      const newSettings = {
        ...settings,
        gameplay: { ...settings.gameplay, ...gameplay },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating gameplay:', error);
    }
  };

  const updatePrivacy = async (privacy: Partial<PrivacySettings>) => {
    try {
      const newSettings = {
        ...settings,
        privacy: { ...settings.privacy, ...privacy },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating privacy:', error);
    }
  };

  const updateNotifications = async (notifications: Partial<NotificationSettings>) => {
    try {
      const newSettings = {
        ...settings,
        notifications: { ...settings.notifications, ...notifications },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const updateAccessibility = async (accessibility: Partial<AccessibilitySettings>) => {
    try {
      const newSettings = {
        ...settings,
        accessibility: { ...settings.accessibility, ...accessibility },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating accessibility:', error);
    }
  };

  const updateLanguage = async (language: Partial<LanguageSettings>) => {
    try {
      const newSettings = {
        ...settings,
        language: { ...settings.language, ...language },
        lastUpdated: new Date().toISOString(),
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const resetSettings = async () => {
    try {
      await saveSettings(DEFAULT_USER_SETTINGS);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
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
