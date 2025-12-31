/**
 * Fix missing useMemo imports and add styles creation
 */

const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, '../src/screens');

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixScreen(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Skip if doesn't use useTheme
  if (!content.includes('useTheme')) {
    return;
  }
  
  console.log(`🔧 Fixing ${path.basename(filePath)}...`);
  
  // 1. Add useMemo to React imports if missing
  if (content.includes('createStyles') && !content.includes('useMemo')) {
    const reactImportMatch = content.match(/import React,?\s*{([^}]*)}\s*from\s+['"]react['"]/);
    if (reactImportMatch) {
      const fullMatch = reactImportMatch[0];
      const hooks = reactImportMatch[1];
      
      if (!hooks.includes('useMemo')) {
        const newImport = fullMatch.replace(
          `{${hooks}}`,
          `{${hooks}, useMemo}`
        );
        content = content.replace(fullMatch, newImport);
        modified = true;
        console.log(`  ✅ Added useMemo import`);
      }
    }
  }
  
  // 2. Add styles useMemo if createStyles exists but styles useMemo doesn't
  if (content.includes('createStyles') && !content.includes('useMemo(() => createStyles')) {
    // Find where to insert - after useTheme line
    const useThemeMatch = content.match(/const\s+{\s*colors:\s*COLORS\s*}\s*=\s*useTheme\(\);/);
    if (useThemeMatch) {
      const insertPoint = content.indexOf(useThemeMatch[0]) + useThemeMatch[0].length;
      content = content.slice(0, insertPoint) + 
                '\n  const styles = useMemo(() => createStyles(COLORS), [COLORS]);' + 
                content.slice(insertPoint);
      modified = true;
      console.log(`  ✅ Added styles useMemo`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(filePath)}`);
  } else {
    console.log(`⏭️  ${path.basename(filePath)} - no changes needed`);
  }
}

// Main execution
console.log('🚀 Fixing missing imports and useMemo...\n');

const allScreens = getAllTsxFiles(screensDir);
console.log(`Found ${allScreens.length} screens to check\n`);

allScreens.forEach(fixScreen);

console.log('\n✨ Done!');
