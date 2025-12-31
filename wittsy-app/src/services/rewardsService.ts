/**
 * Rewards Service
 * Handles coin and XP rewards for gameplay
 */

import { firestore } from './firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { analytics } from './analytics';
import { battlePass } from './battlePassService';

// Reward amounts
export const REWARD_AMOUNTS = {
  // Coins
  ROUND_WIN: 50,
  GAME_PARTICIPATION: 25,
  DAILY_LOGIN: 25,
  CHALLENGE_COMPLETE: 100,
  LEVEL_UP: 100,
  
  // XP
  ROUND_WIN_XP: 100,
  GAME_PARTICIPATION_XP: 50,
  VOTE_RECEIVED_XP: 10,
};

class RewardsService {
  /**
   * Grant coins to a user
   */
  async grantCoins(userId: string, amount: number, source: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, 'users', userId);
      
      // Check if user exists
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.error('User not found:', userId);
        return false;
      }

      // Update coins
      await updateDoc(userRef, {
        'stats.coins': increment(amount)
      });

      // Track analytics
      analytics.logEvent('coins_earned', {
        user_id: userId,
        amount,
        source,
      });

      console.log(`✅ Granted ${amount} coins to ${userId} from ${source}`);
      return true;
    } catch (error) {
      console.error('Failed to grant coins:', error);
      return false;
    }
  }

  /**
   * Grant rewards for winning a round
   */
  async grantRoundWinRewards(userId: string, voteCount: number): Promise<void> {
    try {
      // Grant coins
      await this.grantCoins(userId, REWARD_AMOUNTS.ROUND_WIN, 'round_win');

      // Grant Battle Pass XP
      const xpAmount = REWARD_AMOUNTS.ROUND_WIN_XP + (voteCount * REWARD_AMOUNTS.VOTE_RECEIVED_XP);
      await battlePass.addXP(userId, xpAmount, 'round_win');

      console.log(`✅ Round win rewards granted to ${userId}: ${REWARD_AMOUNTS.ROUND_WIN} coins, ${xpAmount} XP`);
    } catch (error) {
      console.error('Failed to grant round win rewards:', error);
    }
  }

  /**
   * Grant rewards for participating in a game
   */
  async grantParticipationRewards(userId: string): Promise<void> {
    try {
      // Grant coins
      await this.grantCoins(userId, REWARD_AMOUNTS.GAME_PARTICIPATION, 'game_participation');

      // Grant Battle Pass XP
      await battlePass.addXP(userId, REWARD_AMOUNTS.GAME_PARTICIPATION_XP, 'game_participation');

      console.log(`✅ Participation rewards granted to ${userId}: ${REWARD_AMOUNTS.GAME_PARTICIPATION} coins, ${REWARD_AMOUNTS.GAME_PARTICIPATION_XP} XP`);
    } catch (error) {
      console.error('Failed to grant participation rewards:', error);
    }
  }

  /**
   * Grant daily login reward
   */
  async grantDailyLoginReward(userId: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return false;
      }

      const userData = userSnap.data();
      const lastLogin = userData.lastDailyReward?.toDate();
      const now = new Date();

      // Check if already claimed today
      if (lastLogin) {
        const hoursSinceLastLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastLogin < 24) {
          console.log('Daily reward already claimed');
          return false;
        }
      }

      // Grant coins
      await this.grantCoins(userId, REWARD_AMOUNTS.DAILY_LOGIN, 'daily_login');

      // Update last login time
      await updateDoc(userRef, {
        lastDailyReward: now
      });

      console.log(`✅ Daily login reward granted to ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to grant daily login reward:', error);
      return false;
    }
  }

  /**
   * Grant level up reward
   */
  async grantLevelUpReward(userId: string, newLevel: number): Promise<void> {
    try {
      await this.grantCoins(userId, REWARD_AMOUNTS.LEVEL_UP, 'level_up');

      analytics.logEvent('level_up_reward', {
        user_id: userId,
        level: newLevel,
        coins: REWARD_AMOUNTS.LEVEL_UP,
      });

      console.log(`✅ Level up reward granted to ${userId} for reaching level ${newLevel}`);
    } catch (error) {
      console.error('Failed to grant level up reward:', error);
    }
  }

  /**
   * Grant challenge completion reward
   */
  async grantChallengeReward(userId: string, challengeId: string, rewardAmount?: number): Promise<void> {
    try {
      const amount = rewardAmount || REWARD_AMOUNTS.CHALLENGE_COMPLETE;
      await this.grantCoins(userId, amount, `challenge_${challengeId}`);

      analytics.logEvent('challenge_reward', {
        user_id: userId,
        challenge_id: challengeId,
        coins: amount,
      });

      console.log(`✅ Challenge reward granted to ${userId}: ${amount} coins`);
    } catch (error) {
      console.error('Failed to grant challenge reward:', error);
    }
  }

  /**
   * Grant game end rewards to all players
   * Returns rewards data for each player
   */
  async grantGameEndRewards(
    playerIds: string[]
  ): Promise<Map<string, { coins: number; xp: number; battlePassXP: number }>> {
    const rewardsMap = new Map();

    for (const userId of playerIds) {
      try {
        // Grant participation rewards
        await this.grantParticipationRewards(userId);

        // Store reward amounts for summary
        rewardsMap.set(userId, {
          coins: REWARD_AMOUNTS.GAME_PARTICIPATION,
          xp: 0, // User XP handled separately
          battlePassXP: REWARD_AMOUNTS.GAME_PARTICIPATION_XP,
        });

        console.log(`✅ Game end rewards granted to ${userId}`);
      } catch (error) {
        console.error(`Failed to grant game end rewards to ${userId}:`, error);
      }
    }

    return rewardsMap;
  }
}

// Export singleton
export const rewardsService = new RewardsService();

// Export convenience functions
export const rewards = {
  grantCoins: (userId: string, amount: number, source: string) => 
    rewardsService.grantCoins(userId, amount, source),
  grantRoundWinRewards: (userId: string, voteCount: number) => 
    rewardsService.grantRoundWinRewards(userId, voteCount),
  grantParticipationRewards: (userId: string) => 
    rewardsService.grantParticipationRewards(userId),
  grantDailyLoginReward: (userId: string) => 
    rewardsService.grantDailyLoginReward(userId),
  grantLevelUpReward: (userId: string, newLevel: number) => 
    rewardsService.grantLevelUpReward(userId, newLevel),
  grantChallengeReward: (userId: string, challengeId: string, rewardAmount?: number) => 
    rewardsService.grantChallengeReward(userId, challengeId, rewardAmount),
  grantGameEndRewards: (playerIds: string[]) =>
    rewardsService.grantGameEndRewards(playerIds),
};
