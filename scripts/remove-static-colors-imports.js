/**
 * Remove static COLORS imports from files that use useTheme
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/screens/settings/NotificationSettingsScreen.tsx',
  'src/screens/settings/PrivacySettingsScreen.tsx',
  'src/screens/settings/LanguageSettingsScreen.tsx',
  'src/screens/settings/AudioSettingsScreen.tsx',
  'src/screens/settings/GameplaySettingsScreen.tsx',
  'src/screens/settings/AccessibilitySettingsScreen.tsx',
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove line that imports COLORS from constants
  const patterns = [
    /import\s+{\s*COLORS\s*}\s+from\s+['"]\.\.\/\.\.\/utils\/constants['"];\s*\n/g,
    /import\s+{\s*COLORS,\s*([^}]+)\s*}\s+from\s+['"]\.\.\/\.\.\/utils\/constants['"];/g,
    /import\s+{\s*([^}]+),\s*COLORS\s*}\s+from\s+['"]\.\.\/\.\.\/utils\/constants['"];/g,
  ];
  
  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match, group1) => {
        if (group1) {
          // There are other imports, keep them
          return `import { ${group1} } from '../../utils/constants';`;
        }
        // Just COLORS, remove the whole line
        return '';
      });
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(file)}`);
  } else {
    console.log(`⏭️  ${path.basename(file)} - no changes needed`);
  }
});

console.log('\n✨ Done!');
