/**
 * Review Prompt Service
 * Intelligently prompts users to rate the app after positive experiences
 */

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './analytics';
import { monetization } from './monetization';

const STORAGE_KEYS = {
  GAMES_PLAYED: '@review_games_played',
  REVIEW_PROMPTED: '@review_prompted',
  REVIEW_GIVEN: '@review_given',
  LAST_PROMPT_DATE: '@review_last_prompt',
  REVIEW_DECLINED: '@review_declined',
};

const PROMPT_CONFIG = {
  GAMES_BEFORE_PROMPT: 3,        // Prompt after 3 games
  DAYS_BETWEEN_PROMPTS: 30,      // Don't prompt more than once per 30 days
  COIN_REWARD: 100,              // Reward for leaving review
  MIN_WIN_RATE: 0.3,             // Only prompt if user has 30%+ win rate (positive experience)
};

export interface ReviewPromptData {
  gamesPlayed: number;
  hasBeenPrompted: boolean;
  hasGivenReview: boolean;
  lastPromptDate: string | null;
  hasDeclined: boolean;
}

class ReviewPromptService {
  /**
   * Check if device supports in-app review
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await StoreReview.isAvailableAsync();
    } catch (error) {
      console.error('Failed to check review availability:', error);
      return false;
    }
  }

  /**
   * Get current review prompt data
   */
  async getReviewData(): Promise<ReviewPromptData> {
    try {
      const [gamesPlayed, prompted, given, lastPrompt, declined] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.GAMES_PLAYED),
        AsyncStorage.getItem(STORAGE_KEYS.REVIEW_PROMPTED),
        AsyncStorage.getItem(STORAGE_KEYS.REVIEW_GIVEN),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.REVIEW_DECLINED),
      ]);

      return {
        gamesPlayed: parseInt(gamesPlayed || '0', 10),
        hasBeenPrompted: prompted === 'true',
        hasGivenReview: given === 'true',
        lastPromptDate: lastPrompt,
        hasDeclined: declined === 'true',
      };
    } catch (error) {
      console.error('Failed to get review data:', error);
      return {
        gamesPlayed: 0,
        hasBeenPrompted: false,
        hasGivenReview: false,
        lastPromptDate: null,
        hasDeclined: false,
      };
    }
  }

  /**
   * Increment games played counter
   */
  async incrementGamesPlayed(): Promise<number> {
    try {
      const data = await this.getReviewData();
      const newCount = data.gamesPlayed + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, newCount.toString());
      return newCount;
    } catch (error) {
      console.error('Failed to increment games played:', error);
      return 0;
    }
  }

  /**
   * Check if we should prompt for review
   */
  async shouldPromptForReview(userWinRate?: number): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) return false;

      const data = await this.getReviewData();

      // Already gave review - don't prompt again
      if (data.hasGivenReview) return false;

      // User declined - don't prompt again
      if (data.hasDeclined) return false;

      // Not enough games played
      if (data.gamesPlayed < PROMPT_CONFIG.GAMES_BEFORE_PROMPT) return false;

      // Check if user has positive experience (optional)
      if (userWinRate !== undefined && userWinRate < PROMPT_CONFIG.MIN_WIN_RATE) {
        return false;
      }

      // Check if we've prompted recently
      if (data.lastPromptDate) {
        const lastPrompt = new Date(data.lastPromptDate);
        const daysSincePrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePrompt < PROMPT_CONFIG.DAYS_BETWEEN_PROMPTS) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to check if should prompt:', error);
      return false;
    }
  }

  /**
   * Show native review prompt (iOS/Android)
   */
  async showNativeReviewPrompt(): Promise<void> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        console.log('Native review not available on this device');
        return;
      }

      await StoreReview.requestReview();

      // Mark as prompted
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_PROMPTED, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT_DATE, new Date().toISOString());

      analytics.logEvent('review_prompt_shown', {
        type: 'native',
      });

      console.log('✅ Native review prompt shown');
    } catch (error) {
      console.error('Failed to show native review prompt:', error);
    }
  }

  /**
   * Mark that user gave a review
   */
  async markReviewGiven(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_GIVEN, 'true');
      analytics.logEvent('review_given', {});
      console.log('✅ User marked as having given review');
    } catch (error) {
      console.error('Failed to mark review given:', error);
    }
  }

  /**
   * Mark that user declined review
   */
  async markReviewDeclined(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_DECLINED, 'true');
      analytics.logEvent('review_declined', {});
      console.log('User declined review prompt');
    } catch (error) {
      console.error('Failed to mark review declined:', error);
    }
  }

  /**
   * Grant coin reward for leaving review
   */
  async grantReviewReward(userId: string): Promise<boolean> {
    try {
      await monetization.grantCoinsToUser(userId, PROMPT_CONFIG.COIN_REWARD);
      await this.markReviewGiven();

      analytics.logEvent('review_reward_granted', {
        coins: PROMPT_CONFIG.COIN_REWARD,
      });

      console.log(`✅ Granted ${PROMPT_CONFIG.COIN_REWARD} coins for review`);
      return true;
    } catch (error) {
      console.error('Failed to grant review reward:', error);
      return false;
    }
  }

  /**
   * Main function to check and show review prompt after game
   */
  async checkAndPromptAfterGame(userId: string, userWon: boolean, userWinRate?: number): Promise<void> {
    try {
      // Only prompt after wins (positive experience)
      if (!userWon) return;

      // Increment games played
      const gamesPlayed = await this.incrementGamesPlayed();
      console.log(`Games played: ${gamesPlayed}`);

      // Check if should prompt
      const shouldPrompt = await this.shouldPromptForReview(userWinRate);
      if (!shouldPrompt) return;

      // Show native prompt
      await this.showNativeReviewPrompt();

      // Grant reward (assuming user will rate)
      // Note: We can't detect if they actually rated on native prompt,
      // so we grant the reward optimistically
      await this.grantReviewReward(userId);
    } catch (error) {
      console.error('Failed to check and prompt for review:', error);
    }
  }

  /**
   * Reset review data (for testing)
   */
  async resetReviewData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.GAMES_PLAYED),
        AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_PROMPTED),
        AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_GIVEN),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_PROMPT_DATE),
        AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_DECLINED),
      ]);
      console.log('✅ Review data reset');
    } catch (error) {
      console.error('Failed to reset review data:', error);
    }
  }

  /**
   * Get stats for debugging
   */
  async getStats(): Promise<ReviewPromptData> {
    return await this.getReviewData();
  }
}

export const reviewPromptService = new ReviewPromptService();
