/**
 * Battle Pass Service
 * Manage seasons, progression, and rewards
 */

import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, limit, orderBy, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
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

/**
 * Firestore document shape for a user's battle pass.
 * `claimedRewards` tracks the FREE track; `claimedPremiumRewards` tracks the
 * premium track, so upgrading to premium never voids rewards on either track.
 */
export interface UserBattlePassDoc extends UserBattlePass {
  claimedPremiumRewards?: number[];
}

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
      // ✅ Use react-native-iap for battle pass premium
      // NOTE: The actual granting of premium status happens in monetization.handlePurchaseUpdate()
      // after Apple confirms the purchase. This just triggers the purchase flow.
      const result = await monetization.purchaseProduct('com.wittz.battlepass.premium');
      
      if (!result.success) {
        console.error('Battle Pass purchase failed:', result.error);
        return false;
      }

      console.log('✅ Battle Pass premium purchase initiated');
      // Purchase successful - benefit will be granted by purchaseUpdateListener
      return true;
    } catch (error) {
      console.error('Failed to purchase premium:', error);
      return false;
    }
  }

  /**
   * Add XP to user's battle pass
   * Returns level up info if leveled up
   */
  async addXP(userId: string, xp: number, source: string): Promise<{ leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
    try {
      const battlePass = await this.getUserBattlePass(userId);
      if (!battlePass) return { leveledUp: false };

      const bpRef = doc(firestore, 'battlePasses', userId);
      let newXP = battlePass.currentXP + xp;
      let newLevel = battlePass.currentLevel;
      const oldLevel = battlePass.currentLevel;
      let leveledUp = false;

      // Check for level ups
      while (newXP >= this.currentSeason.xpPerLevel && newLevel < this.currentSeason.maxLevel) {
        newXP -= this.currentSeason.xpPerLevel;
        newLevel++;
        leveledUp = true;

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

      return { leveledUp, newLevel: leveledUp ? newLevel : undefined, oldLevel: leveledUp ? oldLevel : undefined };
    } catch (error) {
      console.error('Failed to add XP:', error);
      return { leveledUp: false };
    }
  }

  /**
   * Claim reward at specific level.
   * Grants every unclaimed track at that level (free always; premium too when
   * the user owns premium), and marks the claim inside a transaction so a
   * double-tap or a concurrent "Claim All" can never grant the same reward twice.
   */
  async claimReward(userId: string, level: number, _isPremium?: boolean): Promise<boolean> {
    try {
      const reward = this.currentSeason.rewards.find((r) => r.level === level);
      if (!reward) return false;

      const bpRef = doc(firestore, 'battlePasses', userId);

      // Atomically mark unclaimed tracks as claimed before granting anything.
      const toGrant = await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(bpRef);
        if (!snap.exists()) return [] as { item: any; track: 'free' | 'premium' }[];

        const bp = snap.data() as UserBattlePassDoc;
        if (bp.currentLevel < level) return [];

        const claimedFree = bp.claimedRewards || [];
        const claimedPremium = bp.claimedPremiumRewards || [];
        const grants: { item: any; track: 'free' | 'premium' }[] = [];
        const updates: any = {};

        if (reward.free && !claimedFree.includes(level)) {
          grants.push({ item: reward.free, track: 'free' });
          updates.claimedRewards = arrayUnion(level);
        }
        if (bp.isPremium && reward.premium && !claimedPremium.includes(level)) {
          grants.push({ item: reward.premium, track: 'premium' });
          updates.claimedPremiumRewards = arrayUnion(level);
        }

        if (grants.length === 0) return [];
        tx.update(bpRef, updates);
        return grants;
      });

      if (toGrant.length === 0) return false;

      for (const grant of toGrant) {
        try {
          await this.grantReward(userId, grant.item);
        } catch (grantError) {
          // The claim mark committed but the grant failed — roll the mark
          // back so the reward isn't permanently burned and can be retried.
          const field = grant.track === 'free' ? 'claimedRewards' : 'claimedPremiumRewards';
          await updateDoc(bpRef, { [field]: arrayRemove(level) }).catch((rollbackError) =>
            console.error('Failed to roll back claim mark:', rollbackError)
          );
          console.error('Battle pass grant failed; claim rolled back for retry:', grantError);
          return false;
        }

        analytics.logEvent('battle_pass_reward_claimed', {
          user_id: userId,
          level,
          reward_type: grant.item.type,
          is_premium: grant.track === 'premium',
        });
      }

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
          coins: increment(reward.amount),
        });
        console.log(`Granted ${reward.amount} coins to user ${userId}`);
        break;

      case 'premium':
        await updateDoc(userRef, {
          coins: increment(reward.amount),
        });
        console.log(`Granted ${reward.amount} coins to user ${userId}`);
        break;

      case 'avatar':
        if (reward.itemId) {
          await avatarService.unlockItem(userId, reward.itemId, 'season');
          console.log(`✅ Unlocked avatar item ${reward.itemId} for user ${userId}`);
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

      // ✅ Use react-native-iap for level skips
      // NOTE: The actual granting of levels happens in monetization.handlePurchaseUpdate()
      // after Apple confirms the purchase. This just triggers the purchase flow.
      const productId = `com.wittz.battlepass.skip.${levels}`;
      const result = await monetization.purchaseProduct(productId);
      
      if (!result.success) {
        console.error('Level skip purchase failed:', result.error);
        return false;
      }

      console.log(`✅ Level skip purchase initiated for ${levels} levels`);
      // Purchase successful - levels will be granted by purchaseUpdateListener
      return true;
    } catch (error) {
      console.error('Failed to purchase level skip:', error);
      return false;
    }
  }

  /**
   * Get battle pass stats
   */
  /**
   * Pure stats computation from a battle pass doc — the single source of
   * truth used by both the fetch-based path and live snapshot listeners
   * (previously duplicated in BattlePassScreen and prone to drift).
   */
  computeStats(bp: UserBattlePassDoc): BattlePassStats {
    const nextLevelXP = this.currentSeason.xpPerLevel;
    const claimedLevels = new Set([
      ...(bp.claimedRewards || []),
      ...(bp.claimedPremiumRewards || []),
    ]);

    return {
      totalXP: bp.currentLevel * nextLevelXP + bp.currentXP,
      currentLevel: bp.currentLevel,
      nextLevelXP,
      progressPercent: (bp.currentXP / nextLevelXP) * 100,
      claimedRewards: claimedLevels.size,
      totalRewards: this.currentSeason.rewards.length,
      daysRemaining: this.getDaysRemaining(),
      isPremium: bp.isPremium,
    };
  }

  async getBattlePassStats(userId: string): Promise<BattlePassStats | null> {
    try {
      const battlePass = await this.getUserBattlePass(userId);
      if (!battlePass) return null;
      return this.computeStats(battlePass as UserBattlePassDoc);
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
    const battlePass = (await this.getUserBattlePass(userId)) as UserBattlePassDoc | null;
    if (!battlePass) return 0;

    const claimedFree = battlePass.claimedRewards || [];
    const claimedPremium = battlePass.claimedPremiumRewards || [];

    let claimed = 0;
    for (const reward of this.currentSeason.rewards) {
      if (reward.level > battlePass.currentLevel) continue;

      const freeUnclaimed = !!reward.free && !claimedFree.includes(reward.level);
      const premiumUnclaimed =
        battlePass.isPremium && !!reward.premium && !claimedPremium.includes(reward.level);

      if (freeUnclaimed || premiumUnclaimed) {
        const success = await this.claimReward(userId, reward.level);
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
  computeStats: (bp: UserBattlePassDoc) => battlePassService.computeStats(bp),
  isSeasonActive: () => battlePassService.isSeasonActive(),
  getDaysRemaining: () => battlePassService.getDaysRemaining(),
  claimAllRewards: (userId: string) => battlePassService.claimAllRewards(userId),
};
