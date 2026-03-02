/**
 * Seed Script for Sample Prompts
 * Run this to populate the Firestore database with sample prompts across all categories
 * 
 * Usage: npx ts-node scripts/seedPrompts.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config (use your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const SAMPLE_PROMPTS = [
  // General
  { text: "The best thing about weekends", category: "general", difficulty: "easy", tags: ["fun", "weekend", "relaxation"] },
  { text: "My secret superpower would be", category: "general", difficulty: "medium", tags: ["imagination", "fun", "creative"] },
  { text: "If I could time travel, I'd visit", category: "general", difficulty: "medium", tags: ["time", "history", "adventure"] },
  
  // Pop Culture
  { text: "The most overrated movie of all time", category: "pop-culture", difficulty: "medium", tags: ["movies", "opinion", "debate"] },
  { text: "A TV show that should never have ended", category: "pop-culture", difficulty: "easy", tags: ["tv", "nostalgia", "entertainment"] },
  { text: "The celebrity I'd want to have dinner with", category: "pop-culture", difficulty: "easy", tags: ["celebrity", "conversation", "fun"] },
  
  // Food
  { text: "The perfect pizza topping combination", category: "food", difficulty: "easy", tags: ["pizza", "food", "preferences"] },
  { text: "A food I could eat every day", category: "food", difficulty: "easy", tags: ["food", "favorites", "daily"] },
  { text: "The weirdest food combination that actually works", category: "food", difficulty: "medium", tags: ["food", "weird", "surprising"] },
  
  // Technology
  { text: "An app that would make life easier", category: "technology", difficulty: "medium", tags: ["apps", "innovation", "ideas"] },
  { text: "The worst thing about smartphones", category: "technology", difficulty: "easy", tags: ["phones", "technology", "modern"] },
  { text: "Technology from sci-fi I wish existed", category: "technology", difficulty: "medium", tags: ["sci-fi", "future", "innovation"] },
  
  // Sports
  { text: "The most exciting sport to watch", category: "sports", difficulty: "easy", tags: ["sports", "entertainment", "competition"] },
  { text: "An Olympic sport that shouldn't exist", category: "sports", difficulty: "medium", tags: ["olympics", "sports", "opinion"] },
  { text: "My go-to workout excuse", category: "sports", difficulty: "easy", tags: ["fitness", "humor", "relatable"] },
  
  // Movies
  { text: "A movie quote I use in real life", category: "movies", difficulty: "easy", tags: ["movies", "quotes", "references"] },
  { text: "The most underrated movie ever made", category: "movies", difficulty: "medium", tags: ["movies", "hidden-gems", "recommendations"] },
  { text: "A movie ending that ruined the whole film", category: "movies", difficulty: "medium", tags: ["movies", "endings", "disappointment"] },
  
  // Music
  { text: "A song that never gets old", category: "music", difficulty: "easy", tags: ["music", "classics", "favorites"] },
  { text: "The best decade for music", category: "music", difficulty: "medium", tags: ["music", "history", "opinion"] },
  { text: "A guilty pleasure song", category: "music", difficulty: "easy", tags: ["music", "guilty-pleasure", "fun"] },
  
  // Travel
  { text: "My dream vacation destination", category: "travel", difficulty: "easy", tags: ["travel", "vacation", "dreams"] },
  { text: "The worst travel experience ever", category: "travel", difficulty: "medium", tags: ["travel", "stories", "mishaps"] },
  { text: "A place everyone should visit once", category: "travel", difficulty: "medium", tags: ["travel", "recommendations", "bucket-list"] },
  
  // Animals
  { text: "The best pet to have", category: "animals", difficulty: "easy", tags: ["pets", "animals", "companions"] },
  { text: "An animal that's secretly terrifying", category: "animals", difficulty: "medium", tags: ["animals", "scary", "nature"] },
  { text: "If I could be any animal", category: "animals", difficulty: "easy", tags: ["animals", "imagination", "fun"] },
  
  // History
  { text: "A historical figure I'd interview", category: "history", difficulty: "medium", tags: ["history", "people", "conversation"] },
  { text: "The most important invention in history", category: "history", difficulty: "hard", tags: ["history", "innovation", "impact"] },
  { text: "A historical event I wish I witnessed", category: "history", difficulty: "medium", tags: ["history", "events", "time-travel"] },
  
  // Science
  { text: "A scientific fact that blows my mind", category: "science", difficulty: "medium", tags: ["science", "facts", "amazing"] },
  { text: "The coolest thing about space", category: "science", difficulty: "easy", tags: ["space", "science", "astronomy"] },
  { text: "An unsolved mystery I want answered", category: "science", difficulty: "hard", tags: ["science", "mysteries", "questions"] },
  
  // Relationships
  { text: "The key to a good friendship", category: "relationships", difficulty: "medium", tags: ["friendship", "relationships", "advice"] },
  { text: "A dealbreaker in relationships", category: "relationships", difficulty: "medium", tags: ["relationships", "dating", "standards"] },
  { text: "The best date idea", category: "relationships", difficulty: "easy", tags: ["dating", "romance", "ideas"] },
];

async function seedPrompts() {
  console.log('🌱 Starting prompt seeding...');
  
  try {
    const promptsRef = collection(firestore, 'prompts');
    let count = 0;
    
    for (const promptData of SAMPLE_PROMPTS) {
      const prompt = {
        ...promptData,
        status: 'active',
        createdAt: new Date().toISOString(),
        isOfficial: true,
        isPremium: false,
        timesUsed: Math.floor(Math.random() * 100), // Random usage count
        averageRating: 0,
        reportCount: 0,
      };
      
      await addDoc(promptsRef, prompt);
      count++;
      console.log(`✅ Added: "${prompt.text}" (${prompt.category})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${count} prompts!`);
    console.log('\nPrompts by category:');
    const categories = SAMPLE_PROMPTS.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} prompts`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding prompts:', error);
  }
}

// Run the seed function
seedPrompts().then(() => {
  console.log('\n✨ Seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
