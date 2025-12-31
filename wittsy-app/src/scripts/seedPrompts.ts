/**
 * Script to seed Firestore with prompts database
 * Run this once to populate the prompts collection
 */

import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { PROMPTS_DATABASE } from '../data/promptsDatabase';

export const seedPrompts = async () => {
  console.log('🌱 Starting prompt seeding...');
  console.log(`📊 Total prompts to seed: ${PROMPTS_DATABASE.length}`);

  try {
    const batch = writeBatch(firestore);
    const promptsRef = collection(firestore, 'prompts');
    let count = 0;

    for (const promptData of PROMPTS_DATABASE) {
      const prompt = {
        ...promptData,
        createdAt: new Date().toISOString(),
        timesUsed: 0,
        averageRating: 0,
        reportCount: 0,
      };

      const docRef = doc(promptsRef);
      batch.set(docRef, prompt);
      count++;

      // Firestore batch limit is 500, commit and start new batch
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`✅ Committed ${count} prompts`);
      }
    }

    // Commit remaining prompts
    if (count % 500 !== 0) {
      await batch.commit();
      console.log(`✅ Committed final ${count % 500} prompts`);
    }

    console.log(`🎉 Successfully seeded ${count} prompts!`);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Error seeding prompts:', error);
    throw error;
  }
};

// For manual execution
if (require.main === module) {
  seedPrompts()
    .then(() => {
      console.log('✨ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
