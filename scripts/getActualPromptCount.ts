import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getCountFromServer } from 'firebase/firestore';

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

async function getActualCount() {
  try {
    const promptsRef = collection(firestore, 'prompts');
    const snapshot = await getCountFromServer(promptsRef);
    
    console.log(`\n=== ACTUAL PROMPT COUNT IN FIRESTORE ===`);
    console.log(`Total prompts: ${snapshot.data().count}`);
    console.log(`\nNote: The Firebase Console shows a limit of 100 by default.`);
    console.log(`This is just the display limit, not the actual count.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error getting count:', error);
    process.exit(1);
  }
}

getActualCount();
