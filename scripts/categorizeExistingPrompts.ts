/**
 * Script to Categorize Existing Prompts in Firestore
 * This script reads all prompts from the database and assigns them appropriate categories
 * based on their text content using keyword matching.
 * 
 * Usage: npx ts-node scripts/categorizeExistingPrompts.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config - UPDATE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Category keywords for automatic categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'pop-culture': ['movie', 'tv', 'show', 'celebrity', 'actor', 'actress', 'film', 'series', 'netflix', 'disney', 'marvel', 'star wars'],
  'food': ['food', 'eat', 'pizza', 'burger', 'restaurant', 'meal', 'dinner', 'lunch', 'breakfast', 'cook', 'recipe', 'taste', 'flavor'],
  'technology': ['tech', 'app', 'phone', 'computer', 'internet', 'software', 'ai', 'robot', 'digital', 'online', 'website', 'smartphone'],
  'sports': ['sport', 'game', 'team', 'player', 'football', 'basketball', 'soccer', 'baseball', 'tennis', 'golf', 'olympic', 'athlete', 'workout', 'fitness', 'exercise'],
  'movies': ['movie', 'film', 'cinema', 'actor', 'director', 'hollywood', 'blockbuster', 'oscar', 'scene', 'character'],
  'music': ['music', 'song', 'band', 'singer', 'artist', 'album', 'concert', 'guitar', 'piano', 'rap', 'rock', 'pop', 'jazz'],
  'travel': ['travel', 'vacation', 'trip', 'destination', 'country', 'city', 'beach', 'hotel', 'flight', 'airport', 'tourist', 'visit'],
  'animals': ['animal', 'pet', 'dog', 'cat', 'bird', 'fish', 'zoo', 'wildlife', 'creature', 'species'],
  'history': ['history', 'historical', 'ancient', 'war', 'century', 'era', 'past', 'civilization', 'empire', 'revolution'],
  'science': ['science', 'scientific', 'space', 'planet', 'universe', 'experiment', 'research', 'discovery', 'theory', 'physics', 'chemistry', 'biology'],
  'relationships': ['love', 'relationship', 'dating', 'friend', 'friendship', 'romance', 'partner', 'couple', 'marriage', 'family'],
};

/**
 * Determine category based on prompt text
 */
function categorizePrompt(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default to general if no match
  return 'general';
}

/**
 * Main function to categorize all prompts
 */
async function categorizeAllPrompts() {
  console.log('🔍 Fetching all prompts from database...\n');
  
  try {
    const promptsRef = collection(firestore, 'prompts');
    const snapshot = await getDocs(promptsRef);
    
    if (snapshot.empty) {
      console.log('⚠️  No prompts found in database.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} prompts to categorize\n`);
    
    let categorized = 0;
    let alreadyCategorized = 0;
    const categoryCounts: Record<string, number> = {};
    
    for (const promptDoc of snapshot.docs) {
      const data = promptDoc.data();
      const currentCategory = data.category;
      const text = data.text || '';
      
      // Skip if already has a valid category
      if (currentCategory && currentCategory !== 'uncategorized') {
        alreadyCategorized++;
        categoryCounts[currentCategory] = (categoryCounts[currentCategory] || 0) + 1;
        console.log(`✓ Already categorized: "${text}" → ${currentCategory}`);
        continue;
      }
      
      // Determine new category
      const newCategory = categorizePrompt(text);
      
      // Update in Firestore
      await updateDoc(doc(firestore, 'prompts', promptDoc.id), {
        category: newCategory
      });
      
      categorized++;
      categoryCounts[newCategory] = (categoryCounts[newCategory] || 0) + 1;
      console.log(`✅ Categorized: "${text}" → ${newCategory}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Categorization Summary:');
    console.log('='.repeat(60));
    console.log(`Total prompts: ${snapshot.size}`);
    console.log(`Already categorized: ${alreadyCategorized}`);
    console.log(`Newly categorized: ${categorized}`);
    console.log('\nPrompts per category:');
    
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} prompts`);
      });
    
    console.log('\n✨ Categorization complete!');
    
  } catch (error) {
    console.error('❌ Error categorizing prompts:', error);
    throw error;
  }
}

// Run the categorization
categorizeAllPrompts()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
