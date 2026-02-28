/**
 * Settings Integration Utilities
 * Centralized logic for applying user settings across the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Settings type (matches SettingsContext structure)
interface Settings {
  theme: any;
  audio: any;
  notifications: {
    pushEnabled: boolean;
    gameInvites: boolean;
    gameUpdates: boolean;
    friendRequests: boolean;
    messages: boolean;
    achievements: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
  };
  gameplay: any;
}

/**
 * Check if notifications should be sent based on user settings
 */
export const shouldSendNotification = async (
  type: 'game' | 'social' | 'achievement' | 'system'
): Promise<boolean> => {
  try {
    const settingsJson = await AsyncStorage.getItem('userSettings');
    if (!settingsJson) return true; // Default to enabled
    
    const settings: Settings = JSON.parse(settingsJson);
    
    // Check if push notifications are enabled
    if (!settings.notifications.pushEnabled) return false;
    
    // Check specific notification type
    switch (type) {
      case 'game':
        return settings.notifications.gameInvites && settings.notifications.gameUpdates;
      case 'social':
        return settings.notifications.friendRequests && settings.notifications.messages;
      case 'achievement':
        return settings.notifications.achievements;
      case 'system':
        return settings.notifications.systemUpdates;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to enabled on error
  }
};

/**
 * Check if user profile should be visible based on privacy settings
 */
export const isProfileVisible = async (userId: string): Promise<boolean> => {
  try {
    const settingsJson = await AsyncStorage.getItem('userSettings');
    if (!settingsJson) return true;
    
    const settings: Settings = JSON.parse(settingsJson);
    
    // Check profile visibility setting
    if (settings.privacy.profileVisibility === 'private') return false;
    if (settings.privacy.profileVisibility === 'public') return true;
    
    // For 'friends' visibility, would need to check friendship status
    // This would require additional logic with user relationships
    return true;
  } catch (error) {
    console.error('Error checking profile visibility:', error);
    return true;
  }
};

/**
 * Check if online status should be shown
 */
export const shouldShowOnlineStatus = async (): Promise<boolean> => {
  try {
    const settingsJson = await AsyncStorage.getItem('userSettings');
    if (!settingsJson) return true;
    
    const settings: Settings = JSON.parse(settingsJson);
    return settings.privacy.showOnlineStatus;
  } catch (error) {
    console.error('Error checking online status setting:', error);
    return true;
  }
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
      console.log('🚫 Blocked user:', userId);
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
    console.log('✅ Unblocked user:', userId);
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
  try {
    const settingsJson = await AsyncStorage.getItem('userSettings');
    if (!settingsJson) return 1.0;
    
    const settings: Settings = JSON.parse(settingsJson);
    
    switch (settings.accessibility.fontSize) {
      case 'small': return 0.85;
      case 'medium': return 1.0;
      case 'large': return 1.15;
      case 'extra-large': return 1.3;
      default: return 1.0;
    }
  } catch (error) {
    console.error('Error getting font scale:', error);
    return 1.0;
  }
};

/**
 * Check if high contrast mode is enabled
 */
export const isHighContrastEnabled = async (): Promise<boolean> => {
  try {
    const settingsJson = await AsyncStorage.getItem('userSettings');
    if (!settingsJson) return false;
    
    const settings: Settings = JSON.parse(settingsJson);
    return settings.accessibility.highContrast;
  } catch (error) {
    console.error('Error checking high contrast:', error);
    return false;
  }
};
