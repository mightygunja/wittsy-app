/**
 * Deep Linking Service
 * Handle deep links and universal links
 */

import * as Linking from 'expo-linking';
import { DeepLinkConfig, DeepLinkURL, DEEP_LINK_SCHEMES, DEEP_LINK_PATHS } from '../types/platform';

class DeepLinkingService {
  private listeners: ((config: DeepLinkConfig) => void)[] = [];

  /**
   * Initialize deep linking
   */
  async initialize(navigationRef: any): Promise<void> {
    try {
      // Get initial URL (if app was opened via deep link)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleDeepLink(initialUrl, navigationRef);
      }

      // Listen for deep links while app is running
      Linking.addEventListener('url', (event) => {
        this.handleDeepLink(event.url, navigationRef);
      });
    } catch (error) {
      console.error('Failed to initialize deep linking:', error);
    }
  }

  /**
   * Handle deep link URL
   */
  private handleDeepLink(url: string, navigationRef: any) {
    try {
      const parsed = this.parseDeepLink(url);
      if (!parsed) return;

      const config = this.urlToConfig(parsed);
      if (!config) return;

      // Notify listeners
      this.notifyListeners(config);

      // Navigate
      if (navigationRef?.current) {
        this.navigate(navigationRef, config);
      }
    } catch (error) {
      console.error('Failed to handle deep link:', error);
    }
  }

  /**
   * Parse deep link URL
   */
  private parseDeepLink(url: string): DeepLinkURL | null {
    try {
      const { scheme, hostname, path, queryParams } = Linking.parse(url);

      return {
        url,
        scheme: scheme || '',
        hostname: hostname || '',
        path: path || '/',
        queryParams: queryParams || {},
      };
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }

  /**
   * Convert URL to navigation config
   */
  private urlToConfig(parsed: DeepLinkURL): DeepLinkConfig | null {
    const path = parsed.path;
    const params = parsed.queryParams;

    // Match path to screen
    if (path === '/' || path === '/home') {
      return { screen: 'Home' };
    }

    if (path.startsWith('/game/')) {
      const roomId = path.split('/game/')[1];
      return { screen: 'GameRoom', params: { roomId } };
    }

    if (path.startsWith('/profile/')) {
      const userId = path.split('/profile/')[1];
      return { screen: 'Profile', params: { userId } };
    }

    if (path === '/friends') {
      return { screen: 'Friends' };
    }

    if (path === '/challenges') {
      return { screen: 'Challenges' };
    }

    if (path.startsWith('/events/')) {
      const eventId = path.split('/events/')[1];
      return { screen: 'Events', params: { eventId } };
    }

    if (path === '/events') {
      return { screen: 'Events' };
    }

    if (path === '/leaderboard') {
      return { screen: 'Leaderboard' };
    }

    if (path === '/settings') {
      return { screen: 'Settings' };
    }

    if (path === '/prompts') {
      return { screen: 'PromptLibrary' };
    }

    return null;
  }

  /**
   * Navigate using navigation ref
   */
  private navigate(navigationRef: any, config: DeepLinkConfig) {
    try {
      if (config.params) {
        navigationRef.current?.navigate(config.screen, config.params);
      } else {
        navigationRef.current?.navigate(config.screen);
      }
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  }

  /**
   * Add deep link listener
   */
  addListener(callback: (config: DeepLinkConfig) => void) {
    this.listeners.push(callback);
  }

  /**
   * Remove deep link listener
   */
  removeListener(callback: (config: DeepLinkConfig) => void) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(config: DeepLinkConfig) {
    this.listeners.forEach((callback) => {
      try {
        callback(config);
      } catch (error) {
        console.error('Deep link listener error:', error);
      }
    });
  }

  // ==================== URL BUILDERS ====================

  /**
   * Build deep link URL for game room
   */
  buildGameRoomLink(roomId: string): string {
    return `${DEEP_LINK_SCHEMES.production}game/${roomId}`;
  }

  /**
   * Build deep link URL for profile
   */
  buildProfileLink(userId: string): string {
    return `${DEEP_LINK_SCHEMES.production}profile/${userId}`;
  }

  /**
   * Build deep link URL for event
   */
  buildEventLink(eventId: string): string {
    return `${DEEP_LINK_SCHEMES.production}events/${eventId}`;
  }

  /**
   * Build universal link (for sharing)
   */
  buildUniversalLink(path: string): string {
    return `${DEEP_LINK_SCHEMES.universal}${path}`;
  }

  /**
   * Share game room link
   */
  async shareGameRoom(roomId: string, roomName: string): Promise<void> {
    const url = this.buildUniversalLink(`/game/${roomId}`);
    const message = `Join me in ${roomName}! ${url}`;

    try {
      const { Share } = await import('react-native');
      await Share.share({
        message,
        url,
        title: `Join ${roomName}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }

  /**
   * Share profile link
   */
  async shareProfile(userId: string, username: string): Promise<void> {
    const url = this.buildUniversalLink(`/profile/${userId}`);
    const message = `Check out ${username}'s profile! ${url}`;

    try {
      const { Share } = await import('react-native');
      await Share.share({
        message,
        url,
        title: `${username}'s Profile`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }

  /**
   * Share event link
   */
  async shareEvent(eventId: string, eventName: string): Promise<void> {
    const url = this.buildUniversalLink(`/events/${eventId}`);
    const message = `Join the ${eventName} event! ${url}`;

    try {
      const { Share } = await import('react-native');
      await Share.share({
        message,
        url,
        title: eventName,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }

  /**
   * Open external URL
   */
  async openURL(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }
}

// Export singleton instance
export const deepLinkingService = new DeepLinkingService();

// Export convenience functions
export const deepLinking = {
  initialize: (navigationRef: any) => deepLinkingService.initialize(navigationRef),
  addListener: (callback: (config: DeepLinkConfig) => void) =>
    deepLinkingService.addListener(callback),
  removeListener: (callback: (config: DeepLinkConfig) => void) =>
    deepLinkingService.removeListener(callback),
  buildGameRoomLink: (roomId: string) => deepLinkingService.buildGameRoomLink(roomId),
  buildProfileLink: (userId: string) => deepLinkingService.buildProfileLink(userId),
  buildEventLink: (eventId: string) => deepLinkingService.buildEventLink(eventId),
  buildUniversalLink: (path: string) => deepLinkingService.buildUniversalLink(path),
  shareGameRoom: (roomId: string, roomName: string) =>
    deepLinkingService.shareGameRoom(roomId, roomName),
  shareProfile: (userId: string, username: string) =>
    deepLinkingService.shareProfile(userId, username),
  shareEvent: (eventId: string, eventName: string) =>
    deepLinkingService.shareEvent(eventId, eventName),
  openURL: (url: string) => deepLinkingService.openURL(url),
};
