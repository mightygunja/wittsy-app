/**
 * Push Notification Service
 * Handles push notifications for events, challenges, friends, etc.
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'challenge_completed'
  | 'challenge_expiring'
  | 'event_starting'
  | 'event_registered'
  | 'event_reward'
  | 'achievement_unlocked'
  | 'battle_pass_level_up'
  | 'battle_pass_reward'
  | 'leaderboard_rank_change'
  | 'room_ready'
  | 'message_received';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token for this device
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};

/**
 * Save FCM token to user's profile
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date().toISOString(),
      platform: Platform.OS,
    });
    console.log('✅ FCM token saved to user profile');
  } catch (error) {
    console.error('Failed to save FCM token:', error);
  }
};

/**
 * Initialize push notifications
 */
export const initializePushNotifications = async (userId: string): Promise<void> => {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('User denied notification permission');
      return;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (token) {
      await saveFCMToken(userId, token);
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed:', newToken);
      await saveFCMToken(userId, newToken);
    });

    // Handle foreground notifications
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage);
      handleForegroundNotification(remoteMessage);
    });

    // Handle background/quit state notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification:', remoteMessage);
      // Process notification in background
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      handleNotificationPress(remoteMessage);
    });

    // Check if app was opened from a notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('App opened from notification:', initialNotification);
      handleNotificationPress(initialNotification);
    }

    console.log('✅ Push notifications initialized');
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
};

/**
 * Handle foreground notification (show alert)
 */
const handleForegroundNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage): void => {
  const { notification, data } = remoteMessage;
  
  if (notification) {
    Alert.alert(
      notification.title || 'Notification',
      notification.body || '',
      [
        { text: 'Dismiss', style: 'cancel' },
        {
          text: 'View',
          onPress: () => handleNotificationPress(remoteMessage),
        },
      ]
    );
  }

  // Track analytics
  analytics.logEvent('notification_received_foreground', {
    type: data?.type || 'unknown',
  });
};

/**
 * Handle notification press (navigate to appropriate screen)
 */
const handleNotificationPress = (remoteMessage: FirebaseMessagingTypes.RemoteMessage): void => {
  const { data } = remoteMessage;
  
  if (!data) return;

  // Track analytics
  analytics.logEvent('notification_opened', {
    type: data.type || 'unknown',
  });

  // Navigate based on notification type
  // This would need to be integrated with your navigation system
  switch (data.type) {
    case 'friend_request':
      // Navigate to friends screen
      break;
    case 'game_invite':
      // Navigate to game room
      break;
    case 'challenge_completed':
      // Navigate to challenges screen
      break;
    case 'event_starting':
      // Navigate to events screen
      break;
    case 'achievement_unlocked':
      // Navigate to profile/achievements
      break;
    case 'battle_pass_level_up':
      // Navigate to Battle Pass
      break;
    default:
      // Navigate to home or notifications
      break;
  }
};

/**
 * Send notification to specific user (server-side function)
 * This should be called from Firebase Cloud Functions
 */
export const sendNotificationToUser = async (
  userId: string,
  notification: NotificationPayload
): Promise<void> => {
  try {
    // Create notification in Firestore
    await addDoc(collection(firestore, 'notifications'), {
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.body,
      data: notification.data || {},
      read: false,
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Notification created for user:', userId);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

/**
 * Schedule local notification (for reminders, etc.)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerTime: Date,
  data?: Record<string, any>
): Promise<void> => {
  try {
    // This would use a local notification library like @notifee/react-native
    // For now, just log
    console.log('Local notification scheduled:', { title, body, triggerTime });
  } catch (error) {
    console.error('Failed to schedule local notification:', error);
  }
};

// ==================== NOTIFICATION TEMPLATES ====================

/**
 * Send friend request notification
 */
export const notifyFriendRequest = async (
  toUserId: string,
  fromUsername: string
): Promise<void> => {
  await sendNotificationToUser(toUserId, {
    type: 'friend_request',
    title: '👋 New Friend Request',
    body: `${fromUsername} wants to be your friend!`,
    data: { fromUsername },
  });
};

/**
 * Send friend accepted notification
 */
export const notifyFriendAccepted = async (
  toUserId: string,
  acceptedByUsername: string
): Promise<void> => {
  await sendNotificationToUser(toUserId, {
    type: 'friend_accepted',
    title: '🎉 Friend Request Accepted',
    body: `${acceptedByUsername} accepted your friend request!`,
    data: { acceptedByUsername },
  });
};

/**
 * Send game invite notification
 */
export const notifyGameInvite = async (
  toUserId: string,
  fromUsername: string,
  roomId: string
): Promise<void> => {
  await sendNotificationToUser(toUserId, {
    type: 'game_invite',
    title: '🎮 Game Invite',
    body: `${fromUsername} invited you to play!`,
    data: { fromUsername, roomId },
  });
};

/**
 * Send challenge completed notification
 */
export const notifyChallengeCompleted = async (
  userId: string,
  challengeName: string,
  reward: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'challenge_completed',
    title: '✅ Challenge Completed!',
    body: `You completed "${challengeName}"! Reward: ${reward}`,
    data: { challengeName, reward },
  });
};

/**
 * Send challenge expiring notification
 */
export const notifyChallengeExpiring = async (
  userId: string,
  challengeName: string,
  hoursRemaining: number
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'challenge_expiring',
    title: '⏰ Challenge Expiring Soon',
    body: `"${challengeName}" expires in ${hoursRemaining} hours!`,
    data: { challengeName, hoursRemaining },
  });
};

/**
 * Send event starting notification
 */
export const notifyEventStarting = async (
  userId: string,
  eventName: string,
  eventId: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'event_starting',
    title: '🎪 Event Starting!',
    body: `${eventName} is starting now!`,
    data: { eventName, eventId },
  });
};

/**
 * Send event registered notification
 */
export const notifyEventRegistered = async (
  userId: string,
  eventName: string,
  eventId: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'event_registered',
    title: '✅ Event Registration Confirmed',
    body: `You're registered for ${eventName}!`,
    data: { eventName, eventId },
  });
};

/**
 * Send event reward notification
 */
export const notifyEventReward = async (
  userId: string,
  eventName: string,
  placement: number,
  reward: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'event_reward',
    title: '🏆 Event Rewards!',
    body: `You placed ${placement} in ${eventName}! ${reward}`,
    data: { eventName, placement, reward },
  });
};

/**
 * Send achievement unlocked notification
 */
export const notifyAchievementUnlocked = async (
  userId: string,
  achievementName: string,
  reward: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'achievement_unlocked',
    title: '🏅 Achievement Unlocked!',
    body: `${achievementName} - ${reward}`,
    data: { achievementName, reward },
  });
};

/**
 * Send Battle Pass level up notification
 */
export const notifyBattlePassLevelUp = async (
  userId: string,
  newLevel: number
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'battle_pass_level_up',
    title: '⭐ Battle Pass Level Up!',
    body: `You reached level ${newLevel}! Claim your rewards!`,
    data: { newLevel },
  });
};

/**
 * Send Battle Pass reward notification
 */
export const notifyBattlePassReward = async (
  userId: string,
  rewardName: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'battle_pass_reward',
    title: '🎁 New Battle Pass Reward!',
    body: `You unlocked: ${rewardName}`,
    data: { rewardName },
  });
};

/**
 * Send leaderboard rank change notification
 */
export const notifyLeaderboardRankChange = async (
  userId: string,
  oldRank: number,
  newRank: number
): Promise<void> => {
  const isImprovement = newRank < oldRank;
  await sendNotificationToUser(userId, {
    type: 'leaderboard_rank_change',
    title: isImprovement ? '📈 Rank Up!' : '📉 Rank Change',
    body: `Your rank changed from #${oldRank} to #${newRank}`,
    data: { oldRank, newRank },
  });
};

/**
 * Send room ready notification
 */
export const notifyRoomReady = async (
  userId: string,
  roomName: string,
  roomId: string
): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'room_ready',
    title: '🎮 Game Starting!',
    body: `${roomName} is ready to start!`,
    data: { roomName, roomId },
  });
};
