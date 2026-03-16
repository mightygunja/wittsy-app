/**
 * Deep Linking Service
 * Handle deep links and universal links
 */

import * as Linking from 'expo-linking';
import { Share } from 'react-native';
import { DeepLinkConfig, DeepLinkURL, DEEP_LINK_SCHEMES, DEEP_LINK_PATHS } from '../types/platform';

class DeepLinkingService {
  private listeners: ((config: DeepLinkConfig) => void)[] = [];
  private pendingDeepLink: DeepLinkConfig | null = null;

  /**
   * Initialize deep linking
   */
  async initialize(navigationRef: any): Promise<void> {
    try {
      console.log('🔗 Initializing deep linking');
      console.log('🔗 Navigation ref available:', !!navigationRef?.current);
      
      // Get initial URL (if app was opened via deep link)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('📱 Initial deep link URL:', initialUrl);
        console.log('📱 Navigation ref at initial URL:', !!navigationRef?.current);
        this.handleDeepLink(initialUrl, navigationRef);
      } else {
        console.log('📱 No initial deep link URL');
      }

      // Listen for deep links while app is running
      Linking.addEventListener('url', (event) => {
        console.log('📱 Deep link received:', event.url);
        console.log('📱 Navigation ref at event:', !!navigationRef?.current);
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

      console.log('🔗 Deep link config:', config);

      // GameRoom and Groups invite links MUST go through the HomeScreen listener:
      // - GameRoom: so joinRoom() is called before navigation (avoids ghost-player bug)
      // - Groups: so joinGroupViaInviteCode() is called before navigating to GroupDetail
      // addListener() will fire the pendingDeepLink immediately when HomeScreen registers.
      if (config.screen === 'GameRoom' || (config.screen === 'Groups' && config.params?.inviteCode)) {
        if (this.listeners.length > 0) {
          // HomeScreen is already listening — let it handle join + navigate
          this.notifyListeners(config);
        } else {
          // HomeScreen not yet registered (cold start, profile still loading).
          // Save so addListener() fires it the moment HomeScreen registers.
          console.log('⏳ No listeners yet, saving pending link for screen:', config.screen);
          this.pendingDeepLink = config;
        }
        return;
      }

      // All other links: notify listeners and navigate directly
      this.notifyListeners(config);
      if (navigationRef?.current) {
        this.navigate(navigationRef, config);
      } else {
        console.log('⏳ Navigation not ready, storing pending deep link');
        this.pendingDeepLink = config;
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
      
      console.log('🔍 Parsing deep link:', {
        url,
        scheme,
        hostname,
        path,
        queryParams
      });

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

    console.log('🎯 Matching path:', path);
    console.log('🎯 Scheme:', parsed.scheme);
    console.log('🎯 Hostname:', parsed.hostname);

    // Handle custom scheme wittsy://game/{roomId}
    // Expo Linking parses this as hostname='game', path='/{roomId}'
    if (parsed.hostname === 'game' && path && path !== '/') {
      const roomId = path.replace(/^\//, '');
      if (roomId) {
        console.log('✅ Matched: GameRoom via custom scheme, roomId:', roomId);
        return { screen: 'GameRoom', params: { roomId } };
      }
    }

    // Match path to screen
    if (path === '/' || path === '/home') {
      console.log('✅ Matched: Home');
      return { screen: 'Home' };
    }

    // Handle both /game/ and /room/ paths (covers wittz:///game/{roomId} and https://wittz.app/game/{roomId})
    if (path.startsWith('/game/') || path.startsWith('game/') || path.startsWith('/room/') || path.startsWith('room/')) {
      const roomId = path.replace(/^\/?(game|room)\//, '');
      if (roomId) {
        console.log('✅ Matched: GameRoom with roomId:', roomId);
        return { screen: 'GameRoom', params: { roomId } };
      }
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

    // Handle /group/{inviteCode} — group invite links
    if (path.startsWith('/group/') || path.startsWith('group/')) {
      const inviteCode = path.replace(/^\/?group\//, '').toUpperCase();
      if (inviteCode) {
        console.log('✅ Matched: Group invite, code:', inviteCode);
        return { screen: 'Groups', params: { inviteCode } };
      }
    }

    return null;
  }

  /**
   * Navigate using navigation ref
   */
  private navigate(navigationRef: any, config: DeepLinkConfig) {
    try {
      console.log('🚀 NAVIGATING NOW to:', config.screen, 'with params:', config.params);
      console.log('🚀 Navigation ref current:', !!navigationRef?.current);
      
      if (config.params) {
        navigationRef.current?.navigate(config.screen, config.params);
        console.log('✅ Navigation called with params');
      } else {
        navigationRef.current?.navigate(config.screen);
        console.log('✅ Navigation called without params');
      }
    } catch (error) {
      console.error('❌ Failed to navigate:', error);
    }
  }

  /**
   * Handle pending deep link (call after authentication)
   */
  handlePendingDeepLink(navigationRef: any) {
    if (this.pendingDeepLink && navigationRef?.current) {
      console.log('✅ Handling pending deep link:', this.pendingDeepLink);
      this.navigate(navigationRef, this.pendingDeepLink);
      this.pendingDeepLink = null;
    }
  }

  /**
   * Add deep link listener.
   * If there is a pending GameRoom deep link (saved during cold-start before the
   * listener was registered), fire it immediately so joinRoom is called properly.
   */
  addListener(callback: (config: DeepLinkConfig) => void) {
    this.listeners.push(callback);

    const isListenerPending =
      this.pendingDeepLink?.screen === 'GameRoom' ||
      (this.pendingDeepLink?.screen === 'Groups' && this.pendingDeepLink?.params?.inviteCode);

    if (isListenerPending) {
      const pending = this.pendingDeepLink!;
      this.pendingDeepLink = null;
      // Defer by one tick so the caller finishes its own setup before we fire
      setTimeout(() => {
        try {
          callback(pending);
        } catch (error) {
          console.error('Deep link listener error (pending):', error);
        }
      }, 0);
    }
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
    // Use the custom scheme URL — guaranteed to open the app when installed.
    // Passing a separate `url` field on iOS causes the OS to drop the message text,
    // and universal links only work with a configured AASA file on the server.
    const deepLink = this.buildGameRoomLink(roomId); // wittz://game/{roomId}
    const message = `Join me in "${roomName}" on Wittz! Tap to join: ${deepLink}`;

    try {
      await Share.share({ message, title: `Join ${roomName}` });
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
  handlePendingDeepLink: (navigationRef: any) => deepLinkingService.handlePendingDeepLink(navigationRef),
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
