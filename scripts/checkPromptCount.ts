import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

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

async function checkPromptCount() {
  try {
    const promptsRef = collection(firestore, 'prompts');
    const q = query(promptsRef);
    const snapshot = await getDocs(q);
    
    console.log(`\n=== Prompt Library Status ===`);
    console.log(`Total prompts in database: ${snapshot.size}`);
    
    const categoryCounts: { [key: string]: number } = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log(`\nPrompts by category:`);
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking prompts:', error);
    process.exit(1);
  }
}

checkPromptCount();
