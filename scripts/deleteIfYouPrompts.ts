/**
 * Delete all prompts that start with "If You"
 * 
 * Usage: node scripts/deleteIfYouPrompts.ts
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteIfYouPrompts() {
  console.log('🗑️  Deleting prompts that start with "If You"...\n');
  
  try {
    const promptsRef = db.collection('prompts');
    const allPrompts = await promptsRef.get();
    
    console.log(`📋 Found ${allPrompts.size} total prompts\n`);
    
    let deletedCount = 0;
    const deletedPrompts = [];
    
    for (const promptDoc of allPrompts.docs) {
      const promptData = promptDoc.data();
      const promptText = promptData.text || '';
      
      // Check if prompt starts with "If You" (case-insensitive)
      if (promptText.toLowerCase().startsWith('if you')) {
        await promptDoc.ref.delete();
        deletedPrompts.push(promptText);
        console.log(`  ❌ Deleted: "${promptText}"`);
        deletedCount++;
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} prompts starting with "If You"`);
    
    if (deletedCount > 0) {
      console.log('\n📝 Deleted prompts:');
      deletedPrompts.forEach((text, i) => {
        console.log(`  ${i + 1}. "${text}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
deleteIfYouPrompts().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
