import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBJf4239QrQhCtd4ivB-fNPZ358dYIEG6M",
  authDomain: "wittsy-51992.firebaseapp.com",
  projectId: "wittsy-51992",
  storageBucket: "wittsy-51992.firebasestorage.app",
  messagingSenderId: "757129696124",
  appId: "1:757129696124:ios:ef033560b02392c9b80af9",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Map uploaded category names to proper category IDs
const CATEGORY_MAPPING: Record<string, string> = {
  'Icebreakers': 'general',
  'Hypotheticals': 'general',
  'Food & Drink': 'food',
  'Entertainment': 'entertainment',
  'Personal': 'personal',
  'Dating': 'relationships',
  'Animals': 'animals',
  'Fashion': 'fashion',
  'Technology': 'technology',
  'Sports': 'sports',
  'Music': 'music',
  'Gaming': 'gaming',
  'Social': 'general',
  'Work': 'work',
  'Travel': 'travel',
  'Party': 'entertainment',
  'Health': 'health',
  'Art': 'art',
  'Science': 'science',
  'Nature': 'nature',
  'Relationships': 'relationships',
  'Shopping': 'shopping',
  'Adventures': 'travel',
  'Childhood': 'general',
  'Emotions': 'personal',
  'Family': 'relationships',
  'Gifts': 'shopping',
  'Hobbies': 'hobbies',
  'Life': 'general',
  'Books': 'books',
  'Culture': 'culture',
  'Education': 'school',
  'Environment': 'environment',
  'Fitness': 'fitness',
  'History': 'history',
  'Opinions': 'general',
  'Random': 'general',
  'Skills': 'general',
  'Social Media': 'social-media',
  'Survival': 'survival',
  'Sci-Fi': 'sci-fi',
  'Fantasy': 'fantasy',
  'Romance': 'relationships',
  'Society': 'society',
  'Innovation': 'technology',
  'Philosophy': 'philosophy',
  'Languages': 'languages',
  'Internet': 'social-media',
  'Career': 'work',
};

async function fixCategories() {
  try {
    console.log('Fetching all prompts...');
    const promptsRef = collection(firestore, 'prompts');
    const snapshot = await getDocs(promptsRef);
    
    console.log(`Total prompts: ${snapshot.size}`);
    
    const categoryCounts: Record<string, number> = {};
    const updates: Array<{ id: string; oldCategory: string; newCategory: string }> = [];
    
    // First, analyze what categories exist
    snapshot.forEach(doc => {
      const data = doc.data();
      const category = data.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      const mappedCategory = CATEGORY_MAPPING[category];
      if (mappedCategory && mappedCategory !== category) {
        updates.push({
          id: doc.id,
          oldCategory: category,
          newCategory: mappedCategory,
        });
      }
    });
    
    console.log('\nCurrent categories:');
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const mapped = CATEGORY_MAPPING[cat] || cat;
        console.log(`  ${cat}: ${count} prompts -> will map to: ${mapped}`);
      });
    
    console.log(`\n${updates.length} prompts need category updates`);
    
    if (updates.length > 0) {
      console.log('\nUpdating categories...');
      let updated = 0;
      
      for (const update of updates) {
        await updateDoc(doc(firestore, 'prompts', update.id), {
          category: update.newCategory,
        });
        updated++;
        if (updated % 50 === 0) {
          console.log(`Updated ${updated}/${updates.length} prompts`);
        }
      }
      
      console.log(`\nSuccessfully updated ${updated} prompts!`);
    } else {
      console.log('\nNo updates needed - all categories are already correct!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCategories();
