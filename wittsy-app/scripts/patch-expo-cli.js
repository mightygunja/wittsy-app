/**
 * Patch @expo/cli middleware to fix "Must specify expo-platform header" error.
 * 
 * InterstitialPageMiddleware.js and RuntimeRedirectMiddleware.js throw a
 * CommandError when no platform header is present. This happens when Expo Go
 * on iPad (or any client) makes requests without the expo-platform header.
 * 
 * This patch replaces the assertMissingRuntimePlatform call with a fallback
 * to 'ios', matching what ExpoGoManifestHandlerMiddleware already does.
 */

const fs = require('fs');
const path = require('path');

const MIDDLEWARE_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'middleware'
);

const filesToPatch = [
  'InterstitialPageMiddleware.js',
  'RuntimeRedirectMiddleware.js',
];

const ASSERT_SEARCH = `(0, _resolvePlatform.assertMissingRuntimePlatform)(platform)`;
const ASSERT_REPLACE = `if (!platform) { platform = 'ios'; } // patched: fallback instead of throwing`;

let patchCount = 0;

for (const file of filesToPatch) {
  const filePath = path.join(MIDDLEWARE_DIR, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${file} (not found)`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('// patched: fallback instead of throwing')) {
    console.log(`✅ ${file} already patched`);
    patchCount++;
    continue;
  }

  if (!content.includes(ASSERT_SEARCH)) {
    console.log(`⚠️  ${file} does not contain expected code, skipping`);
    continue;
  }

  // Change 'const platform' to 'let platform' so we can reassign it in the fallback
  content = content.replace(
    /const platform = \(0, _resolvePlatform\.parsePlatformHeader\)/g,
    'let platform = (0, _resolvePlatform.parsePlatformHeader)'
  );

  // Replace the assert with a fallback
  content = content.replace(ASSERT_SEARCH, ASSERT_REPLACE);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Patched ${file}`);
  patchCount++;
}

if (patchCount === filesToPatch.length) {
  console.log('✅ All expo-cli middleware patched successfully');
} else {
  console.log(`⚠️  Patched ${patchCount}/${filesToPatch.length} files`);
}
