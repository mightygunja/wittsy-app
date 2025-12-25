/**
 * Dynamic Theme Hook
 * Provides theme colors from ThemeContext
 */

import { useThemeContext } from '../contexts/ThemeProvider';

export const useTheme = () => {
  return useThemeContext();
};
