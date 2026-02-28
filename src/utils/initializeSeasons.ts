/**
 * Initialize Battle Pass Seasons in Firestore
 * Run this once to populate seasons
 */

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { SEASON_1 } from '../types/battlePass';

// Season 2: Winter Wonderland
const SEASON_2 = {
  id: 'season_2',
  name: 'Winter Wonderland',
  description: 'Festive winter rewards and icy adventures!',
  theme: 'Winter',
  startDate: new Date('2026-02-21'),
  endDate: new Date('2026-04-21'),
  price: 4.99,
  maxLevel: 100,
  xpPerLevel: 100,
  featured: false,
  active: false,
  rewards: [
    // Level 1
    {
      level: 1,
      free: { type: 'coins', amount: 50, icon: '🪙' },
      premium: { type: 'coins', amount: 200, icon: '🪙' },
    },
    // Level 5
    {
      level: 5,
      free: { type: 'avatar', itemId: 'hair_icy_blue', name: 'Icy Blue Hair', icon: '❄️', rarity: 'rare' },
      premium: { type: 'avatar', itemId: 'hair_snowflake', name: 'Snowflake Hair', icon: '❄️', rarity: 'legendary' },
    },
    // Level 10
    {
      level: 10,
      premium: { type: 'coins', amount: 500, icon: '🪙' },
    },
    // Level 15
    {
      level: 15,
      free: { type: 'coins', amount: 100, icon: '🪙' },
      premium: { type: 'avatar', itemId: 'skin_winter', name: 'Winter Skin', icon: '⛄', rarity: 'exclusive' },
    },
    // Level 20
    {
      level: 20,
      premium: { type: 'premium', amount: 10, icon: '💎' },
    },
    // Level 25
    {
      level: 25,
      free: { type: 'avatar', itemId: 'bg_winter', name: 'Winter BG', icon: '🌨️', rarity: 'epic' },
      premium: { type: 'avatar', itemId: 'bg_animated_snow', name: 'Animated Snow BG', icon: '❄️', rarity: 'legendary' },
    },
    // Level 30
    {
      level: 30,
      premium: { type: 'coins', amount: 750, icon: '🪙' },
    },
    // Level 35
    {
      level: 35,
      free: { type: 'coins', amount: 150, icon: '🪙' },
      premium: { type: 'xp_boost', amount: 50, name: 'XP Boost 50%', icon: '⚡' },
    },
    // Level 40
    {
      level: 40,
      premium: { type: 'avatar', itemId: 'eyes_winter', name: 'Winter Eyes', icon: '👁️', rarity: 'epic' },
    },
    // Level 50
    {
      level: 50,
      free: { type: 'title', itemId: 'winter_warrior', name: 'Winter Warrior', icon: '⛄' },
      premium: { type: 'avatar', itemId: 'winter_set_1', name: 'Winter Set', icon: '❄️', rarity: 'exclusive' },
    },
    // Level 60
    {
      level: 60,
      premium: { type: 'coins', amount: 1000, icon: '🪙' },
    },
    // Level 70
    {
      level: 70,
      free: { type: 'coins', amount: 200, icon: '🪙' },
      premium: { type: 'premium', amount: 25, icon: '💎' },
    },
    // Level 75
    {
      level: 75,
      premium: { type: 'avatar', itemId: 'fx_winter_aura', name: 'Winter Aura', icon: '❄️', rarity: 'legendary' },
    },
    // Level 80
    {
      level: 80,
      premium: { type: 'coins', amount: 1500, icon: '🪙' },
    },
    // Level 90
    {
      level: 90,
      free: { type: 'coins', amount: 500, icon: '🪙' },
      premium: { type: 'avatar', itemId: 'acc_winter_crown', name: 'Ice Crown', icon: '👑', rarity: 'exclusive' },
    },
    // Level 100
    {
      level: 100,
      free: { type: 'title', itemId: 'winter_legend', name: 'Winter Legend', icon: '🏆' },
      premium: {
        type: 'avatar',
        itemId: 'winter_ultimate_set',
        name: 'Ultimate Winter Set',
        icon: '❄️',
        rarity: 'exclusive',
      },
    },
  ],
};

export async function initializeSeasons() {
  try {
    console.log('Initializing Battle Pass seasons...');

    // Season 1 - Active
    const season1Data = {
      ...SEASON_1,
      active: true,
      startDate: Timestamp.fromDate(SEASON_1.startDate),
      endDate: Timestamp.fromDate(SEASON_1.endDate),
    };

    await setDoc(doc(firestore, 'battlePassSeasons', SEASON_1.id), season1Data);
    console.log('✅ Season 1 created');

    // Season 2 - Inactive (will activate automatically on start date)
    const season2Data = {
      ...SEASON_2,
      active: false,
      startDate: Timestamp.fromDate(SEASON_2.startDate),
      endDate: Timestamp.fromDate(SEASON_2.endDate),
    };

    await setDoc(doc(firestore, 'battlePassSeasons', SEASON_2.id), season2Data);
    console.log('✅ Season 2 created');

    console.log('🎉 All seasons initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize seasons:', error);
    return false;
  }
}

// Helper function to activate a season
export async function activateSeason(seasonId: string) {
  try {
    await setDoc(
      doc(firestore, 'battlePassSeasons', seasonId),
      { active: true },
      { merge: true }
    );
    console.log(`✅ Season ${seasonId} activated`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to activate season ${seasonId}:`, error);
    return false;
  }
}

// Helper function to deactivate a season
export async function deactivateSeason(seasonId: string) {
  try {
    await setDoc(
      doc(firestore, 'battlePassSeasons', seasonId),
      { active: false },
      { merge: true }
    );
    console.log(`✅ Season ${seasonId} deactivated`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to deactivate season ${seasonId}:`, error);
    return false;
  }
}
