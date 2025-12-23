/**
 * Battle Pass Service
 * Manage seasons, progression, and rewards
 */

import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { firestore } from './firebase';
import { analytics } from './analytics';
import { monetization } from './monetization';
import { avatarService } from './avatarService';
import {
  BattlePassSeason,
  UserBattlePass,
  BattlePassStats,
  BattlePassChallenge,
  SEASON_1,
  XP_REWARDS,
  LEVEL_SKIP_PRICES,
} from '../types/battlePass';

class BattlePassService {
  private currentSeason: BattlePassSeason = SEASON_1;
  private seasonCache: { season: BattlePassSeason; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch active season from Firestore
   */
  async fetchActiveSeason(): Promise<BattlePassSeason> {
    try {
      // Check cache first
      if (this.seasonCache && Date.now() - this.seasonCache.timestamp < this.CACHE_DURATION) {
        return this.seasonCache.season;
      }

      // Query Firestore for active season
      const seasonsRef = collection(firestore, 'battlePassSeasons');
      
      // Simpler query - just get active seasons
      const q = query(
        seasonsRef,
        where('active', '==', true),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const seasonData = snapshot.docs[0].data();
        const season: BattlePassSeason = {
          ...seasonData,
          startDate: seasonData.startDate.toDate(),
          endDate: seasonData.endDate.toDate(),
        } as BattlePassSeason;

        // Update cache
        this.seasonCache = {
          season,
          timestamp: Date.now(),
        };
        this.currentSeason = season;

        return season;
      }

      // Fallback to Season 1 if no active season found
      console.log('No active season in Firestore, using Season 1');
      return SEASON_1;
    } catch (error) {
      console.error('Failed to fetch active season:', error);
      // Return cached or default season on error
      return this.seasonCache?.season || SEASON_1;
    }
  }

  /**
   * Get current season (synchronous, uses cache)
   */
  getCurrentSeason(): BattlePassSeason {
    return this.currentSeason;
  }

  /**
   * Initialize and fetch current season
   */
  async initialize(): Promise<void> {
    await this.fetchActiveSeason();
  }

  /**
   * Get user's battle pass data
   */
  async getUserBattlePass(userId: string): Promise<UserBattlePass | null> {
    try {
      const bpRef = doc(firestore, 'battlePasses', userId);
      const bpSnap = await getDoc(bpRef);

      if (bpSnap.exists()) {
        return bpSnap.data() as UserBattlePass;
      }

      // Create new battle pass entry
      const newBP: UserBattlePass = {
        userId,
        seasonId: this.currentSeason.id,
        isPremium: false,
        currentLevel: 1,
        currentXP: 0,
        claimedRewards: [],
      };

      await setDoc(bpRef, newBP);
      return newBP;
    } catch (error) {
      console.error('Failed to get user battle pass:', error);
      return null;
    }
  }

  /**
   * Purchase premium battle pass
   */
  async purchasePremium(userId: string): Promise<boolean> {
    try {
      // In production, this would use real IAP
      // For now, simulate successful purchase in development
      if (__DEV__) {
        console.log('Battle Pass: Simulating premium purchase in dev mode');
      }
      
      const bpRef = doc(firestore, 'battlePasses', userId);
      await updateDoc(bpRef, {
        isPremium: true,
        purchaseDate: new Date(),
      });

      analytics.logEvent('battle_pass_purchase', {
        user_id: userId,
        season_id: this.currentSeason.id,
        price: this.currentSeason.price,
      });

      return true;
    } catch (error) {
      console.error('Failed to purchase premium:', error);
      return false;
    }
  }

  /**
   * Add XP to user's battle pass
   */
  async addXP(userId: string, xp: number, source: string): Promise<void> {
    try {
      const battlePass = await this.getUserBattlePass(userId);
      if (!battlePass) return;

      const bpRef = doc(firestore, 'battlePasses', userId);
      let newXP = battlePass.currentXP + xp;
      let newLevel = battlePass.currentLevel;

      // Check for level ups
      while (newXP >= this.currentSeason.xpPerLevel && newLevel < this.currentSeason.maxLevel) {
        newXP -= this.currentSeason.xpPerLevel;
        newLevel++;

        analytics.logEvent('battle_pass_level_up', {
          user_id: userId,
          season_id: this.currentSeason.id,
          new_level: newLevel,
        });
      }

      await updateDoc(bpRef, {
        currentXP: newXP,
        currentLevel: newLevel,
        lastXPGain: new Date(),
      });

      analytics.logEvent('battle_pass_xp_gained', {
        user_id: userId,
        xp_amount: xp,
        source,
        new_level: newLevel,
      });
    } catch (error) {
      console.error('Failed to add XP:', error);
    }
  }

  /**
   * Claim reward at specific level
   */
  async claimReward(userId: string, level: number, isPremium: boolean): Promise<boolean> {
    try {
      const battlePass = await this.getUserBattlePass(userId);
      if (!battlePass) return false;

      // Check if user has reached this level
      if (battlePass.currentLevel < level) {
        return false;
      }

      // Check if already claimed
      if (battlePass.claimedRewards.includes(level)) {
        return false;
      }

      // Get reward
      const reward = this.currentSeason.rewards.find((r) => r.level === level);
      if (!reward) return false;

      const rewardItem = isPremium && battlePass.isPremium ? reward.premium : reward.free;
      if (!rewardItem) return false;

      // Grant reward
      await this.grantReward(userId, rewardItem);

      // Mark as claimed
      const bpRef = doc(firestore, 'battlePasses', userId);
      await updateDoc(bpRef, {
        claimedRewards: [...battlePass.claimedRewards, level],
      });

      analytics.logEvent('battle_pass_reward_claimed', {
        user_id: userId,
        level,
        reward_type: rewardItem.type,
        is_premium: isPremium,
      });

      return true;
    } catch (error) {
      console.error('Failed to claim reward:', error);
      return false;
    }
  }

  /**
   * Grant reward to user
   */
  private async grantReward(userId: string, reward: any): Promise<void> {
    const userRef = doc(firestore, 'users', userId);

    switch (reward.type) {
      case 'coins':
        await updateDoc(userRef, {
          'currency.coins': increment(reward.amount),
        });
        console.log(`Granted ${reward.amount} coins to user ${userId}`);
        break;

      case 'premium':
        await updateDoc(userRef, {
          'currency.gems': increment(reward.amount),
        });
        console.log(`Granted ${reward.amount} gems to user ${userId}`);
        break;

      case 'avatar':
        if (reward.itemId) {
          await avatarService.unlockItem(userId, reward.itemId, 'achievement');
        }
        break;

      case 'title':
        await updateDoc(userRef, {
          unlockedTitles: [...(await this.getUnlockedTitles(userId)), reward.itemId],
        });
        break;

      case 'badge':
        await updateDoc(userRef, {
          badges: [...(await this.getBadges(userId)), reward.itemId],
        });
        break;
    }
  }

  /**
   * Purchase level skips
   */
  async purchaseLevelSkip(userId: string, levels: 1 | 5 | 10 | 25): Promise<boolean> {
    try {
      const battlePass = await this.getUserBattlePass(userId);
      if (!battlePass) return false;

      // Check if would exceed max level
      if (battlePass.currentLevel + levels > this.currentSeason.maxLevel) {
        return false;
      }

      // Get price
      let price: number;
      switch (levels) {
        case 1:
          price = LEVEL_SKIP_PRICES.SINGLE;
          break;
        case 5:
          price = LEVEL_SKIP_PRICES.FIVE;
          break;
        case 10:
          price = LEVEL_SKIP_PRICES.TEN;
          break;
        case 25:
          price = LEVEL_SKIP_PRICES.TWENTY_FIVE;
          break;
      }

      // Process purchase (in production, use real IAP)
      // For now, simulate successful purchase in development
      if (__DEV__) {
        console.log(`Battle Pass: Simulating level skip purchase (${levels} levels) in dev mode`);
      }
      
      const bpRef = doc(firestore, 'battlePasses', userId);
      await updateDoc(bpRef, {
        currentLevel: battlePass.currentLevel + levels,
        currentXP: 0,
      });

      analytics.logEvent('battle_pass_level_skip', {
        user_id: userId,
        levels_purchased: levels,
        price,
        new_level: battlePass.currentLevel + levels,
      });

      return true;
    } catch (error) {
      console.error('Failed to purchase level skip:', error);
      return false;
    }
  }

  /**
   * Get battle pass stats
   */
  async getBattlePassStats(userId: string): Promise<BattlePassStats | null> {
    try {
      const battlePass = await this.getUserBattlePass(userId);
      if (!battlePass) return null;

      const nextLevelXP = this.currentSeason.xpPerLevel;
      const progressPercent = (battlePass.currentXP / nextLevelXP) * 100;
      const totalRewards = this.currentSeason.rewards.length;
      const daysRemaining = Math.ceil(
        (this.currentSeason.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        totalXP: battlePass.currentLevel * nextLevelXP + battlePass.currentXP,
        currentLevel: battlePass.currentLevel,
        nextLevelXP,
        progressPercent,
        claimedRewards: battlePass.claimedRewards.length,
        totalRewards,
        daysRemaining,
        isPremium: battlePass.isPremium,
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Check if season is active
   */
  isSeasonActive(): boolean {
    const now = Date.now();
    return (
      now >= this.currentSeason.startDate.getTime() &&
      now <= this.currentSeason.endDate.getTime()
    );
  }

  /**
   * Get days remaining in season
   */
  getDaysRemaining(): number {
    const now = Date.now();
    const end = this.currentSeason.endDate.getTime();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  /**
   * Helper methods
   */
  private async getUnlockedTitles(userId: string): Promise<string[]> {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.data()?.unlockedTitles || [];
  }

  private async getBadges(userId: string): Promise<string[]> {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.data()?.badges || [];
  }

  /**
   * Auto-claim all available rewards
   */
  async claimAllRewards(userId: string): Promise<number> {
    const battlePass = await this.getUserBattlePass(userId);
    if (!battlePass) return 0;

    let claimed = 0;
    for (let level = 1; level <= battlePass.currentLevel; level++) {
      if (!battlePass.claimedRewards.includes(level)) {
        const success = await this.claimReward(userId, level, battlePass.isPremium);
        if (success) claimed++;
      }
    }

    return claimed;
  }
}

// Export singleton
export const battlePassService = new BattlePassService();

// Export convenience functions
export const battlePass = {
  initialize: () => battlePassService.initialize(),
  fetchActiveSeason: () => battlePassService.fetchActiveSeason(),
  getCurrentSeason: () => battlePassService.getCurrentSeason(),
  getUserBattlePass: (userId: string) => battlePassService.getUserBattlePass(userId),
  purchasePremium: (userId: string) => battlePassService.purchasePremium(userId),
  addXP: (userId: string, xp: number, source: string) => battlePassService.addXP(userId, xp, source),
  claimReward: (userId: string, level: number, isPremium: boolean) =>
    battlePassService.claimReward(userId, level, isPremium),
  purchaseLevelSkip: (userId: string, levels: 1 | 5 | 10 | 25) =>
    battlePassService.purchaseLevelSkip(userId, levels),
  getBattlePassStats: (userId: string) => battlePassService.getBattlePassStats(userId),
  isSeasonActive: () => battlePassService.isSeasonActive(),
  getDaysRemaining: () => battlePassService.getDaysRemaining(),
  claimAllRewards: (userId: string) => battlePassService.claimAllRewards(userId),
};
