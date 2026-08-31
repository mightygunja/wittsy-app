/**
 * Daily Login Rewards Service
 * Tracks daily logins and distributes rewards
 */

import { firestore } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { analytics } from './analytics';
import { monetization } from './monetization';

// Daily reward structure
export const DAILY_REWARDS = [
  { day: 1, coins: 50, bonus: false },
  { day: 2, coins: 75, bonus: false },
  { day: 3, coins: 100, bonus: false },
  { day: 4, coins: 125, bonus: false },
  { day: 5, coins: 150, bonus: false },
  { day: 6, coins: 200, bonus: false },
  { day: 7, coins: 500, bonus: true }, // Week completion bonus
];

export interface DailyRewardData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string; // ISO date string (YYYY-MM-DD)
  totalRewardsClaimed: number;
  totalCoinsEarned: number;
  claimHistory: {
    date: string;
    day: number;
    coins: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

class DailyRewardsService {
  /**
   * Get today's date in YYYY-MM-DD format (local timezone)
   */
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Check if two dates are consecutive days
   */
  private isConsecutiveDay(lastDate: string, currentDate: string): boolean {
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  /**
   * Initialize daily rewards data for a new user
   */
  async initializeDailyRewards(userId: string): Promise<DailyRewardData> {
    try {
      const rewardData: DailyRewardData = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastClaimDate: '',
        totalRewardsClaimed: 0,
        totalCoinsEarned: 0,
        claimHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const rewardRef = doc(firestore, 'dailyRewards', userId);
      await setDoc(rewardRef, rewardData);

      console.log('✅ Daily rewards initialized for user:', userId);
      return rewardData;
    } catch (error) {
      console.error('❌ Failed to initialize daily rewards:', error);
      throw error;
    }
  }

  /**
   * Get daily rewards data for a user
   */
  async getDailyRewardsData(userId: string): Promise<DailyRewardData | null> {
    try {
      const rewardRef = doc(firestore, 'dailyRewards', userId);
      const rewardDoc = await getDoc(rewardRef);

      if (rewardDoc.exists()) {
        return rewardDoc.data() as DailyRewardData;
      }

      // Initialize if doesn't exist
      return await this.initializeDailyRewards(userId);
    } catch (error: any) {
      // Silently handle permission errors - user may not have access yet
      if (error?.code !== 'permission-denied') {
        console.error('Daily rewards error:', error);
      }
      return null;
    }
  }

  /**
   * Check if user can claim today's reward
   */
  async canClaimToday(userId: string): Promise<{
    canClaim: boolean;
    nextReward: { day: number; coins: number; bonus: boolean } | null;
    currentStreak: number;
    alreadyClaimed: boolean;
  }> {
    try {
      const data = await this.getDailyRewardsData(userId);
      if (!data) {
        return { canClaim: true, nextReward: DAILY_REWARDS[0], currentStreak: 0, alreadyClaimed: false };
      }

      const today = this.getTodayDateString();
      const alreadyClaimed = data.lastClaimDate === today;

      if (alreadyClaimed) {
        return { canClaim: false, nextReward: null, currentStreak: data.currentStreak, alreadyClaimed: true };
      }

      // Calculate next reward day
      let nextDay = 1;
      if (data.lastClaimDate) {
        if (this.isConsecutiveDay(data.lastClaimDate, today)) {
          // Consecutive day - continue streak
          // If currentStreak is 2, next day is 3
          const nextStreakDay = data.currentStreak + 1;
          // Wrap around after day 7 (1-7 cycle)
          nextDay = ((nextStreakDay - 1) % 7) + 1;
        } else {
          // Streak broken - reset to day 1
          nextDay = 1;
        }
      }

      const nextReward = DAILY_REWARDS[nextDay - 1];
      return { canClaim: true, nextReward, currentStreak: data.currentStreak, alreadyClaimed: false };
    } catch (error) {
      console.error('❌ Failed to check claim status:', error);
      return { canClaim: false, nextReward: null, currentStreak: 0, alreadyClaimed: false };
    }
  }

  /**
   * Claim today's daily reward
   */
  async claimDailyReward(userId: string): Promise<{
    success: boolean;
    reward?: { day: number; coins: number; bonus: boolean };
    newStreak?: number;
    error?: string;
  }> {
    try {
      const claimStatus = await this.canClaimToday(userId);

      if (!claimStatus.canClaim) {
        return {
          success: false,
          error: claimStatus.alreadyClaimed ? 'Already claimed today' : 'Cannot claim today',
        };
      }

      if (!claimStatus.nextReward) {
        return { success: false, error: 'No reward available' };
      }

      let data = await this.getDailyRewardsData(userId);
      if (!data) {
        console.log('⚠️ Daily rewards data not found, attempting to initialize...');
        try {
          data = await this.initializeDailyRewards(userId);
          console.log('✅ Daily rewards initialized during claim');
        } catch (initError) {
          console.error('❌ Failed to initialize during claim:', initError);
          return { success: false, error: 'Failed to initialize user data' };
        }
      }

      const today = this.getTodayDateString();
      const reward = claimStatus.nextReward;

      // Atomic claim: the old flow granted coins FIRST and marked the claim
      // afterwards with no re-check — two rapid taps (or a mid-flow failure)
      // could double-grant or grant without recording. The transaction
      // re-verifies today's claim and writes coins + claim mark together.
      const rewardRef = doc(firestore, 'dailyRewards', userId);
      const userRef = doc(firestore, 'users', userId);

      const claimOutcome = await runTransaction(firestore, async (tx) => {
        const rewardSnap = await tx.get(rewardRef);
        if (!rewardSnap.exists()) {
          throw new Error('Daily rewards not initialized');
        }
        const fresh = rewardSnap.data() as any;
        if (fresh.lastClaimDate === today) {
          return { alreadyClaimed: true as const, newStreak: fresh.currentStreak || 1 };
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('User not found');
        }

        let freshStreak = 1;
        if (fresh.lastClaimDate && this.isConsecutiveDay(fresh.lastClaimDate, today)) {
          freshStreak = (fresh.currentStreak || 0) + 1;
        }

        tx.update(userRef, { coins: (userSnap.data().coins || 0) + reward.coins });
        tx.update(rewardRef, {
          currentStreak: freshStreak,
          longestStreak: Math.max(freshStreak, fresh.longestStreak || 0),
          lastClaimDate: today,
          totalRewardsClaimed: increment(1),
          totalCoinsEarned: increment(reward.coins),
          claimHistory: [
            ...(fresh.claimHistory || []).slice(-29), // Keep last 30 days
            { date: today, day: reward.day, coins: reward.coins },
          ],
          updatedAt: new Date().toISOString(),
        });
        return { alreadyClaimed: false as const, newStreak: freshStreak };
      });

      if (claimOutcome.alreadyClaimed) {
        return { success: false, error: 'You already claimed today\'s reward. Come back tomorrow!' };
      }

      const newStreak = claimOutcome.newStreak;

      // Log analytics
      analytics.logEvent('daily_reward_claimed', {
        user_id: userId,
        day: reward.day,
        coins: reward.coins,
        streak: newStreak,
        bonus: reward.bonus,
      });

      console.log(`✅ Daily reward claimed: Day ${reward.day}, ${reward.coins} coins, Streak: ${newStreak}`);

      return {
        success: true,
        reward,
        newStreak,
      };
    } catch (error) {
      console.error('❌ Failed to claim daily reward:', error);
      return { success: false, error: 'Failed to claim reward' };
    }
  }

  /**
   * Get reward preview for the next 7 days
   */
  getRewardPreview(currentStreak: number): typeof DAILY_REWARDS {
    const startDay = (currentStreak % 7) + 1;
    const preview = [];

    for (let i = 0; i < 7; i++) {
      const dayIndex = ((startDay - 1 + i) % 7);
      preview.push(DAILY_REWARDS[dayIndex]);
    }

    return preview;
  }

  /**
   * Get stats for display
   */
  async getRewardStats(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalRewardsClaimed: number;
    totalCoinsEarned: number;
    canClaimToday: boolean;
    nextReward: { day: number; coins: number; bonus: boolean } | null;
  } | null> {
    try {
      const data = await this.getDailyRewardsData(userId);
      if (!data) return null;

      const claimStatus = await this.canClaimToday(userId);

      return {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        totalRewardsClaimed: data.totalRewardsClaimed,
        totalCoinsEarned: data.totalCoinsEarned,
        canClaimToday: claimStatus.canClaim,
        nextReward: claimStatus.nextReward,
      };
    } catch (error) {
      console.error('❌ Failed to get reward stats:', error);
      return null;
    }
  }
}

export const dailyRewardsService = new DailyRewardsService();
