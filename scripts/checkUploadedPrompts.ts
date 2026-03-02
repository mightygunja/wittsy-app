import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

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

async function checkPrompts() {
  try {
    // Try to get first 200 prompts to see if there are more than 100
    const promptsRef = collection(firestore, 'prompts');
    const q = query(promptsRef, limit(200));
    const snapshot = await getDocs(q);
    
    console.log(`\n=== Prompts Check ===`);
    console.log(`Retrieved ${snapshot.size} prompts (limited to 200)`);
    
    if (snapshot.size === 200) {
      console.log(`There are at least 200 prompts in the database.`);
    }
    
    // Check for unique texts
    const texts = new Set<string>();
    snapshot.forEach((doc) => {
      texts.add(doc.data().text);
    });
    
    console.log(`Unique prompt texts in sample: ${texts.size}`);
    console.log(`Duplicates in sample: ${snapshot.size - texts.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPrompts();
