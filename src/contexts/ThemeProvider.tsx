/**
 * Theme Provider
 * Wraps the app and provides dynamic theme colors globally
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { COLORS as DEFAULT_COLORS } from '../utils/constants';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  colors: typeof DEFAULT_COLORS;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const systemColorScheme = useColorScheme();

  // Safety check - if settings aren't loaded yet, use defaults
  if (!settings || !settings.theme) {
    return (
      <ThemeContext.Provider value={{ colors: DEFAULT_COLORS, isDark: true }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  // Determine if we should use dark mode
  const isDark = settings.theme.mode === 'dark' || 
    (settings.theme.mode === 'auto' && systemColorScheme === 'dark');

  // Get custom colors
  const primaryColor = settings.theme.primaryColor || DEFAULT_COLORS.primary;
  const accentColor = settings.theme.accentColor || DEFAULT_COLORS.gold;

  // Build dynamic color palette
  const colors = React.useMemo(() => {
    if (isDark) {
      // Dark mode colors
      return {
        ...DEFAULT_COLORS,
        primary: primaryColor,
        gold: accentColor,
        background: '#0A0E1A',
        backgroundLight: '#0F1420',
        backgroundElevated: '#151B2B',
        backgroundPanel: '#1A2035',
        surface: '#1E293B',
        surfaceHover: '#293548',
        surfaceActive: '#334155',
        text: '#F8FAFC',
        textSecondary: '#CBD5E1',
        textTertiary: '#94A3B8',
      };
    } else {
      // Light mode colors
      return {
        ...DEFAULT_COLORS,
        primary: primaryColor,
        gold: accentColor,
        background: '#FFFFFF',
        backgroundLight: '#F8FAFC',
        backgroundElevated: '#F1F5F9',
        backgroundPanel: '#E2E8F0',
        surface: '#FFFFFF',
        surfaceHover: '#F8FAFC',
        surfaceActive: '#F1F5F9',
        surfaceGlass: 'rgba(255, 255, 255, 0.9)',
        surfaceGlassBorder: 'rgba(0, 0, 0, 0.1)',
        text: '#0F172A',
        textSecondary: '#475569',
        textTertiary: '#64748B',
        textMuted: '#94A3B8',
        textDisabled: '#CBD5E1',
        border: '#E2E8F0',
        borderLight: '#F1F5F9',
        divider: 'rgba(0, 0, 0, 0.08)',
        overlay: 'rgba(0, 0, 0, 0.5)',
        modalBackdrop: 'rgba(255, 255, 255, 0.95)',
        gradientPanel: ['#FFFFFF', '#F8FAFC', '#F1F5F9'],
      };
    }
  }, [isDark, primaryColor, accentColor]);

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
