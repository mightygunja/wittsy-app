import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function removeDuplicates() {
  try {
    console.log('Fetching all prompts...');
    const promptsRef = collection(firestore, 'prompts');
    const snapshot = await getDocs(promptsRef);
    
    console.log(`Total documents fetched: ${snapshot.size}`);
    
    const seenTexts = new Map<string, string>(); // text -> docId
    const duplicates: string[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const text = data.text;
      
      if (seenTexts.has(text)) {
        // This is a duplicate
        duplicates.push(docSnap.id);
      } else {
        // First occurrence, keep it
        seenTexts.set(text, docSnap.id);
      }
    });
    
    console.log(`\nUnique prompts: ${seenTexts.size}`);
    console.log(`Duplicate documents to delete: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\nDeleting duplicates...');
      let deleted = 0;
      for (const dupId of duplicates) {
        await deleteDoc(doc(firestore, 'prompts', dupId));
        deleted++;
        if (deleted % 50 === 0) {
          console.log(`Deleted ${deleted}/${duplicates.length} duplicates`);
        }
      }
      console.log(`\nDeleted ${deleted} duplicate prompts`);
      console.log(`Remaining unique prompts: ${seenTexts.size}`);
    } else {
      console.log('\nNo duplicates found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
