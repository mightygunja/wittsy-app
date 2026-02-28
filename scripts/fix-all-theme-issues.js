/**
 * Comprehensive fix for all theme-related issues
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
  
  // Skip if doesn't have createStyles
  if (!content.includes('createStyles')) {
    return;
  }
  
  console.log(`🔧 Fixing ${path.basename(filePath)}...`);
  
  // 1. Fix React import to include useMemo
  const reactImportMatch = content.match(/import React,?\s*{([^}]*)}\s*from\s+['"]react['"]/);
  if (reactImportMatch) {
    const fullMatch = reactImportMatch[0];
    const hooks = reactImportMatch[1].trim();
    
    if (!hooks.includes('useMemo')) {
      const hooksArray = hooks.split(',').map(h => h.trim()).filter(h => h);
      if (!hooksArray.includes('useMemo')) {
        hooksArray.push('useMemo');
      }
      const newHooks = hooksArray.join(', ');
      const newImport = `import React, { ${newHooks} } from 'react'`;
      content = content.replace(fullMatch, newImport);
      modified = true;
      console.log(`  ✅ Added useMemo to React import`);
    }
  }
  
  // 2. Ensure styles useMemo exists right after useTheme
  if (content.includes('useTheme()') && !content.includes('const styles = useMemo')) {
    // Find the useTheme line
    const useThemeRegex = /const\s+{\s*colors:\s*COLORS\s*}\s*=\s*useTheme\(\);/;
    const useThemeMatch = content.match(useThemeRegex);
    
    if (useThemeMatch) {
      const useThemeLine = useThemeMatch[0];
      const insertPoint = content.indexOf(useThemeLine) + useThemeLine.length;
      
      // Check if styles useMemo already exists nearby
      const nextLines = content.slice(insertPoint, insertPoint + 200);
      if (!nextLines.includes('const styles = useMemo')) {
        content = content.slice(0, insertPoint) + 
                  '\n  const styles = useMemo(() => createStyles(COLORS), [COLORS]);' + 
                  content.slice(insertPoint);
        modified = true;
        console.log(`  ✅ Added styles useMemo`);
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(filePath)}\n`);
  } else {
    console.log(`⏭️  ${path.basename(filePath)} - already correct\n`);
  }
}

// Main execution
console.log('🚀 Comprehensive theme fix starting...\n');

const allScreens = getAllTsxFiles(screensDir);
console.log(`Found ${allScreens.length} screens to process\n`);

allScreens.forEach(fixScreen);

console.log('\n✨ All done! Screens should now work correctly.');
