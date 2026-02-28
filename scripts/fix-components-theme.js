/**
 * Fix all components to use dynamic theme
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');

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

function fixComponent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Skip if doesn't use COLORS
  if (!content.includes('COLORS')) {
    return;
  }
  
  // Skip if already has useTheme
  if (content.includes('useTheme')) {
    console.log(`⏭️  ${path.basename(filePath)} - already has useTheme`);
    return;
  }
  
  console.log(`🔧 Fixing ${path.basename(filePath)}...`);
  
  // 1. Add useTheme import
  const colorsImportRegex = /import\s+{([^}]*COLORS[^}]*)}\s+from\s+['"]\.\.\/\.\.\/utils\/constants['"]/;
  const match = content.match(colorsImportRegex);
  
  if (match) {
    const fullMatch = match[0];
    const imports = match[1];
    
    // Remove COLORS from the import
    const newImports = imports.split(',').map(i => i.trim()).filter(i => i !== 'COLORS').join(', ');
    const newImport = `import { ${newImports} } from '../../utils/constants'`;
    content = content.replace(fullMatch, newImport);
    
    // Add useTheme import after
    const insertPoint = content.indexOf(newImport) + newImport.length;
    content = content.slice(0, insertPoint) + "\nimport { useTheme } from '../../hooks/useTheme';" + content.slice(insertPoint);
    modified = true;
    console.log(`  ✅ Added useTheme import`);
  }
  
  // 2. Add useMemo to React imports
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
  
  // 3. Add useTheme hook at start of component
  const componentRegex = /export\s+const\s+(\w+):\s*React\.FC[^=]*=\s*\(([^)]*)\)\s*=>\s*{\s*\n/;
  const componentMatch = content.match(componentRegex);
  
  if (componentMatch) {
    const insertPoint = content.indexOf(componentMatch[0]) + componentMatch[0].length;
    content = content.slice(0, insertPoint) + 
              "  const { colors: COLORS } = useTheme();\n" + 
              content.slice(insertPoint);
    modified = true;
    console.log(`  ✅ Added useTheme hook`);
  }
  
  // 4. Convert styles to createStyles function
  if (content.includes('const styles = StyleSheet.create({')) {
    content = content.replace(
      'const styles = StyleSheet.create({',
      'const createStyles = (COLORS: any) => StyleSheet.create({'
    );
    
    // Add const styles = useMemo(...) after useTheme
    const useThemeRegex = /const\s+{\s*colors:\s*COLORS\s*}\s*=\s*useTheme\(\);/;
    const useThemeMatch = content.match(useThemeRegex);
    
    if (useThemeMatch) {
      const insertPoint = content.indexOf(useThemeMatch[0]) + useThemeMatch[0].length;
      content = content.slice(0, insertPoint) + 
                '\n  const styles = useMemo(() => createStyles(COLORS), [COLORS]);' + 
                content.slice(insertPoint);
      modified = true;
      console.log(`  ✅ Converted to dynamic styles`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(filePath)}\n`);
  }
}

// Main execution
console.log('🚀 Fixing all components to use dynamic theme...\n');

const allComponents = getAllTsxFiles(componentsDir);
console.log(`Found ${allComponents.length} components to process\n`);

allComponents.forEach(fixComponent);

console.log('\n✨ All components fixed!');
