/**
 * Platform-Specific Features Types
 * Push notifications, haptic feedback, deep linking
 */

// ==================== PUSH NOTIFICATIONS ====================

export type NotificationType =
  | 'friend_request'
  | 'game_invite'
  | 'chat_message'
  | 'challenge_complete'
  | 'event_reminder'
  | 'tournament_start'
  | 'achievement_unlocked'
  | 'level_up'
  | 'daily_reminder'
  | 'match_found'
  | 'turn_reminder';

export interface PushNotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    userId?: string;
    roomId?: string;
    friendId?: string;
    challengeId?: string;
    eventId?: string;
    achievementId?: string;
    screen?: string;
    [key: string]: any;
  };
  badge?: number;
  sound?: string;
  priority?: 'default' | 'high' | 'max';
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: number;
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
  android?: {
    importance: number;
  };
}

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
  platform: 'ios' | 'android' | 'web';
}

// ==================== HAPTIC FEEDBACK ====================

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

export interface HapticOptions {
  enableVibrateFallback?: boolean;
  ignoreAndroidSystemSettings?: boolean;
}

// ==================== DEEP LINKING ====================

export type DeepLinkScreen =
  | 'Home'
  | 'GameRoom'
  | 'Profile'
  | 'Friends'
  | 'Challenges'
  | 'Events'
  | 'Leaderboard'
  | 'Settings'
  | 'PromptLibrary';

export interface DeepLinkConfig {
  screen: DeepLinkScreen;
  params?: {
    roomId?: string;
    userId?: string;
    eventId?: string;
    challengeId?: string;
    [key: string]: any;
  };
}

export interface DeepLinkURL {
  url: string;
  scheme: string;
  hostname: string;
  path: string;
  queryParams: { [key: string]: string };
}

// ==================== PLATFORM DETECTION ====================

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  version: string;
  model?: string;
  manufacturer?: string;
}

// ==================== KEYBOARD SHORTCUTS (WEB) ====================

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description: string;
  category: 'navigation' | 'game' | 'social' | 'settings';
}

// ==================== PWA FEATURES ====================

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  icons: {
    src: string;
    sizes: string;
    type: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
  }[];
}

// ==================== NOTIFICATION TEMPLATES ====================

export const NOTIFICATION_TEMPLATES: Record<NotificationType, (data: any) => PushNotificationData> = {
  friend_request: (data) => ({
    type: 'friend_request',
    title: '👋 New Friend Request',
    body: `${data.username} wants to be your friend!`,
    data: { userId: data.userId, screen: 'Friends' },
    sound: 'default',
    priority: 'high',
  }),
  
  game_invite: (data) => ({
    type: 'game_invite',
    title: '🎮 Game Invite',
    body: `${data.username} invited you to play!`,
    data: { roomId: data.roomId, screen: 'GameRoom' },
    sound: 'default',
    priority: 'high',
  }),
  
  chat_message: (data) => ({
    type: 'chat_message',
    title: `💬 ${data.username}`,
    body: data.message,
    data: { roomId: data.roomId, screen: 'GameRoom' },
    sound: 'default',
    priority: 'default',
  }),
  
  challenge_complete: (data) => ({
    type: 'challenge_complete',
    title: '🎯 Challenge Complete!',
    body: `You completed "${data.challengeName}"! Claim your reward.`,
    data: { challengeId: data.challengeId, screen: 'Challenges' },
    sound: 'default',
    priority: 'default',
  }),
  
  event_reminder: (data) => ({
    type: 'event_reminder',
    title: '🏆 Event Starting Soon',
    body: `${data.eventName} starts in ${data.timeRemaining}!`,
    data: { eventId: data.eventId, screen: 'Events' },
    sound: 'default',
    priority: 'high',
  }),
  
  tournament_start: (data) => ({
    type: 'tournament_start',
    title: '⚔️ Tournament Started!',
    body: `${data.tournamentName} has begun. Join now!`,
    data: { eventId: data.eventId, screen: 'Events' },
    sound: 'default',
    priority: 'max',
  }),
  
  achievement_unlocked: (data) => ({
    type: 'achievement_unlocked',
    title: '🏅 Achievement Unlocked!',
    body: `You earned "${data.achievementName}"!`,
    data: { achievementId: data.achievementId, screen: 'Profile' },
    sound: 'default',
    priority: 'default',
  }),
  
  level_up: (data) => ({
    type: 'level_up',
    title: '⭐ Level Up!',
    body: `Congratulations! You reached Level ${data.level}!`,
    data: { screen: 'Profile' },
    sound: 'default',
    priority: 'high',
  }),
  
  daily_reminder: (data) => ({
    type: 'daily_reminder',
    title: '🎮 Time to Play!',
    body: 'Your daily challenges are waiting!',
    data: { screen: 'Challenges' },
    sound: 'default',
    priority: 'default',
  }),
  
  match_found: (data) => ({
    type: 'match_found',
    title: '⚡ Match Found!',
    body: 'Your game is ready. Join now!',
    data: { roomId: data.roomId, screen: 'GameRoom' },
    sound: 'default',
    priority: 'max',
  }),
  
  turn_reminder: (data) => ({
    type: 'turn_reminder',
    title: '⏰ Your Turn!',
    body: `It's your turn in ${data.roomName}`,
    data: { roomId: data.roomId, screen: 'GameRoom' },
    sound: 'default',
    priority: 'high',
  }),
};

// ==================== DEEP LINK SCHEMES ====================

export const DEEP_LINK_SCHEMES = {
  production: 'wittz://',
  development: 'wittz-dev://',
  universal: 'https://wittz.app',
};

export const DEEP_LINK_PATHS = {
  home: '/',
  game: '/game/:roomId',
  profile: '/profile/:userId',
  friends: '/friends',
  challenges: '/challenges',
  events: '/events',
  event: '/events/:eventId',
  leaderboard: '/leaderboard',
  settings: '/settings',
  prompts: '/prompts',
};
