/**
 * Initialize all Firestore collections with proper structure
 * Run with: node scripts/initializeCollections.js
 */

const admin = require('firebase-admin');

// Initialize with application default credentials
// Make sure you're logged in with: firebase login
admin.initializeApp({
  projectId: 'wittsy-51992'
});

const db = admin.firestore();

async function initializeCollections() {
  console.log('🚀 Initializing Firestore collections...\n');

  try {
    // 1. SEASONS - Create Season 1
    console.log('📅 Creating Season 1...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90); // 90 days

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
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Season 1 created\n');

    // 2. CHALLENGES - Create sample daily challenges
    console.log('🎯 Creating sample challenges...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyChallenges = [
      {
        type: 'daily',
        category: 'wins',
        title: 'Daily Victor',
        description: 'Win 3 games today',
        icon: '🏆',
        requirement: 3,
        reward: { xp: 100, coins: 50 },
        startDate: admin.firestore.Timestamp.fromDate(today),
        endDate: admin.firestore.Timestamp.fromDate(tomorrow),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        type: 'daily',
        category: 'votes',
        title: 'Vote Collector',
        description: 'Earn 20 votes today',
        icon: '⭐',
        requirement: 20,
        reward: { xp: 75, coins: 30 },
        startDate: admin.firestore.Timestamp.fromDate(today),
        endDate: admin.firestore.Timestamp.fromDate(tomorrow),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        type: 'daily',
        category: 'creativity',
        title: 'Star Power',
        description: 'Get 2 star responses today',
        icon: '✨',
        requirement: 2,
        reward: { xp: 150, coins: 75 },
        startDate: admin.firestore.Timestamp.fromDate(today),
        endDate: admin.firestore.Timestamp.fromDate(tomorrow),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    ];

    for (const challenge of dailyChallenges) {
      await db.collection('challenges').add(challenge);
    }
    console.log('✅ Sample challenges created\n');

    // 3. FRIENDSHIPS - Create placeholder (empty collection with structure)
    console.log('👥 Initializing friendships collection...');
    await db.collection('friendships').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        friendId: 'string',
        addedAt: 'timestamp',
        gamesPlayedTogether: 'number',
        favorited: 'boolean'
      }
    });
    console.log('✅ Friendships collection initialized\n');

    // 4. FRIEND REQUESTS - Create placeholder
    console.log('📬 Initializing friend requests collection...');
    await db.collection('friendRequests').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        fromUserId: 'string',
        toUserId: 'string',
        status: 'pending|accepted|rejected|cancelled',
        createdAt: 'timestamp'
      }
    });
    console.log('✅ Friend requests collection initialized\n');

    // 5. ACHIEVEMENTS - Create placeholder
    console.log('🏅 Initializing achievements collection...');
    await db.collection('achievements').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        achievementId: 'string',
        unlockedAt: 'timestamp',
        progress: 'number'
      }
    });
    console.log('✅ Achievements collection initialized\n');

    // 6. SEASON STATS - Create placeholder
    console.log('📊 Initializing season stats collection...');
    await db.collection('seasonStats').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        seasonId: 'string',
        peakRating: 'number',
        gamesPlayed: 'number',
        wins: 'number',
        losses: 'number'
      }
    });
    console.log('✅ Season stats collection initialized\n');

    // 7. RATING HISTORY - Create placeholder
    console.log('📈 Initializing rating history collection...');
    await db.collection('ratingHistory').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        rating: 'number',
        change: 'number',
        reason: 'string',
        timestamp: 'timestamp'
      }
    });
    console.log('✅ Rating history collection initialized\n');

    // 8. PROMPT SUBMISSIONS - Create placeholder
    console.log('💡 Initializing prompt submissions collection...');
    await db.collection('promptSubmissions').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        text: 'string',
        category: 'string',
        submittedBy: 'string',
        status: 'pending|approved|rejected',
        submittedAt: 'timestamp'
      }
    });
    console.log('✅ Prompt submissions collection initialized\n');

    // 9. PHRASE REPORTS - Create placeholder
    console.log('🚨 Initializing phrase reports collection...');
    await db.collection('phraseReports').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        phraseText: 'string',
        reportedBy: 'string',
        reason: 'string',
        roomId: 'string',
        status: 'pending|reviewed',
        reportedAt: 'timestamp'
      }
    });
    console.log('✅ Phrase reports collection initialized\n');

    // 10. USER PROMPT PREFERENCES - Create placeholder
    console.log('⚙️ Initializing user prompt preferences collection...');
    await db.collection('userPromptPreferences').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        enabledCategories: 'array',
        difficulty: 'string',
        customPacks: 'array'
      }
    });
    console.log('✅ User prompt preferences collection initialized\n');

    // 11. PROMPT PACKS - Create placeholder
    console.log('📦 Initializing prompt packs collection...');
    await db.collection('promptPacks').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        name: 'string',
        description: 'string',
        category: 'string',
        promptIds: 'array',
        isPremium: 'boolean',
        createdAt: 'timestamp'
      }
    });
    console.log('✅ Prompt packs collection initialized\n');

    // 12. GAME INVITES - Create placeholder
    console.log('🎮 Initializing game invites collection...');
    await db.collection('gameInvites').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        fromUserId: 'string',
        toUserId: 'string',
        roomId: 'string',
        status: 'pending|accepted|rejected|expired',
        createdAt: 'timestamp',
        expiresAt: 'timestamp'
      }
    });
    console.log('✅ Game invites collection initialized\n');

    // 13. CHALLENGE PROGRESS - Create placeholder
    console.log('📋 Initializing challenge progress collection...');
    await db.collection('challengeProgress').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        challengeId: 'string',
        progress: 'number',
        completed: 'boolean',
        completedAt: 'timestamp'
      }
    });
    console.log('✅ Challenge progress collection initialized\n');

    // 14. EVENTS - Create placeholder
    console.log('🎉 Initializing events collection...');
    await db.collection('events').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        name: 'string',
        description: 'string',
        startDate: 'timestamp',
        endDate: 'timestamp',
        type: 'string',
        rewards: 'object'
      }
    });
    console.log('✅ Events collection initialized\n');

    // 15. TOURNAMENTS - Create placeholder
    console.log('🏆 Initializing tournaments collection...');
    await db.collection('tournaments').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        name: 'string',
        status: 'upcoming|active|completed',
        startDate: 'timestamp',
        endDate: 'timestamp',
        maxParticipants: 'number',
        prizePool: 'object'
      }
    });
    console.log('✅ Tournaments collection initialized\n');

    // 16. NOTIFICATIONS - Create placeholder
    console.log('🔔 Initializing notifications collection...');
    await db.collection('notifications').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        type: 'string',
        title: 'string',
        message: 'string',
        read: 'boolean',
        createdAt: 'timestamp'
      }
    });
    console.log('✅ Notifications collection initialized\n');

    // 17. LEADERBOARDS - Create placeholder
    console.log('🥇 Initializing leaderboards collection...');
    await db.collection('leaderboards').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        userId: 'string',
        username: 'string',
        rating: 'number',
        rank: 'string',
        wins: 'number',
        stars: 'number',
        position: 'number',
        updatedAt: 'timestamp'
      }
    });
    console.log('✅ Leaderboards collection initialized\n');

    // 18. MATCHES - Create placeholder
    console.log('⚔️ Initializing matches collection...');
    await db.collection('matches').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        roomId: 'string',
        players: 'array',
        winner: 'string',
        scores: 'object',
        startedAt: 'timestamp',
        endedAt: 'timestamp'
      }
    });
    console.log('✅ Matches collection initialized\n');

    // 19. CHAT MESSAGES - Create placeholder
    console.log('💬 Initializing chat messages collection...');
    await db.collection('chatMessages').doc('_placeholder').set({
      _placeholder: true,
      structure: {
        roomId: 'string',
        userId: 'string',
        username: 'string',
        message: 'string',
        timestamp: 'timestamp'
      }
    });
    console.log('✅ Chat messages collection initialized\n');

    console.log('\n🎉 ALL COLLECTIONS INITIALIZED SUCCESSFULLY!\n');
    console.log('📝 Note: Placeholder documents can be deleted once real data is added.\n');

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  }

  process.exit(0);
}

initializeCollections();
