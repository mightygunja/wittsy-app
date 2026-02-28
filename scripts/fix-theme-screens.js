/**
 * Script to update all screens to use dynamic theme
 * This will add useTheme hook and convert styles to dynamic
 */

const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, '../src/screens');

// Screens that are already fixed
const fixedScreens = [
  'HomeScreen.tsx',
  'EnhancedProfileScreen.tsx',
  'EnhancedLeaderboardScreen.tsx',
  'ThemeSettingsScreen.tsx'
];

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') && !fixedScreens.includes(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function updateScreen(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file uses COLORS
  if (!content.includes('COLORS')) {
    console.log(`⏭️  Skipping ${path.basename(filePath)} - doesn't use COLORS`);
    return;
  }
  
  // Check if already has useTheme
  if (content.includes('useTheme')) {
    console.log(`✅ ${path.basename(filePath)} - already has useTheme`);
    return;
  }
  
  console.log(`🔧 Fixing ${path.basename(filePath)}...`);
  
  // 1. Add useTheme import if not present
  if (!content.includes("from '../hooks/useTheme'")) {
    // Find the line with COLORS import
    const colorsImportRegex = /import\s+{[^}]*COLORS[^}]*}\s+from\s+['"]\.\.\/utils\/constants['"]/;
    const match = content.match(colorsImportRegex);
    
    if (match) {
      // Remove COLORS from the import
      const newImport = match[0].replace(/,?\s*COLORS\s*,?/, '').replace(/{\s*,/, '{').replace(/,\s*}/, '}');
      content = content.replace(match[0], newImport);
      
      // Add useTheme import after the modified line
      const importIndex = content.indexOf(newImport) + newImport.length;
      content = content.slice(0, importIndex) + "\nimport { useTheme } from '../hooks/useTheme';" + content.slice(importIndex);
      modified = true;
    }
  }
  
  // 2. Add useMemo to React imports if not present
  if (!content.includes('useMemo')) {
    content = content.replace(
      /from\s+['"]react['"]/,
      (match) => {
        const reactImport = content.match(/import\s+React,?\s*{([^}]*)}/);
        if (reactImport) {
          const hooks = reactImport[1];
          if (!hooks.includes('useMemo')) {
            return match.replace('{' + hooks + '}', '{' + hooks + ', useMemo}');
          }
        }
        return match;
      }
    );
    modified = true;
  }
  
  // 3. Add const { colors: COLORS } = useTheme(); after component declaration
  const componentRegex = /export\s+const\s+\w+[^=]*=\s*\([^)]*\)\s*=>\s*{\s*\n/;
  const componentMatch = content.match(componentRegex);
  
  if (componentMatch) {
    const insertPoint = content.indexOf(componentMatch[0]) + componentMatch[0].length;
    const nextLine = content.slice(insertPoint, insertPoint + 100);
    
    if (!nextLine.includes('useTheme')) {
      content = content.slice(0, insertPoint) + 
                "  const { colors: COLORS } = useTheme();\n" + 
                content.slice(insertPoint);
      modified = true;
    }
  }
  
  // 4. Convert styles to createStyles function
  if (content.includes('const styles = StyleSheet.create({')) {
    content = content.replace(
      'const styles = StyleSheet.create({',
      'const createStyles = (COLORS: any) => StyleSheet.create({'
    );
    
    // Add const styles = useMemo(...) before the first useEffect or return
    const insertRegex = /(const\s+\w+\s*=\s*useRef[^;]+;\s*\n\s*\n)|(\s+useEffect\s*\()|(\s+return\s*\()/;
    const insertMatch = content.match(insertRegex);
    
    if (insertMatch) {
      const insertPoint = content.indexOf(insertMatch[0]);
      content = content.slice(0, insertPoint) + 
                "\n  const styles = useMemo(() => createStyles(COLORS), [COLORS]);\n" + 
                content.slice(insertPoint);
    }
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(filePath)}`);
  }
}

// Main execution
console.log('🚀 Starting theme fix for all screens...\n');

const allScreens = getAllTsxFiles(screensDir);
console.log(`Found ${allScreens.length} screens to check\n`);

allScreens.forEach(updateScreen);

console.log('\n✨ Done! All screens have been updated.');
