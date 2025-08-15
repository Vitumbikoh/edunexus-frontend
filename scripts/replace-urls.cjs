#!/usr/bin/env node

/**
 * Script to replace hardcoded API URLs with environment variable references
 * Run this from the project root: node scripts/replace-urls.js
 */

const fs = require('fs');
const path = require('path');

const API_IMPORT = "import { API_CONFIG } from '@/config/api';";
const OLD_URL_PATTERN = /http:\/\/localhost:5000\/api\/v1/g;
const NEW_URL_REPLACEMENT = '${API_CONFIG.BASE_URL}';

// Files to process (add more as needed)
const filesToProcess = [
  'src/pages/teacher/TeacherStudents.tsx',
  'src/pages/teacher/TeacherForm.tsx',
  'src/pages/teacher/Teachers.tsx',
  'src/pages/teacher/TeacherSchedule.tsx',
  'src/pages/teacher/TeacherAttendance.tsx',
  'src/pages/teacher/TeacherCourses.tsx',
  'src/pages/student/Students.tsx',
  'src/pages/student/StudentGrades.tsx',
  'src/pages/student/StudentCourses.tsx',
  'src/pages/teacher/SubmitGrades.tsx',
  'src/pages/student/StudentSchedule.tsx',
  'src/pages/teacher/TeacherDetails.tsx',
  'src/pages/Schedule.tsx',
  'src/pages/student/StudentMaterials.tsx',
  'src/pages/LearningMaterials.tsx',
  'src/pages/finance/PaymentForm.tsx',
  'src/pages/finance/FinanceOfficers.tsx',
  'src/pages/finance/FinanceForm.tsx',
  'src/pages/finance/Finance.tsx',
];

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Check if file has hardcoded URLs
    if (OLD_URL_PATTERN.test(content)) {
      // Add import if not present
      if (!content.includes(API_IMPORT)) {
        // Find the last import statement
        const importLines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < importLines.length; i++) {
          if (importLines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex >= 0) {
          importLines.splice(lastImportIndex + 1, 0, API_IMPORT);
          content = importLines.join('\n');
          hasChanges = true;
        }
      }

      // Replace URLs with template literals
      const originalContent = content;
      content = content.replace(
        /['"`]http:\/\/localhost:5000\/api\/v1([^'"`]*?)['"`]/g,
        '`${API_CONFIG.BASE_URL}$1`'
      );

      if (content !== originalContent) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all files
console.log('🔄 Starting URL replacement...\n');

filesToProcess.forEach(file => {
  processFile(file);
});

console.log('\n✨ URL replacement completed!');
console.log('\n📝 Manual steps still needed:');
console.log('1. Review the changes and test the application');
console.log('2. Update any remaining hardcoded URLs manually');
console.log('3. Test with both development and production environments');
