/**
 * Sample Prompts Script
 * 
 * Adds initial prompts to the Firestore database for testing.
 * Run this after initializeFirestore.js
 * 
 * Usage: node scripts/addSamplePrompts.js
 */

const admin = require('firebase-admin');

// Check if already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const samplePrompts = [
  {
    text: "The worst thing to say on a first date is...",
    category: "Funny",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "If I was invisible for a day, I would...",
    category: "Situations",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "My superhero name would be...",
    category: "Funny",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "The best excuse for being late is...",
    category: "Clever",
    difficulty: "medium",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "If animals could talk, the first thing my pet would say is...",
    category: "Animals",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "The most awkward thing that could happen at a wedding is...",
    category: "Awkward",
    difficulty: "medium",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "If I won the lottery, the first thing I'd buy is...",
    category: "Situations",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "My time machine broke and now I'm stuck in...",
    category: "Sci-Fi",
    difficulty: "medium",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "The strangest job interview question I ever got was...",
    category: "Work",
    difficulty: "medium",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "My Netflix show about my life would be called...",
    category: "Funny",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "The worst superpower to have would be...",
    category: "Funny",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "If I could rename Monday, I'd call it...",
    category: "Clever",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "My autobiography would be titled...",
    category: "Clever",
    difficulty: "medium",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "The weirdest thing I've ever Googled is...",
    category: "Awkward",
    difficulty: "medium",
    pack: "default",
    isActive: true,
    usageCount: 0
  },
  {
    text: "If I was a ghost, I would haunt...",
    category: "Spooky",
    difficulty: "easy",
    pack: "default",
    isActive: true,
    usageCount: 0
  }
];

async function addPrompts() {
  console.log('📝 Adding sample prompts to Firestore...\n');

  try {
    // Check how many prompts already exist
    const existingPrompts = await db.collection('prompts').get();
    console.log(`Found ${existingPrompts.size} existing prompts`);

    if (existingPrompts.size >= 10) {
      console.log('✓ Already have enough prompts. Skipping...');
      process.exit(0);
    }

    // Add each prompt
    const batch = db.batch();
    let addedCount = 0;

    for (const prompt of samplePrompts) {
      const docRef = db.collection('prompts').doc();
      batch.set(docRef, {
        ...prompt,
        id: docRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      });
      addedCount++;
    }

    await batch.commit();

    console.log(`\n✓ Successfully added ${addedCount} prompts!`);
    console.log('\n🎉 Sample prompts added successfully!');
    console.log('\nYou can now:');
    console.log('1. View prompts in Firebase Console > Firestore > prompts collection');
    console.log('2. Start the app and test game functionality\n');

  } catch (error) {
    console.error('❌ Error adding prompts:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
addPrompts();
