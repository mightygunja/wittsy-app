/**
 * Firebase Analytics Service
 * Track user behavior, events, and app performance
 */

import { Platform } from 'react-native';
import { app } from './firebase';

class AnalyticsService {
  private analytics: any;
  private enabled: boolean = true;

  constructor() {
    // Firebase Analytics only works on web, not React Native
    if (Platform.OS === 'web') {
      try {
        const { getAnalytics } = require('firebase/analytics');
        this.analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Analytics not available:', error);
        this.enabled = false;
      }
    } else {
      // For React Native, we'll just log events to console in dev
      this.enabled = true;
      if (__DEV__) {
        console.log('Analytics: Using console logging for React Native');
      }
    }
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Set user ID for analytics
   */
  setUser(userId: string) {
    if (!this.enabled) return;
    try {
      if (Platform.OS === 'web' && this.analytics) {
        const { setUserId } = require('firebase/analytics');
        setUserId(this.analytics, userId);
      } else if (__DEV__) {
        console.log('Analytics: setUser', userId);
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set user properties
   */
  setUserProps(properties: { [key: string]: any }) {
    if (!this.enabled) return;
    try {
      if (Platform.OS === 'web' && this.analytics) {
        const { setUserProperties } = require('firebase/analytics');
        setUserProperties(this.analytics, properties);
      } else if (__DEV__) {
        console.log('Analytics: setUserProps', properties);
      }
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Log custom event
   */
  logEvent(eventName: string, params?: { [key: string]: any }) {
    if (!this.enabled) return;
    try {
      if (Platform.OS === 'web' && this.analytics) {
        const { logEvent } = require('firebase/analytics');
        logEvent(this.analytics, eventName, params);
      } else if (__DEV__) {
        console.log(`Analytics: ${eventName}`, params);
      }
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  // ==================== AUTHENTICATION EVENTS ====================

  signUp(method: string) {
    this.logEvent('sign_up', { method });
  }

  login(method: string) {
    this.logEvent('login', { method });
  }

  logout() {
    this.logEvent('logout');
  }

  // ==================== GAME EVENTS ====================

  createRoom(settings: any) {
    this.logEvent('create_room', {
      max_players: settings.maxPlayers,
      time_limit: settings.timeLimit,
      is_private: settings.isPrivate,
    });
  }

  joinRoom(roomId: string, playerCount: number) {
    this.logEvent('join_room', {
      room_id: roomId,
      player_count: playerCount,
    });
  }

  leaveRoom(roomId: string, duration: number) {
    this.logEvent('leave_room', {
      room_id: roomId,
      duration_seconds: duration,
    });
  }

  startGame(roomId: string, playerCount: number) {
    this.logEvent('start_game', {
      room_id: roomId,
      player_count: playerCount,
    });
  }

  submitResponse(roomId: string, roundNumber: number, responseLength: number) {
    this.logEvent('submit_response', {
      room_id: roomId,
      round_number: roundNumber,
      response_length: responseLength,
    });
  }

  castVote(roomId: string, roundNumber: number) {
    this.logEvent('cast_vote', {
      room_id: roomId,
      round_number: roundNumber,
    });
  }

  winRound(roomId: string, roundNumber: number, votes: number) {
    this.logEvent('win_round', {
      room_id: roomId,
      round_number: roundNumber,
      votes_received: votes,
    });
  }

  winGame(roomId: string, totalVotes: number, duration: number) {
    this.logEvent('win_game', {
      room_id: roomId,
      total_votes: totalVotes,
      duration_seconds: duration,
    });
  }

  loseGame(roomId: string, totalVotes: number, duration: number) {
    this.logEvent('lose_game', {
      room_id: roomId,
      total_votes: totalVotes,
      duration_seconds: duration,
    });
  }

  // ==================== SOCIAL EVENTS ====================

  sendFriendRequest(recipientId: string) {
    this.logEvent('send_friend_request', {
      recipient_id: recipientId,
    });
  }

  acceptFriendRequest(senderId: string) {
    this.logEvent('accept_friend_request', {
      sender_id: senderId,
    });
  }

  sendGameInvite(friendId: string, roomId: string) {
    this.logEvent('send_game_invite', {
      friend_id: friendId,
      room_id: roomId,
    });
  }

  sendChatMessage(roomId: string, messageType: 'text' | 'quick' | 'emote') {
    this.logEvent('send_chat_message', {
      room_id: roomId,
      message_type: messageType,
    });
  }

  reactToMessage(roomId: string, reactionType: string) {
    this.logEvent('react_to_message', {
      room_id: roomId,
      reaction_type: reactionType,
    });
  }

  // ==================== CHALLENGE EVENTS ====================

  startChallenge(challengeId: string, challengeType: 'daily' | 'weekly') {
    this.logEvent('start_challenge', {
      challenge_id: challengeId,
      challenge_type: challengeType,
    });
  }

  completeChallenge(challengeId: string, challengeType: 'daily' | 'weekly', reward: number) {
    this.logEvent('complete_challenge', {
      challenge_id: challengeId,
      challenge_type: challengeType,
      reward_amount: reward,
    });
  }

  claimReward(challengeId: string, rewardType: string, amount: number) {
    this.logEvent('claim_reward', {
      challenge_id: challengeId,
      reward_type: rewardType,
      amount,
    });
  }

  // ==================== EVENT EVENTS ====================

  registerForEvent(eventId: string, eventType: string) {
    this.logEvent('register_for_event', {
      event_id: eventId,
      event_type: eventType,
    });
  }

  joinTournament(tournamentId: string) {
    this.logEvent('join_tournament', {
      tournament_id: tournamentId,
    });
  }

  winTournament(tournamentId: string, prize: number) {
    this.logEvent('win_tournament', {
      tournament_id: tournamentId,
      prize_amount: prize,
    });
  }

  // ==================== PROGRESSION EVENTS ====================

  levelUp(newLevel: number, xpGained: number) {
    this.logEvent('level_up', {
      new_level: newLevel,
      xp_gained: xpGained,
    });
  }

  unlockAchievement(achievementId: string, achievementName: string) {
    this.logEvent('unlock_achievement', {
      achievement_id: achievementId,
      achievement_name: achievementName,
    });
  }

  earnCoins(amount: number, source: string) {
    this.logEvent('earn_virtual_currency', {
      virtual_currency_name: 'coins',
      value: amount,
      source,
    });
  }

  spendCoins(amount: number, item: string) {
    this.logEvent('spend_virtual_currency', {
      virtual_currency_name: 'coins',
      value: amount,
      item_name: item,
    });
  }

  // ==================== CONTENT EVENTS ====================

  viewPromptLibrary() {
    this.logEvent('view_item_list', {
      item_list_name: 'prompt_library',
    });
  }

  submitPrompt(category: string, difficulty: string) {
    this.logEvent('submit_prompt', {
      category,
      difficulty,
    });
  }

  reportPhrase(reason: string) {
    this.logEvent('report_phrase', {
      reason,
    });
  }

  // ==================== NAVIGATION EVENTS ====================

  screenView(screenName: string) {
    this.logEvent('screen_view', {
      screen_name: screenName,
    });
  }

  // ==================== SETTINGS EVENTS ====================

  changeTheme(theme: string) {
    this.logEvent('change_theme', {
      theme_mode: theme,
    });
  }

  changeSettings(settingType: string, value: any) {
    this.logEvent('change_settings', {
      setting_type: settingType,
      value: String(value),
    });
  }

  // ==================== ERROR EVENTS ====================

  logError(errorType: string, errorMessage: string) {
    this.logEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  // ==================== PERFORMANCE EVENTS ====================

  measurePerformance(metric: string, value: number) {
    this.logEvent('performance_metric', {
      metric_name: metric,
      value,
    });
  }

  // ==================== SHARING EVENTS ====================

  share(contentType: string, method: string) {
    this.logEvent('share', {
      content_type: contentType,
      method,
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export convenience functions
export const analytics = {
  setEnabled: (enabled: boolean) => analyticsService.setEnabled(enabled),
  setUser: (userId: string) => analyticsService.setUser(userId),
  setUserProps: (props: any) => analyticsService.setUserProps(props),
  logEvent: (name: string, params?: any) => analyticsService.logEvent(name, params),
  
  // Auth
  signUp: (method: string) => analyticsService.signUp(method),
  login: (method: string) => analyticsService.login(method),
  logout: () => analyticsService.logout(),
  
  // Game
  createRoom: (settings: any) => analyticsService.createRoom(settings),
  joinRoom: (roomId: string, playerCount: number) => analyticsService.joinRoom(roomId, playerCount),
  leaveRoom: (roomId: string, duration: number) => analyticsService.leaveRoom(roomId, duration),
  startGame: (roomId: string, playerCount: number) => analyticsService.startGame(roomId, playerCount),
  submitResponse: (roomId: string, round: number, length: number) => analyticsService.submitResponse(roomId, round, length),
  castVote: (roomId: string, round: number) => analyticsService.castVote(roomId, round),
  winRound: (roomId: string, round: number, votes: number) => analyticsService.winRound(roomId, round, votes),
  winGame: (roomId: string, votes: number, duration: number) => analyticsService.winGame(roomId, votes, duration),
  loseGame: (roomId: string, votes: number, duration: number) => analyticsService.loseGame(roomId, votes, duration),
  
  // Social
  sendFriendRequest: (recipientId: string) => analyticsService.sendFriendRequest(recipientId),
  acceptFriendRequest: (senderId: string) => analyticsService.acceptFriendRequest(senderId),
  sendGameInvite: (friendId: string, roomId: string) => analyticsService.sendGameInvite(friendId, roomId),
  sendChatMessage: (roomId: string, type: 'text' | 'quick' | 'emote') => analyticsService.sendChatMessage(roomId, type),
  reactToMessage: (roomId: string, reaction: string) => analyticsService.reactToMessage(roomId, reaction),
  
  // Challenges
  startChallenge: (id: string, type: 'daily' | 'weekly') => analyticsService.startChallenge(id, type),
  completeChallenge: (id: string, type: 'daily' | 'weekly', reward: number) => analyticsService.completeChallenge(id, type, reward),
  claimReward: (id: string, type: string, amount: number) => analyticsService.claimReward(id, type, amount),
  
  // Events
  registerForEvent: (id: string, type: string) => analyticsService.registerForEvent(id, type),
  joinTournament: (id: string) => analyticsService.joinTournament(id),
  winTournament: (id: string, prize: number) => analyticsService.winTournament(id, prize),
  
  // Progression
  levelUp: (level: number, xp: number) => analyticsService.levelUp(level, xp),
  unlockAchievement: (id: string, name: string) => analyticsService.unlockAchievement(id, name),
  earnCoins: (amount: number, source: string) => analyticsService.earnCoins(amount, source),
  spendCoins: (amount: number, item: string) => analyticsService.spendCoins(amount, item),
  
  // Content
  viewPromptLibrary: () => analyticsService.viewPromptLibrary(),
  submitPrompt: (category: string, difficulty: string) => analyticsService.submitPrompt(category, difficulty),
  reportPhrase: (reason: string) => analyticsService.reportPhrase(reason),
  
  // Navigation
  screenView: (screen: string) => analyticsService.screenView(screen),
  
  // Settings
  changeTheme: (theme: string) => analyticsService.changeTheme(theme),
  changeSettings: (type: string, value: any) => analyticsService.changeSettings(type, value),
  
  // Error
  logError: (type: string, message: string) => analyticsService.logError(type, message),
  
  // Performance
  measurePerformance: (metric: string, value: number) => analyticsService.measurePerformance(metric, value),
  
  // Sharing
  share: (contentType: string, method: string) => analyticsService.share(contentType, method),
};
