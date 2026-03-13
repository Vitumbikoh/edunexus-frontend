#!/usr/bin/env node
/**
 * Script to replace all hardcoded API base URLs with centralized import
 * Run this script from the edunexus-frontend directory
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

// Pattern to match hardcoded base URLs
const patterns = [
  // Match: import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || ...}`
  /import\.meta\.env\.VITE_API_BASE_URL \|\| `\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| `\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| 'http:\/\/localhost:5000\/api\/v1'\}`\}`/g,
  // Match simpler nested patterns
  /import\.meta\.env\.VITE_API_BASE_URL \|\| `\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| 'http:\/\/localhost:5000\/api\/v1'\}`/g,
  // Match single occurrences
  /import\.meta\.env\.VITE_API_BASE_URL \|\| 'http:\/\/localhost:5000\/api\/v1'/g,
];

const replacement = 'API_BASE_URL';

// Import statement to add if not present
const importStatement = "import { API_BASE_URL } from '@/config/api';";

async function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file needs updating
  const needsUpdate = patterns.some(pattern => pattern.test(content));
  
  if (!needsUpdate) {
    return { updated: false, filePath };
  }
  
  // Replace all patterns
  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Add import if not present and file was modified
  if (modified && !content.includes("from '@/config/api'")) {
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ') && !importLines[i].includes('@/config/api')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      importLines.splice(lastImportIndex + 1, 0, importStatement);
      content = importLines.join('\n');
    } else {
      // No imports found, add at the beginning
      content = importStatement + '\n\n' + content;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { updated: true, filePath };
  }
  
  return { updated: false, filePath };
}

async function main() {
  console.log('🔍 Searching for files with hardcoded API URLs...\n');
  
  // Find all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: srcDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    absolute: true,
  });
  
  console.log(`Found ${files.length} files to check\n`);
  
  let updatedCount = 0;
  const updatedFiles = [];
  
  for (const file of files) {
    const result = await updateFile(file);
    if (result.updated) {
      updatedCount++;
      const relativePath = path.relative(projectRoot, result.filePath);
      updatedFiles.push(relativePath);
      console.log(`✅ Updated: ${relativePath}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✨ Summary: Updated ${updatedCount} file(s)`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (updatedFiles.length > 0) {
    console.log('Updated files:');
    updatedFiles.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log('No files needed updating!');
  }
}

main().catch(console.error);
