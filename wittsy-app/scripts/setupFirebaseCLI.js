/**
 * Firebase CLI Setup Helper
 * 
 * Automated helper to deploy security rules and indexes using Firebase CLI.
 * This script will guide you through the Firebase CLI setup and deployment.
 * 
 * Usage: node scripts/setupFirebaseCLI.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command, description) {
  console.log(`\n▶️  ${description}...`);
  console.log(`   $ ${command}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('   ✓ Done');
    return true;
  } catch (error) {
    console.error(`   ✗ Failed: ${error.message}`);
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function copyFile(source, dest) {
  try {
    fs.copyFileSync(source, dest);
    console.log(`   ✓ Copied ${path.basename(dest)}`);
    return true;
  } catch (error) {
    console.error(`   ✗ Failed to copy ${path.basename(dest)}: ${error.message}`);
    return false;
  }
}

async function setup() {
  console.log('🚀 Firebase CLI Setup & Deployment\n');
  console.log('This script will:');
  console.log('  1. Check if Firebase CLI is installed');
  console.log('  2. Copy security rules and index files');
  console.log('  3. Guide you through Firebase initialization');
  console.log('  4. Deploy rules and indexes\n');

  const rootDir = path.join(__dirname, '..');
  const rulesDir = path.join(__dirname, '.rules-temp');

  // Step 1: Check Firebase CLI
  console.log('\n📦 STEP 1: Checking Firebase CLI installation...');
  
  try {
    execSync('firebase --version', { encoding: 'utf8' });
    console.log('   ✓ Firebase CLI is installed');
  } catch (error) {
    console.log('   ✗ Firebase CLI not found');
    console.log('\n   Installing Firebase CLI globally...');
    
    if (!executeCommand('npm install -g firebase-tools', 'Installing Firebase CLI')) {
      console.error('\n❌ Failed to install Firebase CLI. Please install manually:');
      console.error('   npm install -g firebase-tools');
      process.exit(1);
    }
  }

  // Step 2: Copy rules files
  console.log('\n📋 STEP 2: Copying security rules and indexes...');
  
  if (!fs.existsSync(rulesDir)) {
    console.error('\n   ✗ Rules directory not found. Please run these scripts first:');
    console.error('     - node scripts/deploySecurityRules.js');
    console.error('     - node scripts/createIndexes.js');
    process.exit(1);
  }

  const files = [
    { src: 'firestore.rules', desc: 'Firestore security rules' },
    { src: 'storage.rules', desc: 'Storage security rules' },
    { src: 'database.rules.json', desc: 'Realtime DB security rules' },
    { src: 'firestore.indexes.json', desc: 'Firestore indexes' }
  ];

  for (const file of files) {
    const src = path.join(rulesDir, file.src);
    const dest = path.join(rootDir, file.src);
    
    if (fileExists(src)) {
      copyFile(src, dest);
    } else {
      console.log(`   ⚠️  ${file.src} not found (may need to run corresponding script)`);
    }
  }

  // Step 3: Firebase login
  console.log('\n🔐 STEP 3: Firebase login...');
  console.log('\n   This will open a browser window for authentication.');
  console.log('   Press Enter to continue, or Ctrl+C to cancel...');
  
  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  if (!executeCommand('firebase login', 'Logging in to Firebase')) {
    console.error('\n❌ Firebase login failed. Please try again or login manually:');
    console.error('   firebase login');
    process.exit(1);
  }

  // Step 4: Firebase init (if not already done)
  console.log('\n⚙️  STEP 4: Firebase project initialization...');
  
  if (fileExists(path.join(rootDir, 'firebase.json'))) {
    console.log('   ✓ Firebase already initialized (firebase.json exists)');
  } else {
    console.log('\n   Running firebase init...');
    console.log('   When prompted:');
    console.log('     - Select: Firestore, Realtime Database, Storage');
    console.log('     - Use existing project');
    console.log('     - Accept default file paths');
    console.log('\n   Press Enter to continue...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    if (!executeCommand('firebase init', 'Initializing Firebase')) {
      console.error('\n❌ Firebase init failed. Please run manually:');
      console.error('   firebase init');
      process.exit(1);
    }
  }

  // Step 5: Deploy
  console.log('\n🚀 STEP 5: Deploying rules and indexes...');
  
  const deployCommands = [
    { cmd: 'firebase deploy --only firestore:rules', desc: 'Deploying Firestore rules' },
    { cmd: 'firebase deploy --only storage:rules', desc: 'Deploying Storage rules' },
    { cmd: 'firebase deploy --only database:rules', desc: 'Deploying Realtime DB rules' },
    { cmd: 'firebase deploy --only firestore:indexes', desc: 'Deploying Firestore indexes' }
  ];

  let successCount = 0;
  for (const { cmd, desc } of deployCommands) {
    if (executeCommand(cmd, desc)) {
      successCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ ${successCount} out of ${deployCommands.length} deployments succeeded\n`);

  if (successCount === deployCommands.length) {
    console.log('🎉 All Firebase configurations deployed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Verify in Firebase Console that rules are active');
    console.log('  2. Check Firestore > Indexes for index build status');
    console.log('  3. Start building your app!\n');
  } else {
    console.log('⚠️  Some deployments failed. Check the errors above.');
    console.log('   You can retry individual deployments with:');
    console.log('   firebase deploy --only firestore:rules');
    console.log('   firebase deploy --only storage:rules');
    console.log('   firebase deploy --only database:rules');
    console.log('   firebase deploy --only firestore:indexes\n');
  }

  process.exit(successCount === deployCommands.length ? 0 : 1);
}

setup();
