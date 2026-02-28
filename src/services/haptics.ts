/**
 * Haptic Feedback Service
 * Cross-platform haptic feedback with fallbacks
 */

import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import { HapticFeedbackType, HapticOptions } from '../types/platform';

class HapticService {
  private enabled: boolean = true;

  /**
   * Enable or disable haptic feedback globally
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticFeedbackType, options?: HapticOptions): Promise<void> {
    if (!this.enabled) return;

    try {
      if (Platform.OS === 'web') {
        // Web fallback - use vibration API if available
        if (options?.enableVibrateFallback && 'vibrate' in navigator) {
          this.webVibrate(type);
        }
        return;
      }

      switch (type) {
        // Impact feedback
        case 'light':
        case 'impactLight':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case 'medium':
        case 'impactMedium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case 'heavy':
        case 'impactHeavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        // Notification feedback
        case 'success':
        case 'notificationSuccess':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case 'warning':
        case 'notificationWarning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;

        case 'error':
        case 'notificationError':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        // Selection feedback
        case 'selection':
          await Haptics.selectionAsync();
          break;

        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      
      // Fallback to vibration
      if (options?.enableVibrateFallback) {
        this.vibrateFallback(type);
      }
    }
  }

  /**
   * Vibration fallback for older devices
   */
  private vibrateFallback(type: HapticFeedbackType) {
    try {
      switch (type) {
        case 'light':
        case 'selection':
          Vibration.vibrate(10);
          break;

        case 'medium':
          Vibration.vibrate(20);
          break;

        case 'heavy':
        case 'error':
          Vibration.vibrate(50);
          break;

        case 'success':
          Vibration.vibrate([0, 10, 20, 10]);
          break;

        case 'warning':
          Vibration.vibrate([0, 20, 40, 20]);
          break;

        default:
          Vibration.vibrate(20);
      }
    } catch (error) {
      console.warn('Vibration fallback failed:', error);
    }
  }

  /**
   * Web vibration fallback
   */
  private webVibrate(type: HapticFeedbackType) {
    if (!('vibrate' in navigator)) return;

    try {
      const nav = navigator as any;
      switch (type) {
        case 'light':
        case 'selection':
          nav.vibrate(10);
          break;

        case 'medium':
          nav.vibrate(20);
          break;

        case 'heavy':
        case 'error':
          nav.vibrate(50);
          break;

        case 'success':
          nav.vibrate([10, 20, 10]);
          break;

        case 'warning':
          nav.vibrate([20, 40, 20]);
          break;

        default:
          nav.vibrate(20);
      }
    } catch (error) {
      console.warn('Web vibration failed:', error);
    }
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Light tap feedback (for buttons, selections)
   */
  async light() {
    await this.trigger('light', { enableVibrateFallback: true });
  }

  /**
   * Medium impact (for important actions)
   */
  async medium() {
    await this.trigger('medium', { enableVibrateFallback: true });
  }

  /**
   * Heavy impact (for critical actions)
   */
  async heavy() {
    await this.trigger('heavy', { enableVibrateFallback: true });
  }

  /**
   * Success feedback
   */
  async success() {
    await this.trigger('success', { enableVibrateFallback: true });
  }

  /**
   * Warning feedback
   */
  async warning() {
    await this.trigger('warning', { enableVibrateFallback: true });
  }

  /**
   * Error feedback
   */
  async error() {
    await this.trigger('error', { enableVibrateFallback: true });
  }

  /**
   * Selection feedback (for scrolling, picking)
   */
  async selection() {
    await this.trigger('selection', { enableVibrateFallback: true });
  }

  // ==================== GAME-SPECIFIC HAPTICS ====================

  /**
   * Button press feedback
   */
  async buttonPress() {
    await this.light();
  }

  /**
   * Card flip/reveal
   */
  async cardFlip() {
    await this.medium();
  }

  /**
   * Vote cast
   */
  async voteCast() {
    await this.medium();
  }

  /**
   * Round win
   */
  async roundWin() {
    await this.success();
  }

  /**
   * Game win
   */
  async gameWin() {
    await this.trigger('success', { enableVibrateFallback: true });
    setTimeout(() => this.trigger('success', { enableVibrateFallback: true }), 100);
  }

  /**
   * Achievement unlocked
   */
  async achievementUnlocked() {
    await this.success();
    setTimeout(() => this.light(), 100);
    setTimeout(() => this.light(), 200);
  }

  /**
   * Level up
   */
  async levelUp() {
    await this.success();
    setTimeout(() => this.medium(), 150);
    setTimeout(() => this.success(), 300);
  }

  /**
   * Timer warning (time running out)
   */
  async timerWarning() {
    await this.warning();
  }

  /**
   * Timer expired
   */
  async timerExpired() {
    await this.error();
  }

  /**
   * Match found
   */
  async matchFound() {
    await this.success();
    setTimeout(() => this.light(), 100);
  }

  /**
   * Friend request received
   */
  async friendRequest() {
    await this.medium();
  }

  /**
   * Message received
   */
  async messageReceived() {
    await this.light();
  }

  /**
   * Swipe/scroll feedback
   */
  async swipe() {
    await this.selection();
  }
}

// Export singleton instance
export const hapticService = new HapticService();

// Export convenience functions
export const haptics = {
  light: () => hapticService.light(),
  medium: () => hapticService.medium(),
  heavy: () => hapticService.heavy(),
  success: () => hapticService.success(),
  warning: () => hapticService.warning(),
  error: () => hapticService.error(),
  selection: () => hapticService.selection(),
  
  // Game-specific
  buttonPress: () => hapticService.buttonPress(),
  cardFlip: () => hapticService.cardFlip(),
  voteCast: () => hapticService.voteCast(),
  roundWin: () => hapticService.roundWin(),
  gameWin: () => hapticService.gameWin(),
  achievementUnlocked: () => hapticService.achievementUnlocked(),
  levelUp: () => hapticService.levelUp(),
  timerWarning: () => hapticService.timerWarning(),
  timerExpired: () => hapticService.timerExpired(),
  matchFound: () => hapticService.matchFound(),
  friendRequest: () => hapticService.friendRequest(),
  messageReceived: () => hapticService.messageReceived(),
  swipe: () => hapticService.swipe(),
  
  // Control
  setEnabled: (enabled: boolean) => hapticService.setEnabled(enabled),
  isEnabled: () => hapticService.isEnabled(),
};
