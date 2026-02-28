/**
 * One-time function to initialize all collections
 * Call via: https://us-central1-wittsy-51992.cloudfunctions.net/initializeCollections
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.initializeCollections = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  
  try {
    console.log('🚀 Initializing collections...');
    
    // 1. Create Season 1
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);
    
    await db.collection('seasons').doc('season_1').set({
      id: 'season_1',
      number: 1,
      name: 'Season 1: The Beginning',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      theme: 'launch',
      description: 'The inaugural season of WITTSY!',
      rewards: [
        { rank: 'Legend', tier: 'Legend', minRating: 4000, rewards: { title: 'Legendary Champion', badge: 'legendary_season', xp: 5000 } },
        { rank: 'Grandmaster', tier: 'Grandmaster', minRating: 3500, rewards: { title: 'Season Grandmaster', badge: 'grandmaster_season', xp: 3000 } },
        { rank: 'Master', tier: 'Master', minRating: 3000, rewards: { title: 'Season Master', badge: 'master_season', xp: 2000 } },
        { rank: 'Diamond I', tier: 'Diamond', minRating: 2500, rewards: { badge: 'diamond_season', xp: 1500 } },
        { rank: 'Platinum I', tier: 'Platinum', minRating: 2000, rewards: { badge: 'platinum_season', xp: 1000 } },
        { rank: 'Gold I', tier: 'Gold', minRating: 1500, rewards: { badge: 'gold_season', xp: 500 } },
      ]
    });
    
    // 2. Initialize all other collections with placeholders
    const collections = [
      'friendships', 'friendRequests', 'achievements', 'seasonStats',
      'ratingHistory', 'promptSubmissions', 'phraseReports', 'userPromptPreferences',
      'promptPacks', 'gameInvites', 'challengeProgress', 'events',
      'tournaments', 'notifications', 'leaderboards', 'matches', 'chatMessages',
      'avatars', 'battlePassSeasons', 'userBattlePass'
    ];
    
    for (const collection of collections) {
      await db.collection(collection).doc('_placeholder').set({
        _placeholder: true,
        initialized: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'All collections initialized successfully!',
      collections: ['seasons', ...collections]
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
