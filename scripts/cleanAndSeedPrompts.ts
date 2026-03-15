/**
 * Clean poor quality prompts and seed fresh, humorous ones
 * 
 * Usage: node scripts/cleanAndSeedPrompts.ts
 * 
 * Prerequisites: serviceAccountKey.json in scripts/ folder
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

// Poor quality prompts to remove (boring, not funny, too specific)
const PROMPTS_TO_REMOVE = [
  "If you had to choose between google and bing, which would you choose",
  "The best thing about weekends",
  "My dream vacation destination",
  "The best pet to have",
  "A song that never gets old",
  "The most exciting sport to watch",
  "The perfect pizza topping combination",
  "A food I could eat every day",
  "The celebrity I'd want to have dinner with",
  "An app that would make life easier",
  "The worst thing about smartphones",
  "A movie quote I use in real life",
  "The key to a good friendship",
  "The best date idea",
];

// NEW HIGH-QUALITY HUMOROUS PROMPTS - Fill-in-the-blank style, witty, ages 14-30
const NEW_PROMPTS = [
  // Incomplete famous sayings/idioms
  { text: "I have not yet begun to ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "A stitch in time saves ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "Put your money where your ___ is", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "Don't count your chickens before ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "When life gives you lemons, ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "The early bird gets ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "You can lead a horse to water but ___", category: "general", difficulty: "medium", tags: ["sayings", "humor", "fill-in"] },
  { text: "A penny saved is ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "Actions speak louder than ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  { text: "The grass is always greener ___", category: "general", difficulty: "easy", tags: ["sayings", "humor", "fill-in"] },
  
  // Modern fill-in-the-blanks (Gen Z/Millennial humor)
  { text: "My toxic trait is ___", category: "general", difficulty: "easy", tags: ["relatable", "humor", "self-aware"] },
  { text: "Red flags I ignore: ___", category: "relationships", difficulty: "medium", tags: ["dating", "humor", "relatable"] },
  { text: "I'm not saying I'm Batman, but ___", category: "general", difficulty: "medium", tags: ["humor", "creative", "superhero"] },
  { text: "My Roman Empire is ___", category: "general", difficulty: "easy", tags: ["trending", "humor", "obsession"] },
  { text: "Nobody: / Me at 3am: ___", category: "general", difficulty: "easy", tags: ["relatable", "humor", "late-night"] },
  { text: "Tell me you're ___ without telling me you're ___", category: "general", difficulty: "medium", tags: ["trending", "humor", "creative"] },
  { text: "POV: You just ___", category: "general", difficulty: "medium", tags: ["trending", "humor", "scenarios"] },
  { text: "It's giving ___", category: "general", difficulty: "easy", tags: ["trending", "humor", "vibes"] },
  { text: "Main character energy but make it ___", category: "general", difficulty: "medium", tags: ["trending", "humor", "personality"] },
  { text: "I'm just a girl who ___", category: "general", difficulty: "easy", tags: ["trending", "humor", "relatable"] },
  
  // Absurd/surreal humor
  { text: "If I had a nickel for every time I ___, I'd have two nickels. Which isn't a lot but it's weird that it happened twice", category: "general", difficulty: "hard", tags: ["meme", "humor", "absurd"] },
  { text: "My sleep paralysis demon and I ___", category: "general", difficulty: "medium", tags: ["dark-humor", "relatable", "absurd"] },
  { text: "The voices in my head said ___", category: "general", difficulty: "medium", tags: ["dark-humor", "absurd", "creative"] },
  { text: "My FBI agent watching me ___", category: "technology", difficulty: "easy", tags: ["humor", "relatable", "surveillance"] },
  { text: "God creating ___ : 'Let's make this one weird'", category: "general", difficulty: "medium", tags: ["humor", "absurd", "creative"] },
  
  // Pop culture & internet
  { text: "The worst take on the internet: ___", category: "pop-culture", difficulty: "medium", tags: ["internet", "opinion", "debate"] },
  { text: "A hill I will die on: ___", category: "general", difficulty: "medium", tags: ["opinion", "passionate", "debate"] },
  { text: "Hear me out: ___ is actually ___", category: "general", difficulty: "medium", tags: ["hot-take", "opinion", "creative"] },
  { text: "Unpopular opinion: ___", category: "general", difficulty: "medium", tags: ["opinion", "controversial", "debate"] },
  { text: "The most unhinged thing I've ever ___", category: "general", difficulty: "medium", tags: ["stories", "wild", "humor"] },
  { text: "My 13th reason is ___", category: "general", difficulty: "medium", tags: ["dark-humor", "relatable", "frustration"] },
  { text: "I'm sorry but ___ needs to be stopped", category: "general", difficulty: "medium", tags: ["opinion", "humor", "rant"] },
  { text: "The multiverse where I ___", category: "general", difficulty: "medium", tags: ["sci-fi", "humor", "alternate"] },
  
  // Relatable scenarios
  { text: "Things I do instead of therapy: ___", category: "general", difficulty: "medium", tags: ["relatable", "humor", "coping"] },
  { text: "My comfort ___ is ___", category: "general", difficulty: "easy", tags: ["relatable", "cozy", "favorites"] },
  { text: "I'm not lazy, I'm just ___", category: "general", difficulty: "easy", tags: ["relatable", "humor", "excuses"] },
  { text: "My biggest flex is ___", category: "general", difficulty: "easy", tags: ["bragging", "humor", "achievement"] },
  { text: "I peaked when I ___", category: "general", difficulty: "medium", tags: ["nostalgia", "humor", "achievement"] },
  { text: "The worst thing I've done for money: ___", category: "general", difficulty: "medium", tags: ["stories", "humor", "desperate"] },
  { text: "My villain origin story: ___", category: "general", difficulty: "medium", tags: ["humor", "backstory", "dramatic"] },
  { text: "Things that give me the ick: ___", category: "relationships", difficulty: "easy", tags: ["dating", "turnoffs", "relatable"] },
  
  // Food & lifestyle
  { text: "A food combination that sounds wrong but ___", category: "food", difficulty: "medium", tags: ["food", "weird", "surprising"] },
  { text: "My last meal would be ___", category: "food", difficulty: "easy", tags: ["food", "favorites", "dramatic"] },
  { text: "I could survive on ___ alone", category: "food", difficulty: "easy", tags: ["food", "favorites", "survival"] },
  { text: "The worst food crime is ___", category: "food", difficulty: "medium", tags: ["food", "opinion", "controversial"] },
  { text: "Pineapple on pizza? More like ___ on ___", category: "food", difficulty: "medium", tags: ["food", "debate", "creative"] },
  
  // Technology & gaming
  { text: "My screen time says I spent ___ hours on ___", category: "technology", difficulty: "easy", tags: ["phones", "relatable", "addiction"] },
  { text: "The app I'd delete if I had self-control: ___", category: "technology", difficulty: "easy", tags: ["apps", "addiction", "relatable"] },
  { text: "My gamer rage comes out when ___", category: "technology", difficulty: "medium", tags: ["gaming", "rage", "relatable"] },
  { text: "The most cursed thing I've googled: ___", category: "technology", difficulty: "medium", tags: ["internet", "weird", "search"] },
  { text: "My YouTube recommended is just ___", category: "technology", difficulty: "easy", tags: ["youtube", "algorithm", "relatable"] },
  
  // Existential & philosophical (but funny)
  { text: "If I could ask God one question: ___", category: "general", difficulty: "medium", tags: ["philosophy", "humor", "existential"] },
  { text: "The meaning of life is probably just ___", category: "general", difficulty: "medium", tags: ["philosophy", "humor", "existential"] },
  { text: "In my next life I'm coming back as ___", category: "general", difficulty: "easy", tags: ["reincarnation", "humor", "wishes"] },
  { text: "My biggest regret is ___", category: "general", difficulty: "medium", tags: ["regret", "humor", "reflection"] },
  { text: "If I could undo one thing: ___", category: "general", difficulty: "medium", tags: ["regret", "time-travel", "wishes"] },
  
  // Spicy/edgy (but not offensive)
  { text: "My therapist doesn't need to know about ___", category: "general", difficulty: "medium", tags: ["secrets", "humor", "therapy"] },
  { text: "I'm going to hell for ___", category: "general", difficulty: "medium", tags: ["dark-humor", "confession", "guilt"] },
  { text: "The intrusive thought that won: ___", category: "general", difficulty: "medium", tags: ["intrusive-thoughts", "humor", "chaos"] },
  { text: "I gaslit myself into thinking ___", category: "general", difficulty: "medium", tags: ["self-deception", "humor", "relatable"] },
  { text: "My FBI agent is concerned because ___", category: "technology", difficulty: "medium", tags: ["surveillance", "humor", "weird"] },
  
  // Nostalgia & generational
  { text: "Only 90s kids remember ___", category: "pop-culture", difficulty: "medium", tags: ["nostalgia", "90s", "childhood"] },
  { text: "Back in my day, we had to ___", category: "general", difficulty: "medium", tags: ["nostalgia", "old-person", "humor"] },
  { text: "Kids these days will never know ___", category: "general", difficulty: "medium", tags: ["nostalgia", "generational", "technology"] },
  { text: "The best thing about being a kid was ___", category: "general", difficulty: "easy", tags: ["nostalgia", "childhood", "memories"] },
  { text: "I miss when ___ was ___", category: "general", difficulty: "medium", tags: ["nostalgia", "change", "past"] },
];

async function cleanAndSeedPrompts() {
  console.log('🧹 Starting prompt cleanup and seeding...\n');
  
  try {
    const promptsRef = db.collection('prompts');
    
    // Step 1: Delete poor quality prompts
    console.log('📋 Fetching all prompts...');
    const allPrompts = await promptsRef.get();
    console.log(`Found ${allPrompts.size} total prompts\n`);
    
    let deletedCount = 0;
    console.log('🗑️  Removing poor quality prompts...');
    
    for (const promptDoc of allPrompts.docs) {
      const promptData = promptDoc.data();
      const promptText = promptData.text;
      
      // Check if this prompt should be removed
      if (PROMPTS_TO_REMOVE.some(badPrompt => 
        promptText.toLowerCase().includes(badPrompt.toLowerCase()) ||
        badPrompt.toLowerCase().includes(promptText.toLowerCase())
      )) {
        await promptDoc.ref.delete();
        console.log(`  ❌ Deleted: "${promptText}"`);
        deletedCount++;
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} poor quality prompts\n`);
    
    // Step 2: Add new high-quality prompts
    console.log('🌱 Adding new high-quality prompts...\n');
    let addedCount = 0;
    
    for (const promptData of NEW_PROMPTS) {
      const prompt = {
        ...promptData,
        status: 'active',
        createdAt: new Date().toISOString(),
        isOfficial: true,
        isPremium: false,
        timesUsed: 0,
        averageRating: 0,
        reportCount: 0,
      };
      
      await promptsRef.add(prompt);
      addedCount++;
      console.log(`  ✅ Added: "${prompt.text}"`);
    }
    
    console.log(`\n🎉 Successfully added ${addedCount} new prompts!`);
    console.log(`\n📊 Summary:`);
    console.log(`  Deleted: ${deletedCount} prompts`);
    console.log(`  Added: ${addedCount} prompts`);
    console.log(`  Net change: +${addedCount - deletedCount} prompts`);
    
    // Show category breakdown
    const categories = NEW_PROMPTS.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n📁 New prompts by category:`);
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} prompts`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
cleanAndSeedPrompts().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
