import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { prompts1 } from './promptData/prompts1.js';
import { prompts2 } from './promptData/prompts2.js';
import { prompts3 } from './promptData/prompts3.js';
import { prompts4 } from './promptData/prompts4.js';
import { prompts5 } from './promptData/prompts5.js';
import { prompts6 } from './promptData/prompts6.js';
import { prompts7 } from './promptData/prompts7.js';

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

async function uploadPrompts() {
  const allPrompts = [...prompts1, ...prompts2, ...prompts3, ...prompts4, ...prompts5, ...prompts6, ...prompts7];
  
  console.log(`Starting upload of ${allPrompts.length} prompts...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < allPrompts.length; i++) {
    const prompt = allPrompts[i];
    try {
      await addDoc(collection(firestore, 'prompts'), {
        text: prompt.text,
        category: prompt.category,
        createdAt: Timestamp.now(),
        isActive: true,
      });
      successCount++;
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${allPrompts.length} prompts uploaded`);
      }
    } catch (error) {
      console.error(`Error uploading prompt ${i + 1}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n=== Upload Complete ===');
  console.log(`Successfully uploaded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${allPrompts.length}`);
}

uploadPrompts()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
