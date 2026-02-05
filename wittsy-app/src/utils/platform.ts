/**
 * Platform Detection Utilities
 * Detect if running on Expo Go vs native build
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Check if the app is running in Expo Go
 * Expo Go doesn't support certain native modules like Google Sign-In
 */
export const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Check if the app is running as a standalone build (TestFlight, App Store, etc.)
 */
export const isStandaloneBuild = (): boolean => {
  return Constants.appOwnership === 'standalone' || Constants.appOwnership === null;
};

/**
 * Check if Google Sign-In is available
 * Only available in standalone builds, not in Expo Go
 */
export const isGoogleSignInAvailable = (): boolean => {
  return !isExpoGo();
};

/**
 * Check if Apple Sign-In is available
 * Only available on iOS standalone builds, not in Expo Go
 */
export const isAppleSignInAvailable = (): boolean => {
  return !isExpoGo() && Platform.OS === 'ios';
};

/**
 * Check if In-App Purchases are available
 * Only available in standalone builds, not in Expo Go
 */
export const isIAPAvailable = (): boolean => {
  return !isExpoGo();
};

/**
 * Check if Store Review is available
 * Only available in standalone builds, not in Expo Go
 */
export const isStoreReviewAvailable = (): boolean => {
  return !isExpoGo();
};

/**
 * Get app environment name for debugging
 */
export const getAppEnvironment = (): string => {
  if (isExpoGo()) return 'Expo Go';
  if (isStandaloneBuild()) return 'Standalone';
  return 'Development';
};
