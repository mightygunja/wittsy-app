import { collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';

const defaultPrompts = [
  // Funny prompts
  { text: "The worst excuse for being late", category: "funny", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "Things you shouldn't say on a first date", category: "funny", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "The world's worst superhero power", category: "funny", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A terrible name for a restaurant", category: "funny", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "The worst thing to say at a job interview", category: "funny", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A bad time to start laughing", category: "funny", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "Things you shouldn't do at a wedding", category: "funny", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "The worst gift to give someone", category: "funny", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "A terrible slogan for a company", category: "funny", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The worst advice you could give", category: "funny", difficulty: "medium", status: "active", timesUsed: 0 },

  // Creative prompts
  { text: "Invent a new holiday", category: "creative", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A movie title that would never get made", category: "creative", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The next big social media trend", category: "creative", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "A new flavor of ice cream", category: "creative", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "An invention that doesn't exist but should", category: "creative", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A new sport that combines two existing sports", category: "creative", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "The title of your autobiography", category: "creative", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A conspiracy theory that's actually believable", category: "creative", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "A new app idea", category: "creative", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The worst possible band name", category: "creative", difficulty: "easy", status: "active", timesUsed: 0 },

  // Clever prompts
  { text: "A clever excuse for not doing homework", category: "clever", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The best way to avoid small talk", category: "clever", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A loophole in everyday rules", category: "clever", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "The smartest thing a pet could say", category: "clever", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A genius life hack", category: "clever", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The perfect comeback", category: "clever", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "A way to win any argument", category: "clever", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "The ultimate excuse", category: "clever", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A brilliant business idea", category: "clever", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "The best way to get out of trouble", category: "clever", difficulty: "medium", status: "active", timesUsed: 0 },

  // Random prompts
  { text: "Something you'd find in a time capsule from 2024", category: "random", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "The last thing you'd want to hear from a pilot", category: "random", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A weird talent to have", category: "random", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "Something that would make a terrible pet", category: "random", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "The worst place to take a nap", category: "random", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "A sign you're getting old", category: "random", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "Something you'd never want to step on", category: "random", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "The worst thing to forget", category: "random", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A terrible superpower", category: "random", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "Something that should be illegal but isn't", category: "random", difficulty: "hard", status: "active", timesUsed: 0 },

  // Spicy prompts
  { text: "A red flag on a dating profile", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The worst thing to say to your ex", category: "spicy", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "A dealbreaker in a relationship", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The most awkward text to send", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A terrible pickup line", category: "spicy", difficulty: "easy", status: "active", timesUsed: 0 },
  { text: "Something you should never Google", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "The worst thing to overhear", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A secret you should never tell", category: "spicy", difficulty: "hard", status: "active", timesUsed: 0 },
  { text: "The most embarrassing thing that could happen", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
  { text: "A lie everyone tells", category: "spicy", difficulty: "medium", status: "active", timesUsed: 0 },
];

export async function seedPrompts() {
  try {
    // Check if prompts already exist
    const snapshot = await getDocs(collection(firestore, 'prompts'));
    
    if (snapshot.empty) {
      console.log('🎯 Seeding prompts...');
      
      for (const prompt of defaultPrompts) {
        await addDoc(collection(firestore, 'prompts'), prompt);
      }
      
      console.log(`🎉 Seeded ${defaultPrompts.length} prompts successfully!`);
      return true;
    } else {
      console.log(`✓ Prompts already exist (${snapshot.size} prompts)`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error seeding prompts:', error);
    return false;
  }
}
