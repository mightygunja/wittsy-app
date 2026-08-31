/**
 * Settings Integration Utilities
 * Centralized logic for applying user settings across the app
 *
 * Reads the same AsyncStorage key that SettingsContext persists to
 * (a previous version read a non-existent 'userSettings' key, so every
 * helper silently fell back to defaults).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_STORAGE_KEY } from '../contexts/SettingsContext';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types/settings';

const readSettings = async (): Promise<UserSettings | null> => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!settingsJson) return null;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(settingsJson) };
  } catch (error) {
    console.error('Error reading settings:', error);
    return null;
  }
};

/**
 * Check if notifications should be sent based on user settings
 */
export const shouldSendNotification = async (
  type: 'game' | 'social' | 'achievement' | 'system'
): Promise<boolean> => {
  const settings = await readSettings();
  if (!settings) return true; // Default to enabled

  const n = settings.notifications;
  if (!n.enabled || !n.pushEnabled) return false;

  switch (type) {
    case 'game':
      return n.gameInvites;
    case 'social':
      return n.friendRequests || n.chatMessages;
    case 'achievement':
      return n.achievementUnlocked;
    case 'system':
      return true;
    default:
      return true;
  }
};

/**
 * Check if user profile should be visible based on privacy settings
 */
export const isProfileVisible = async (_userId: string): Promise<boolean> => {
  const settings = await readSettings();
  if (!settings) return true;

  // Check profile visibility setting
  if (settings.privacy.profileVisibility === 'private') return false;
  if (settings.privacy.profileVisibility === 'public') return true;

  // For 'friends' visibility, would need to check friendship status
  // This would require additional logic with user relationships
  return true;
};

/**
 * Check if online status should be shown
 */
export const shouldShowOnlineStatus = async (): Promise<boolean> => {
  const settings = await readSettings();
  if (!settings) return true;
  return settings.privacy.showOnlineStatus;
};

/**
 * Check if user is blocked
 */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const blockedUsersJson = await AsyncStorage.getItem('blockedUsers');
    if (!blockedUsersJson) return false;

    const blockedUsers: string[] = JSON.parse(blockedUsersJson);
    return blockedUsers.includes(userId);
  } catch (error) {
    console.error('Error checking blocked users:', error);
    return false;
  }
};

/**
 * Block a user
 */
export const blockUser = async (userId: string): Promise<void> => {
  try {
    const blockedUsersJson = await AsyncStorage.getItem('blockedUsers');
    const blockedUsers: string[] = blockedUsersJson ? JSON.parse(blockedUsersJson) : [];

    if (!blockedUsers.includes(userId)) {
      blockedUsers.push(userId);
      await AsyncStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: string): Promise<void> => {
  try {
    const blockedUsersJson = await AsyncStorage.getItem('blockedUsers');
    if (!blockedUsersJson) return;

    const blockedUsers: string[] = JSON.parse(blockedUsersJson);
    const filtered = blockedUsers.filter(id => id !== userId);

    await AsyncStorage.setItem('blockedUsers', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

/**
 * Get all blocked users
 */
export const getBlockedUsers = async (): Promise<string[]> => {
  try {
    const blockedUsersJson = await AsyncStorage.getItem('blockedUsers');
    return blockedUsersJson ? JSON.parse(blockedUsersJson) : [];
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
};

/**
 * Get font scale based on accessibility settings
 */
export const getFontScale = async (): Promise<number> => {
  const settings = await readSettings();
  if (!settings) return 1.0;

  switch (settings.accessibility.fontSize) {
    case 'small': return 0.85;
    case 'medium': return 1.0;
    case 'large': return 1.15;
    case 'xlarge': return 1.3;
    default: return 1.0;
  }
};

/**
 * Check if high contrast mode is enabled
 */
export const isHighContrastEnabled = async (): Promise<boolean> => {
  const settings = await readSettings();
  if (!settings) return false;
  return settings.accessibility.highContrast;
};
