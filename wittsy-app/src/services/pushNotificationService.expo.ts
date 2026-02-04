/**
 * Push Notification Service (Expo Notifications)
 * Handles push notifications using expo-notifications instead of React Native Firebase
 */

import * as Notifications from 'expo-notifications';
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

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }
    
    console.log('✅ Notification permission granted');
    return true;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * Get Expo Push Token for this device
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get Expo push token:', error);
    return null;
  }
};

/**
 * Save push token to user's profile
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
      platform: Platform.OS,
    });
    console.log('✅ Push token saved to user profile');
  } catch (error) {
    console.error('Failed to save push token:', error);
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

    // Get push token
    const token = await getFCMToken();
    if (token) {
      await saveFCMToken(userId, token);
    }

    // Handle notifications received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Foreground notification:', notification);
      handleForegroundNotification(notification);
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      handleNotificationPress(response.notification);
    });

    console.log('✅ Push notifications initialized');
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
};

/**
 * Handle foreground notification
 */
const handleForegroundNotification = (notification: Notifications.Notification): void => {
  const { title, body, data } = notification.request.content;
  
  // Track analytics
  analytics.logEvent('notification_received_foreground', {
    type: data?.type || 'unknown',
  });
};

/**
 * Handle notification press
 */
const handleNotificationPress = (notification: Notifications.Notification): void => {
  const { data } = notification.request.content;
  
  if (!data) return;

  // Track analytics
  analytics.logEvent('notification_opened', {
    type: data.type || 'unknown',
  });

  // Navigation would be handled here
};

/**
 * Send notification to specific user
 */
export const sendNotificationToUser = async (
  userId: string,
  notification: NotificationPayload
): Promise<void> => {
  try {
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
 * Schedule local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerTime: Date,
  data?: Record<string, any>
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: triggerTime,
    });
    console.log('Local notification scheduled:', { title, body, triggerTime });
  } catch (error) {
    console.error('Failed to schedule local notification:', error);
  }
};

// Notification template functions remain the same
export const notifyFriendRequest = async (toUserId: string, fromUsername: string): Promise<void> => {
  await sendNotificationToUser(toUserId, {
    type: 'friend_request',
    title: '👋 New Friend Request',
    body: `${fromUsername} wants to be your friend!`,
    data: { fromUsername },
  });
};

export const notifyFriendAccepted = async (toUserId: string, acceptedByUsername: string): Promise<void> => {
  await sendNotificationToUser(toUserId, {
    type: 'friend_accepted',
    title: '🎉 Friend Request Accepted',
    body: `${acceptedByUsername} accepted your friend request!`,
    data: { acceptedByUsername },
  });
};

export const notifyGameInvite = async (toUserId: string, fromUsername: string, roomId: string): Promise<void> => {
  await sendNotificationToUser(toUserId, {
    type: 'game_invite',
    title: '🎮 Game Invite',
    body: `${fromUsername} invited you to play!`,
    data: { fromUsername, roomId },
  });
};

export const notifyChallengeCompleted = async (userId: string, challengeName: string, reward: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'challenge_completed',
    title: '✅ Challenge Completed!',
    body: `You completed "${challengeName}"! Reward: ${reward}`,
    data: { challengeName, reward },
  });
};

export const notifyChallengeExpiring = async (userId: string, challengeName: string, hoursRemaining: number): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'challenge_expiring',
    title: '⏰ Challenge Expiring Soon',
    body: `"${challengeName}" expires in ${hoursRemaining} hours!`,
    data: { challengeName, hoursRemaining },
  });
};

export const notifyEventStarting = async (userId: string, eventName: string, eventId: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'event_starting',
    title: '🎪 Event Starting!',
    body: `${eventName} is starting now!`,
    data: { eventName, eventId },
  });
};

export const notifyEventRegistered = async (userId: string, eventName: string, eventId: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'event_registered',
    title: '✅ Event Registration Confirmed',
    body: `You're registered for ${eventName}!`,
    data: { eventName, eventId },
  });
};

export const notifyEventReward = async (userId: string, eventName: string, placement: number, reward: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'event_reward',
    title: '🏆 Event Rewards!',
    body: `You placed ${placement} in ${eventName}! ${reward}`,
    data: { eventName, placement, reward },
  });
};

export const notifyAchievementUnlocked = async (userId: string, achievementName: string, reward: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'achievement_unlocked',
    title: '🏅 Achievement Unlocked!',
    body: `${achievementName} - ${reward}`,
    data: { achievementName, reward },
  });
};

export const notifyBattlePassLevelUp = async (userId: string, newLevel: number): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'battle_pass_level_up',
    title: '⭐ Battle Pass Level Up!',
    body: `You reached level ${newLevel}! Claim your rewards!`,
    data: { newLevel },
  });
};

export const notifyBattlePassReward = async (userId: string, rewardName: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'battle_pass_reward',
    title: '🎁 New Battle Pass Reward!',
    body: `You unlocked: ${rewardName}`,
    data: { rewardName },
  });
};

export const notifyLeaderboardRankChange = async (userId: string, oldRank: number, newRank: number): Promise<void> => {
  const isImprovement = newRank < oldRank;
  await sendNotificationToUser(userId, {
    type: 'leaderboard_rank_change',
    title: isImprovement ? '📈 Rank Up!' : '📉 Rank Change',
    body: `Your rank changed from #${oldRank} to #${newRank}`,
    data: { oldRank, newRank },
  });
};

export const notifyRoomReady = async (userId: string, roomName: string, roomId: string): Promise<void> => {
  await sendNotificationToUser(userId, {
    type: 'room_ready',
    title: '🎮 Game Starting!',
    body: `${roomName} is ready to start!`,
    data: { roomName, roomId },
  });
};
