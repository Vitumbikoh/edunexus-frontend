// Quick test to verify the enhanced activity formatter
import { toFriendlyActivity, buildFieldChanges } from './activityFormatter';

// Test student creation
const studentCreationLog = {
  id: '123',
  action: 'create_student_user',
  module: 'users',
  performedBy: {
    name: 'John Admin',
    email: 'admin@school.com',
    role: 'admin'
  },
  newValues: {
    firstName: 'Matthews',
    lastName: 'Johnson',
    studentNumber: 'STU001',
    gradeLevel: '10',
    phoneNumber: '123-456-7890'
  },
  metadata: {
    student_full_name: 'Matthews Johnson',
    created_by_admin: 'admin@school.com'
  },
  timestamp: '2025-09-12T10:30:00Z'
};

// Test enrollment
const enrollmentLog = {
  id: '456',
  action: 'STUDENT_ENROLLED_CONTROLLER',
  module: 'ENROLLMENT',
  performedBy: {
    name: 'John Admin',
    email: 'admin@school.com',
    role: 'admin'
  },
  newValues: {
    courseName: 'Mathematics Grade 10'
  },
  metadata: {
    studentName: 'Matthews Johnson',
    courseName: 'Mathematics Grade 10'
  },
  timestamp: '2025-09-12T10:35:00Z'
};

console.log('Student Creation:');
console.log(toFriendlyActivity(studentCreationLog));

console.log('\nStudent Enrollment:');
console.log(toFriendlyActivity(enrollmentLog));

console.log('\nField Changes:');
const oldVals = { firstName: 'Matt', gradeLevel: '9', createdAt: '2025-09-11T08:00:00Z', schoolId: 'abc123' };
const newVals = { firstName: 'Matthews', gradeLevel: '10', updatedAt: '2025-09-12T10:30:00Z', schoolId: 'abc123' };
console.log(buildFieldChanges(oldVals, newVals));
