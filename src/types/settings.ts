/**
 * Settings & Customization Types
 * Theme, audio, gameplay, privacy, notifications, accessibility
 */

// ==================== THEME SETTINGS ====================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeSettings {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  useSystemTheme: boolean;
}

// ==================== AUDIO SETTINGS ====================

export interface AudioSettings {
  masterVolume: number; // 0-100
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  voiceVolume: number; // 0-100
  muteAll: boolean;
  enableMusic: boolean;
  enableSFX: boolean;
  enableVoice: boolean;
  enableVibration: boolean;
}

// ==================== GAMEPLAY SETTINGS ====================

export interface GameplaySettings {
  autoSubmit: boolean;
  confirmBeforeSubmit: boolean;
  showTimer: boolean;
  showTypingIndicators: boolean;
  autoReadyUp: boolean;
  skipTutorials: boolean;
  quickChatEnabled: boolean;
  emotesEnabled: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}

// ==================== PRIVACY SETTINGS ====================

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  allowGameInvites: boolean;
  showMatchHistory: boolean;
  showStats: boolean;
  allowSpectators: boolean;
  blockList: string[];
}

// ==================== NOTIFICATION SETTINGS ====================

export interface NotificationSettings {
  enabled: boolean;
  friendRequests: boolean;
  gameInvites: boolean;
  chatMessages: boolean;
  challengeUpdates: boolean;
  eventReminders: boolean;
  tournamentUpdates: boolean;
  achievementUnlocked: boolean;
  levelUp: boolean;
  dailyReminders: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  sound: boolean;
  vibration: boolean;
}

// ==================== ACCESSIBILITY SETTINGS ====================

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  screenReader: boolean;
  closedCaptions: boolean;
  reduceTransparency: boolean;
  boldText: boolean;
  buttonShapes: boolean;
  increaseTouch: boolean;
  autoplayVideos: boolean;
}

// ==================== LANGUAGE SETTINGS ====================

export interface LanguageSettings {
  language: string;
  region: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

// ==================== COMBINED SETTINGS ====================

export interface UserSettings {
  theme: ThemeSettings;
  audio: AudioSettings;
  gameplay: GameplaySettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  language: LanguageSettings;
  lastUpdated: string;
}

// ==================== DEFAULT SETTINGS ====================

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'dark',
  primaryColor: '#6C63FF',
  accentColor: '#FF6584',
  useSystemTheme: false,
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  voiceVolume: 100,
  muteAll: false,
  enableMusic: true,
  enableSFX: true,
  enableVoice: true,
  enableVibration: true,
};

export const DEFAULT_GAMEPLAY_SETTINGS: GameplaySettings = {
  autoSubmit: false,
  confirmBeforeSubmit: true,
  showTimer: true,
  showTypingIndicators: true,
  autoReadyUp: false,
  skipTutorials: false,
  quickChatEnabled: true,
  emotesEnabled: true,
  animationsEnabled: true,
  reducedMotion: false,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowFriendRequests: true,
  allowGameInvites: true,
  showMatchHistory: true,
  showStats: true,
  allowSpectators: true,
  blockList: [],
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  friendRequests: true,
  gameInvites: true,
  chatMessages: true,
  challengeUpdates: true,
  eventReminders: true,
  tournamentUpdates: true,
  achievementUnlocked: true,
  levelUp: true,
  dailyReminders: false,
  pushEnabled: true,
  emailEnabled: false,
  inAppEnabled: true,
  sound: true,
  vibration: true,
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  colorblindMode: 'none',
  screenReader: false,
  closedCaptions: false,
  reduceTransparency: false,
  boldText: false,
  buttonShapes: false,
  increaseTouch: false,
  autoplayVideos: true,
};

export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  language: 'en',
  region: 'US',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: DEFAULT_THEME_SETTINGS,
  audio: DEFAULT_AUDIO_SETTINGS,
  gameplay: DEFAULT_GAMEPLAY_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  language: DEFAULT_LANGUAGE_SETTINGS,
  lastUpdated: new Date().toISOString(),
};
