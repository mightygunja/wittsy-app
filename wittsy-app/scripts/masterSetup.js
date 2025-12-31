/**
 * Master Firebase Setup Script
 * 
 * Runs all Firebase setup scripts in the correct order.
 * This is the ONE command you need to run after setting up your Firebase project.
 * 
 * Prerequisites:
 * 1. Firebase project created in console
 * 2. serviceAccountKey.json downloaded and placed in scripts/ folder
 * 3. npm install completed
 * 
 * Usage: node scripts/masterSetup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeScript(scriptName, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`▶️  ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    execSync(`node scripts/${scriptName}`, { 
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`\n✅ ${description} - COMPLETE\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} - FAILED\n`);
    return false;
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  // Check for service account key
  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('❌ serviceAccountKey.json not found in scripts/ folder\n');
    console.error('📝 To get your service account key:');
    console.error('   1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('   2. Click "Generate new private key"');
    console.error('   3. Save as scripts/serviceAccountKey.json\n');
    return false;
  }
  console.log('✓ serviceAccountKey.json found');

  // Check for node_modules
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('\n❌ node_modules not found. Please run: npm install\n');
    return false;
  }
  console.log('✓ node_modules found');

  // Check for .env file
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('\n⚠️  .env file not found');
    console.log('   You\'ll need to create this with your Firebase config');
    console.log('   See .env.example for the template\n');
  } else {
    console.log('✓ .env file found');
  }

  return true;
}

async function runMasterSetup() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          🎮 WITTSY FIREBASE MASTER SETUP 🎮               ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Check prerequisites
  if (!checkPrerequisites()) {
    console.error('❌ Prerequisites not met. Please fix the issues above and try again.\n');
    process.exit(1);
  }

  console.log('\n✅ All prerequisites met! Starting setup...\n');

  const scripts = [
    { name: 'initializeFirestore.js', desc: 'Initialize Firestore Collections' },
    { name: 'addSamplePrompts.js', desc: 'Add Sample Prompts' },
    { name: 'initializeRealtimeDB.js', desc: 'Initialize Realtime Database' },
    { name: 'deploySecurityRules.js', desc: 'Generate Security Rules' },
    { name: 'createIndexes.js', desc: 'Generate Firestore Indexes' }
  ];

  let successCount = 0;
  const totalScripts = scripts.length;

  for (const script of scripts) {
    if (executeScript(script.name, script.desc)) {
      successCount++;
    } else {
      console.log(`\n⚠️  Error in ${script.name}\n`);
      
      // If Realtime DB fails, it's expected - user needs to create it first
      if (script.name === 'initializeRealtimeDB.js') {
        console.log('⏩ Skipping Realtime Database setup (needs to be created in console first)');
        console.log('   You can run this script later: node scripts/initializeRealtimeDB.js\n');
      } else {
        console.log('⏩ Continuing with remaining scripts...\n');
      }
    }
  }

  // Final summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SETUP SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✓ ${successCount} of ${totalScripts} scripts completed successfully\n`);

  if (successCount === totalScripts) {
    console.log('🎉 FIREBASE SETUP COMPLETE!\n');
    console.log('📋 What was configured:');
    console.log('   ✓ 8 Firestore collections created');
    console.log('   ✓ 15 sample prompts added');
    console.log('   ✓ Realtime Database initialized');
    console.log('   ✓ Security rules generated');
    console.log('   ✓ Index configurations created\n');
    
    console.log('🚀 NEXT STEPS:\n');
    console.log('1. Deploy security rules and indexes:');
    console.log('   node scripts/setupFirebaseCLI.js');
    console.log('\n2. Create your .env file with Firebase config:');
    console.log('   - Copy .env.example to .env');
    console.log('   - Fill in your Firebase credentials from console');
    console.log('\n3. Start the app:');
    console.log('   npm start\n');
  } else {
    console.log('⚠️  Some scripts failed. Review the errors above.\n');
    console.log('You can re-run individual scripts:');
    scripts.forEach(s => {
      console.log(`   node scripts/${s.name}`);
    });
    console.log('');
  }

  process.exit(successCount === totalScripts ? 0 : 1);
}

runMasterSetup();
