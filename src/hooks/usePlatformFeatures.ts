/**
 * Platform Features Hook
 * Unified hook for haptics, notifications, and deep linking
 */

import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { haptics } from '../services/haptics';
import { notifications } from '../services/notifications';
import { deepLinking } from '../services/deepLinking';
import { useSettings } from '../contexts/SettingsContext';
import { NotificationType } from '../types/platform';

export const usePlatformFeatures = () => {
  const { settings } = useSettings();

  // Initialize on mount
  useEffect(() => {
    initializePlatformFeatures();
  }, []);

  // Sync haptics with settings
  useEffect(() => {
    haptics.setEnabled(settings.audio.enableVibration);
  }, [settings.audio.enableVibration]);

  const initializePlatformFeatures = async () => {
    // Initialize notifications if enabled
    if (settings.notifications.enabled) {
      await notifications.initialize();
    }
  };

  // Haptic feedback methods
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
      if (settings.audio.enableVibration) {
        haptics[type]();
      }
    },
    [settings.audio.enableVibration]
  );

  // Notification methods
  const sendNotification = useCallback(
    async (type: NotificationType, data: any) => {
      if (settings.notifications.enabled) {
        return await notifications.sendLocal(type, data);
      }
      return null;
    },
    [settings.notifications.enabled]
  );

  const scheduleNotification = useCallback(
    async (type: NotificationType, data: any, trigger: Date | number) => {
      if (settings.notifications.enabled) {
        return await notifications.schedule(type, data, trigger);
      }
      return null;
    },
    [settings.notifications.enabled]
  );

  return {
    // Platform info
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWeb: Platform.OS === 'web',
    
    // Haptics
    haptics: {
      light: () => triggerHaptic('light'),
      medium: () => triggerHaptic('medium'),
      heavy: () => triggerHaptic('heavy'),
      success: () => triggerHaptic('success'),
      warning: () => triggerHaptic('warning'),
      error: () => triggerHaptic('error'),
      buttonPress: haptics.buttonPress,
      cardFlip: haptics.cardFlip,
      voteCast: haptics.voteCast,
      roundWin: haptics.roundWin,
      gameWin: haptics.gameWin,
      achievementUnlocked: haptics.achievementUnlocked,
      levelUp: haptics.levelUp,
      timerWarning: haptics.timerWarning,
      timerExpired: haptics.timerExpired,
      matchFound: haptics.matchFound,
      friendRequest: haptics.friendRequest,
      messageReceived: haptics.messageReceived,
    },
    
    // Notifications
    notifications: {
      send: sendNotification,
      schedule: scheduleNotification,
      cancel: notifications.cancel,
      cancelAll: notifications.cancelAll,
      getBadgeCount: notifications.getBadgeCount,
      setBadgeCount: notifications.setBadgeCount,
      clearBadge: notifications.clearBadge,
      requestPermissions: notifications.requestPermissions,
    },
    
    // Deep linking
    deepLinking: {
      shareGameRoom: deepLinking.shareGameRoom,
      shareProfile: deepLinking.shareProfile,
      shareEvent: deepLinking.shareEvent,
      openURL: deepLinking.openURL,
    },
  };
};
