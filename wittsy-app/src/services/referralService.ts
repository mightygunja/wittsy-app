/**
 * Referral Service
 * Handles invite codes, referral tracking, and rewards
 */

import { firestore } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection,
  query,
  where,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { analytics } from './analytics';
import { monetization } from './monetization';

// Referral rewards configuration
export const REFERRAL_REWARDS = {
  INVITER_PER_FRIEND: 100,        // Coins per friend who joins
  INVITEE_BONUS: 100,             // Coins for new user who uses code
  MILESTONE_3_FRIENDS: 500,       // Bonus for inviting 3 friends
  MILESTONE_5_FRIENDS: 1000,      // Bonus for inviting 5 friends
  MILESTONE_10_FRIENDS: 2500,     // Bonus for inviting 10 friends
};

export interface ReferralData {
  userId: string;
  referralCode: string;
  referredBy?: string;            // User ID who referred this user
  referredByCode?: string;        // Referral code used
  referredUsers: string[];        // Array of user IDs referred
  totalReferrals: number;
  coinsEarned: number;
  milestonesReached: number[];    // [3, 5, 10]
  createdAt: string;
  lastReferralAt?: string;
}

class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  private generateReferralCode(userId: string, username: string): string {
    // Create code from username (first 4 chars) + random 4 chars
    const userPart = username.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${userPart}${randomPart}`;
  }

  /**
   * Initialize referral data for a new user
   */
  async initializeReferralData(
    userId: string, 
    username: string,
    referralCode?: string
  ): Promise<ReferralData> {
    try {
      const userReferralCode = this.generateReferralCode(userId, username);
      
      const referralData: ReferralData = {
        userId,
        referralCode: userReferralCode,
        referredUsers: [],
        totalReferrals: 0,
        coinsEarned: 0,
        milestonesReached: [],
        createdAt: new Date().toISOString(),
      };

      // If user was referred by someone, process the referral
      if (referralCode) {
        await this.processReferral(userId, referralCode, referralData);
      }

      // Save referral data
      const referralRef = doc(firestore, 'referrals', userId);
      await setDoc(referralRef, referralData);

      console.log('✅ Referral data initialized:', userReferralCode);
      return referralData;
    } catch (error) {
      console.error('❌ Failed to initialize referral data:', error);
      throw error;
    }
  }

  /**
   * Process a referral when a new user signs up with a code
   */
  private async processReferral(
    newUserId: string,
    referralCode: string,
    newUserReferralData: ReferralData
  ): Promise<void> {
    try {
      // Find the referrer by code
      const referrerId = await this.findUserByReferralCode(referralCode);
      
      if (!referrerId) {
        console.warn('⚠️ Invalid referral code:', referralCode);
        return;
      }

      // Don't allow self-referral
      if (referrerId === newUserId) {
        console.warn('⚠️ Self-referral attempt blocked');
        return;
      }

      // Update new user's referral data
      newUserReferralData.referredBy = referrerId;
      newUserReferralData.referredByCode = referralCode;

      // Update referrer's data
      const referrerRef = doc(firestore, 'referrals', referrerId);
      const referrerDoc = await getDoc(referrerRef);

      if (referrerDoc.exists()) {
        const referrerData = referrerDoc.data() as ReferralData;
        const newTotalReferrals = (referrerData.totalReferrals || 0) + 1;

        // Update referrer's referral list
        await updateDoc(referrerRef, {
          referredUsers: arrayUnion(newUserId),
          totalReferrals: newTotalReferrals,
          lastReferralAt: new Date().toISOString(),
        });

        // Grant rewards
        await this.grantReferralRewards(referrerId, newUserId, newTotalReferrals);
      }

      // Grant welcome bonus to new user
      await this.grantWelcomeBonus(newUserId);

      analytics.logEvent('referral_completed', {
        referrer_id: referrerId,
        new_user_id: newUserId,
        referral_code: referralCode,
      });

      console.log('✅ Referral processed:', referralCode);
    } catch (error) {
      console.error('❌ Failed to process referral:', error);
    }
  }

  /**
   * Find user ID by referral code
   */
  private async findUserByReferralCode(code: string): Promise<string | null> {
    try {
      const referralsRef = collection(firestore, 'referrals');
      const q = query(referralsRef, where('referralCode', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data().userId;
    } catch (error) {
      console.error('❌ Failed to find user by referral code:', error);
      return null;
    }
  }

  /**
   * Grant rewards to referrer
   */
  private async grantReferralRewards(
    referrerId: string,
    newUserId: string,
    totalReferrals: number
  ): Promise<void> {
    try {
      let coinsToGrant = REFERRAL_REWARDS.INVITER_PER_FRIEND;
      let milestoneReached: number | null = null;

      // Check for milestone bonuses
      if (totalReferrals === 3) {
        coinsToGrant += REFERRAL_REWARDS.MILESTONE_3_FRIENDS;
        milestoneReached = 3;
      } else if (totalReferrals === 5) {
        coinsToGrant += REFERRAL_REWARDS.MILESTONE_5_FRIENDS;
        milestoneReached = 5;
      } else if (totalReferrals === 10) {
        coinsToGrant += REFERRAL_REWARDS.MILESTONE_10_FRIENDS;
        milestoneReached = 10;
      }

      // Grant coins to referrer
      await monetization.grantCoinsToUser(referrerId, coinsToGrant);

      // Update referral stats
      const referralRef = doc(firestore, 'referrals', referrerId);
      const updateData: any = {
        coinsEarned: increment(coinsToGrant),
      };

      if (milestoneReached) {
        updateData.milestonesReached = arrayUnion(milestoneReached);
      }

      await updateDoc(referralRef, updateData);

      // Log analytics
      analytics.logEvent('referral_reward_granted', {
        referrer_id: referrerId,
        coins_granted: coinsToGrant,
        total_referrals: totalReferrals,
        milestone: milestoneReached,
      });

      console.log(`✅ Granted ${coinsToGrant} coins to referrer ${referrerId}`);
    } catch (error) {
      console.error('❌ Failed to grant referral rewards:', error);
    }
  }

  /**
   * Grant welcome bonus to new user who used referral code
   */
  private async grantWelcomeBonus(userId: string): Promise<void> {
    try {
      await monetization.grantCoinsToUser(userId, REFERRAL_REWARDS.INVITEE_BONUS);

      analytics.logEvent('referral_welcome_bonus', {
        user_id: userId,
        coins: REFERRAL_REWARDS.INVITEE_BONUS,
      });

      console.log(`✅ Granted ${REFERRAL_REWARDS.INVITEE_BONUS} welcome bonus to ${userId}`);
    } catch (error) {
      console.error('❌ Failed to grant welcome bonus:', error);
    }
  }

  /**
   * Get referral data for a user
   */
  async getReferralData(userId: string): Promise<ReferralData | null> {
    try {
      const referralRef = doc(firestore, 'referrals', userId);
      const referralDoc = await getDoc(referralRef);

      if (referralDoc.exists()) {
        return referralDoc.data() as ReferralData;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get referral data:', error);
      return null;
    }
  }

  /**
   * Get referral stats for display
   */
  async getReferralStats(userId: string): Promise<{
    referralCode: string;
    totalReferrals: number;
    coinsEarned: number;
    nextMilestone: { count: number; reward: number } | null;
    progress: number;
  } | null> {
    try {
      const data = await this.getReferralData(userId);
      
      if (!data) {
        return null;
      }

      // Calculate next milestone
      let nextMilestone: { count: number; reward: number } | null = null;
      if (data.totalReferrals < 3) {
        nextMilestone = { count: 3, reward: REFERRAL_REWARDS.MILESTONE_3_FRIENDS };
      } else if (data.totalReferrals < 5) {
        nextMilestone = { count: 5, reward: REFERRAL_REWARDS.MILESTONE_5_FRIENDS };
      } else if (data.totalReferrals < 10) {
        nextMilestone = { count: 10, reward: REFERRAL_REWARDS.MILESTONE_10_FRIENDS };
      }

      // Calculate progress to next milestone
      let progress = 0;
      if (nextMilestone) {
        const previousMilestone = nextMilestone.count === 3 ? 0 : nextMilestone.count === 5 ? 3 : 5;
        progress = ((data.totalReferrals - previousMilestone) / (nextMilestone.count - previousMilestone)) * 100;
      } else {
        progress = 100; // All milestones reached
      }

      return {
        referralCode: data.referralCode,
        totalReferrals: data.totalReferrals,
        coinsEarned: data.coinsEarned,
        nextMilestone,
        progress,
      };
    } catch (error) {
      console.error('❌ Failed to get referral stats:', error);
      return null;
    }
  }

  /**
   * Validate a referral code
   */
  async validateReferralCode(code: string): Promise<boolean> {
    try {
      const userId = await this.findUserByReferralCode(code);
      return userId !== null;
    } catch (error) {
      console.error('❌ Failed to validate referral code:', error);
      return false;
    }
  }
}

export const referralService = new ReferralService();
