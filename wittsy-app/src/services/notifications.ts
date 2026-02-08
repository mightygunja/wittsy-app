/**
 * Push Notifications Service
 * Handle push notifications, permissions, and scheduling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  PushNotificationData,
  NotificationPermissionStatus,
  PushToken,
  NotificationType,
  NOTIFICATION_TEMPLATES,
} from '../types/platform';
import { shouldSendNotification } from '../utils/settingsIntegration';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { granted } = await this.requestPermissions();
      
      if (granted) {
        // Get push token
        const token = await this.registerForPushNotifications();
        if (token) {
          this.pushToken = token;
          console.log('Push token:', token);
        }
      }

      // Set up listeners
      this.setupListeners();

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      const canAskAgain = finalStatus !== 'denied';

      return {
        granted,
        canAskAgain,
      };
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('⏭️ No EAS projectId found, skipping push token registration');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error: any) {
      console.log('⏭️ Push token registration skipped:', error?.message || error);
      return null;
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle foreground notification
        this.handleForegroundNotification(notification);
      }
    );

    // Listener for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        // Handle notification tap
        this.handleNotificationTap(response);
      }
    );
  }

  /**
   * Handle notification received while app is open
   */
  private handleForegroundNotification(notification: Notifications.Notification) {
    // You can customize behavior here
    // For example, show an in-app banner instead of system notification
  }

  /**
   * Handle user tapping on notification
   */
  private handleNotificationTap(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    // Navigate to appropriate screen based on notification data
    if (data.screen) {
      // This will be handled by deep linking
      console.log('Navigate to:', data.screen, data);
    }
  }

  /**
   * Set up Android notification channel
   */
  private async setupAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Game-specific channels
      await Notifications.setNotificationChannelAsync('game', {
        name: 'Game Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150],
        lightColor: '#FF6584',
        sound: 'default',
      });
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(
    type: NotificationType,
    data: any
  ): Promise<string | null> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      const notificationData = template(data);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound || 'default',
          badge: notificationData.badge,
          priority: this.getPriority(notificationData.priority),
        },
        trigger: null, // Send immediately
      });

      return identifier;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    type: NotificationType,
    data: any,
    trigger: Date | number
  ): Promise<string | null> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      const notificationData = template(data);

      const triggerConfig =
        typeof trigger === 'number'
          ? { seconds: trigger }
          : { date: trigger };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound || 'default',
          badge: notificationData.badge,
          priority: this.getPriority(notificationData.priority),
        },
        trigger: triggerConfig,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Convert priority to platform-specific value
   */
  private getPriority(
    priority?: 'default' | 'high' | 'max'
  ): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export convenience functions
export const notifications = {
  initialize: () => notificationService.initialize(),
  requestPermissions: () => notificationService.requestPermissions(),
  sendLocal: (type: NotificationType, data: any) =>
    notificationService.sendLocalNotification(type, data),
  schedule: (type: NotificationType, data: any, trigger: Date | number) =>
    notificationService.scheduleNotification(type, data, trigger),
  cancel: (id: string) => notificationService.cancelNotification(id),
  cancelAll: () => notificationService.cancelAllNotifications(),
  getBadgeCount: () => notificationService.getBadgeCount(),
  setBadgeCount: (count: number) => notificationService.setBadgeCount(count),
  clearBadge: () => notificationService.clearBadge(),
  getPushToken: () => notificationService.getPushToken(),
  cleanup: () => notificationService.cleanup(),
};
