/**
 * Initialize Battle Pass Seasons in Firestore
 * Run with: node scripts/initSeasons.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SEASON_1 = {
  id: 'season_1',
  name: 'Founders Pass',
  description: 'Exclusive rewards for our founding players!',
  theme: 'Launch',
  startDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-22')),
  endDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-20')),
  price: 4.99,
  maxLevel: 100,
  xpPerLevel: 100,
  featured: true,
  active: true,
  rewards: [
    { level: 1, free: { type: 'coins', amount: 50, icon: '🪙' }, premium: { type: 'coins', amount: 200, icon: '🪙' } },
    { level: 5, free: { type: 'avatar', itemId: 'hair_short_blue', name: 'Blue Hair', icon: '💇', rarity: 'rare' }, premium: { type: 'avatar', itemId: 'hair_fire', name: 'Fire Hair', icon: '🔥', rarity: 'legendary' } },
    { level: 10, premium: { type: 'coins', amount: 500, icon: '🪙' } },
    { level: 15, free: { type: 'coins', amount: 100, icon: '🪙' }, premium: { type: 'avatar', itemId: 'skin_founder', name: 'Founder Skin', icon: '👤', rarity: 'exclusive' } },
    { level: 20, premium: { type: 'premium', amount: 10, icon: '💎' } },
    { level: 25, free: { type: 'avatar', itemId: 'bg_gradient_founder', name: 'Founder BG', icon: '🎨', rarity: 'epic' }, premium: { type: 'avatar', itemId: 'bg_animated_founder', name: 'Animated Founder BG', icon: '✨', rarity: 'legendary' } },
    { level: 30, premium: { type: 'coins', amount: 750, icon: '🪙' } },
    { level: 35, free: { type: 'coins', amount: 150, icon: '🪙' }, premium: { type: 'xp_boost', amount: 50, name: 'XP Boost 50%', icon: '⚡' } },
    { level: 40, premium: { type: 'avatar', itemId: 'eyes_founder', name: 'Founder Eyes', icon: '👁️', rarity: 'epic' } },
    { level: 50, free: { type: 'title', itemId: 'dedicated', name: 'Dedicated', icon: '🏅' }, premium: { type: 'avatar', itemId: 'founder_set_1', name: 'Founder Set', icon: '👑', rarity: 'exclusive' } },
    { level: 60, premium: { type: 'coins', amount: 1000, icon: '🪙' } },
    { level: 70, free: { type: 'coins', amount: 200, icon: '🪙' }, premium: { type: 'premium', amount: 25, icon: '💎' } },
    { level: 75, premium: { type: 'avatar', itemId: 'fx_founder_aura', name: 'Founder Aura', icon: '✨', rarity: 'legendary' } },
    { level: 80, premium: { type: 'coins', amount: 1500, icon: '🪙' } },
    { level: 90, free: { type: 'coins', amount: 500, icon: '🪙' }, premium: { type: 'avatar', itemId: 'acc_founder_crown', name: 'Founder Crown', icon: '👑', rarity: 'exclusive' } },
    { level: 100, free: { type: 'title', itemId: 'completionist', name: 'Completionist', icon: '🏆' }, premium: { type: 'avatar', itemId: 'founder_ultimate_set', name: 'Ultimate Founder Set', icon: '💫', rarity: 'exclusive' } },
  ],
};

const SEASON_2 = {
  id: 'season_2',
  name: 'Winter Wonderland',
  description: 'Festive winter rewards and icy adventures!',
  theme: 'Winter',
  startDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-21')),
  endDate: admin.firestore.Timestamp.fromDate(new Date('2026-04-21')),
  price: 4.99,
  maxLevel: 100,
  xpPerLevel: 100,
  featured: false,
  active: false,
  rewards: [
    { level: 1, free: { type: 'coins', amount: 50, icon: '🪙' }, premium: { type: 'coins', amount: 200, icon: '🪙' } },
    { level: 5, free: { type: 'avatar', itemId: 'hair_icy_blue', name: 'Icy Blue Hair', icon: '❄️', rarity: 'rare' }, premium: { type: 'avatar', itemId: 'hair_snowflake', name: 'Snowflake Hair', icon: '❄️', rarity: 'legendary' } },
    { level: 10, premium: { type: 'coins', amount: 500, icon: '🪙' } },
    { level: 15, free: { type: 'coins', amount: 100, icon: '🪙' }, premium: { type: 'avatar', itemId: 'skin_winter', name: 'Winter Skin', icon: '⛄', rarity: 'exclusive' } },
    { level: 20, premium: { type: 'premium', amount: 10, icon: '💎' } },
    { level: 25, free: { type: 'avatar', itemId: 'bg_winter', name: 'Winter BG', icon: '🌨️', rarity: 'epic' }, premium: { type: 'avatar', itemId: 'bg_animated_snow', name: 'Animated Snow BG', icon: '❄️', rarity: 'legendary' } },
    { level: 30, premium: { type: 'coins', amount: 750, icon: '🪙' } },
    { level: 35, free: { type: 'coins', amount: 150, icon: '🪙' }, premium: { type: 'xp_boost', amount: 50, name: 'XP Boost 50%', icon: '⚡' } },
    { level: 40, premium: { type: 'avatar', itemId: 'eyes_winter', name: 'Winter Eyes', icon: '👁️', rarity: 'epic' } },
    { level: 50, free: { type: 'title', itemId: 'winter_warrior', name: 'Winter Warrior', icon: '⛄' }, premium: { type: 'avatar', itemId: 'winter_set_1', name: 'Winter Set', icon: '❄️', rarity: 'exclusive' } },
    { level: 60, premium: { type: 'coins', amount: 1000, icon: '🪙' } },
    { level: 70, free: { type: 'coins', amount: 200, icon: '🪙' }, premium: { type: 'premium', amount: 25, icon: '💎' } },
    { level: 75, premium: { type: 'avatar', itemId: 'fx_winter_aura', name: 'Winter Aura', icon: '❄️', rarity: 'legendary' } },
    { level: 80, premium: { type: 'coins', amount: 1500, icon: '🪙' } },
    { level: 90, free: { type: 'coins', amount: 500, icon: '🪙' }, premium: { type: 'avatar', itemId: 'acc_winter_crown', name: 'Ice Crown', icon: '👑', rarity: 'exclusive' } },
    { level: 100, free: { type: 'title', itemId: 'winter_legend', name: 'Winter Legend', icon: '🏆' }, premium: { type: 'avatar', itemId: 'winter_ultimate_set', name: 'Ultimate Winter Set', icon: '❄️', rarity: 'exclusive' } },
  ],
};

async function initializeSeasons() {
  try {
    console.log('🚀 Initializing Battle Pass seasons...\n');

    // Season 1
    await db.collection('battlePassSeasons').doc(SEASON_1.id).set(SEASON_1);
    console.log('✅ Season 1 (Founders Pass) created - ACTIVE');
    console.log(`   Start: ${SEASON_1.startDate.toDate().toDateString()}`);
    console.log(`   End: ${SEASON_1.endDate.toDate().toDateString()}\n`);

    // Season 2
    await db.collection('battlePassSeasons').doc(SEASON_2.id).set(SEASON_2);
    console.log('✅ Season 2 (Winter Wonderland) created - INACTIVE');
    console.log(`   Start: ${SEASON_2.startDate.toDate().toDateString()}`);
    console.log(`   End: ${SEASON_2.endDate.toDate().toDateString()}\n`);

    console.log('🎉 All seasons initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Seasons will switch automatically based on dates');
    console.log('   2. Activate Season 2 manually if needed');
    console.log('   3. Create Season 3 before Season 2 ends\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize seasons:', error);
    process.exit(1);
  }
}

initializeSeasons();
