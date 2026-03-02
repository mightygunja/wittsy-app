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

async function addStatusField() {
  try {
    console.log('Fetching all prompts...');
    const promptsRef = collection(firestore, 'prompts');
    const snapshot = await getDocs(promptsRef);
    
    console.log(`Total prompts: ${snapshot.size}`);
    
    const needsUpdate: string[] = [];
    const categoryCounts: Record<string, number> = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by category
      const category = data.category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Check if status field exists
      if (!data.status) {
        needsUpdate.push(doc.id);
      }
    });
    
    console.log('\nCategory distribution:');
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} prompts`);
      });
    
    console.log(`\n${needsUpdate.length} prompts need status field added`);
    
    if (needsUpdate.length > 0) {
      console.log('\nAdding status field to all prompts...');
      let updated = 0;
      
      for (const promptId of needsUpdate) {
        await updateDoc(doc(firestore, 'prompts', promptId), {
          status: 'active',
          difficulty: 'medium',
          tags: [],
          isOfficial: true,
          isPremium: false,
          timesUsed: 0,
          averageRating: 0,
          reportCount: 0,
        });
        updated++;
        if (updated % 50 === 0) {
          console.log(`Updated ${updated}/${needsUpdate.length} prompts`);
        }
      }
      
      console.log(`\nSuccessfully updated ${updated} prompts with status field!`);
    } else {
      console.log('\nAll prompts already have status field!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addStatusField();
