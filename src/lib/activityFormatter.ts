// Shared helpers to format activity / notification data into human readable text
// without exposing raw technical implementation details.

export interface RawActivityLog {
  id: string;
  action: string;
  module?: string;
  level?: string;
  performedBy?: { id?: string; email?: string; role?: string; name?: string; username?: string } | null;
  entityId?: string | null;
  entityType?: string | null;
  newValues?: any;
  oldValues?: any;
  metadata?: any;
  timestamp: string;
}

export interface FriendlyActivity {
  id: string;
  actor: string;
  actorRole?: string;
  verb: string;          // Created / Updated / Deleted / Processed / Logged in / etc
  target: string;        // Student John Doe / Fee Payment / Budget 2025 etc
  summary: string;       // Full sentence summary
  module: string;
  time: string;          // ISO string
  raw: RawActivityLog;   // Preserve raw for any deeper inspection if needed
}

// Map action code to a friendly verb.
function deriveVerb(action: string): string {
  const a = action.toUpperCase();
  if (a.startsWith('CREATE') || a.startsWith('ADD_')) return 'Created';
  if (a.startsWith('UPDATE') || a.startsWith('EDIT_')) return 'Updated';
  if (a.startsWith('DELETE') || a.startsWith('REMOVE_')) return 'Deleted';
  if (a.includes('LOGIN')) return 'Logged in';
  if (a.includes('LOGOUT')) return 'Logged out';
  if (a.includes('ENROLL')) return 'Enrolled';
  if (a.includes('PAYMENT') || a.includes('FEE')) return 'Processed payment';
  if (a.includes('APPROVE')) return 'Approved';
  if (a.includes('REJECT')) return 'Rejected';
  if (a.includes('GENERATE')) return 'Generated';
  if (a.includes('SUBMIT')) return 'Submitted';
  return action
    .replace(/_/g, ' ') // fallback
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

// Attempt to derive a target entity description from available fields.
function deriveTarget(raw: RawActivityLog): string {
  const meta = raw.metadata || {};
  const newVals = raw.newValues || {};
  
  // Check for teacher names first (from metadata)
  if (meta.teacher_full_name) return `Teacher ${meta.teacher_full_name}`;
  
  // Check for student names from various sources
  if (meta.student_full_name) return `Student ${meta.student_full_name}`;
  if (meta.studentName) return `Student ${meta.studentName}`;
  if (newVals.studentName) return `Student ${newVals.studentName}`;
  if (newVals.fullName) return `Student ${newVals.fullName}`;
  if (newVals.firstName && newVals.lastName) {
    // Determine role from action or entity type
    const actionUpper = (raw.action || '').toUpperCase();
    if (actionUpper.includes('TEACHER')) return `Teacher ${newVals.firstName} ${newVals.lastName}`;
    if (actionUpper.includes('STUDENT')) return `Student ${newVals.firstName} ${newVals.lastName}`;
    if (actionUpper.includes('PARENT')) return `Parent ${newVals.firstName} ${newVals.lastName}`;
    if (actionUpper.includes('FINANCE')) return `Finance User ${newVals.firstName} ${newVals.lastName}`;
    if (raw.entityType?.toLowerCase() === 'teacher') return `Teacher ${newVals.firstName} ${newVals.lastName}`;
    return `${newVals.firstName} ${newVals.lastName}`;
  }
  
  // Course/class names
  if (meta.courseName) return `Course ${meta.courseName}`;
  if (newVals.courseName) return `Course ${newVals.courseName}`;
  if (newVals.className) return `Class ${newVals.className}`;
  if (newVals.name && raw.entityType?.toLowerCase().includes('course')) return `Course ${newVals.name}`;
  if (newVals.name && raw.entityType?.toLowerCase().includes('class')) return `Class ${newVals.name}`;
  
  // Generic entity name
  if (newVals.name) return newVals.name;
  
  // Fallback to entity type or action-based guessing
  if (raw.entityType) {
    if (raw.entityType.toLowerCase() === 'student') return 'Student';
    if (raw.entityType.toLowerCase() === 'teacher') return 'Teacher';
    if (raw.entityType.toLowerCase() === 'course') return 'Course';
    if (raw.entityType.toLowerCase() === 'enrollment') return 'Enrollment';
    return raw.entityType;
  }
  
  // Action-based fallback
  if (raw.action?.toUpperCase().includes('PAYMENT')) return 'Fee Payment';
  if (raw.action?.toUpperCase().includes('TEACHER')) return 'Teacher';
  if (raw.action?.toUpperCase().includes('STUDENT')) return 'Student';
  if (raw.action?.toUpperCase().includes('COURSE')) return 'Course';
  
  return 'Record';
}

export function toFriendlyActivity(raw: RawActivityLog): FriendlyActivity {
  // DEBUG: Add logging to see what we're working with
  console.log('Processing activity:', {
    action: raw.action,
    performedBy: raw.performedBy,
    metadata: raw.metadata,
    newValues: raw.newValues
  });
  
  const verb = deriveVerb(raw.action || 'Activity');
  const actor = raw.performedBy?.name || raw.performedBy?.username || raw.performedBy?.email?.split('@')[0] || 'System';
  let target = deriveTarget(raw);
  const upperAction = (raw.action || '').toUpperCase();
  
  // Extract names from various possible locations
  const studentName = raw.metadata?.student_full_name || 
                     raw.metadata?.teacher_full_name ||
                     raw.newValues?.studentName || 
                     raw.newValues?.fullName ||
                     (raw.newValues?.firstName && raw.newValues?.lastName ? 
                      `${raw.newValues.firstName} ${raw.newValues.lastName}` : null);
  
  const courseList = extractCourseList(raw);
  const courseName = raw.newValues?.courseName || raw.metadata?.courseName;
  
  let summary: string;
  
  // Handle specific user creation actions
  if (upperAction.includes('CREATE_TEACHER_USER') && raw.metadata?.teacher_full_name) {
    summary = `${actor} created ${raw.metadata.teacher_full_name} (teacher)`;
    target = `Teacher ${raw.metadata.teacher_full_name}`;
  }
  else if (upperAction.includes('CREATE_STUDENT_USER') && studentName) {
    summary = `${actor} created ${studentName} (student)`;
    if (courseList.length) summary += `. Enrolled in: ${courseList.join(', ')}`;
    target = `Student ${studentName}`;
  }
  else if (upperAction.includes('CREATE_PARENT_USER') && studentName) {
    summary = `${actor} created ${studentName} (parent)`;
    target = `Parent ${studentName}`;
  }
  else if (upperAction.includes('CREATE_FINANCE_USER') && studentName) {
    summary = `${actor} created ${studentName} (finance user)`;
    target = `Finance User ${studentName}`;
  }
  // Handle student enrollment
  else if (upperAction.includes('ENROLL') && studentName) {
    if (courseName) {
      summary = `${actor} enrolled ${studentName} in ${courseName}`;
    } else if (courseList.length) {
      summary = `${actor} enrolled ${studentName} in ${courseList.join(', ')}`;
    } else {
      summary = `${actor} enrolled ${studentName}`;
    }
    target = `Student ${studentName}`;
  } 
  // Handle payments
  else if (upperAction.includes('PAYMENT') && (raw.newValues?.amount || raw.metadata?.dto?.amount)) {
    const amount = raw.newValues?.amount || raw.metadata?.dto?.amount;
    summary = `${actor} processed payment of ${amount}${studentName ? ' for ' + studentName : ''}`;
    target = 'Fee Payment';
  } 
  // Handle class/course creation
  else if (upperAction.includes('CREATE') && (raw.newValues?.name || raw.newValues?.className)) {
    const entityName = raw.newValues?.name || raw.newValues?.className;
    summary = `${actor} created ${entityName}`;
    target = entityName;
  }
  // Handle updates with names
  else if (upperAction.includes('UPDATE') && (raw.newValues?.name || studentName)) {
    const entityName = raw.newValues?.name || studentName;
    summary = `${actor} updated ${entityName}`;
    target = entityName;
  }
  // Default fallback with better target detection
  else {
    // If we have a good target name, use it
    if (studentName && !target.toLowerCase().includes(studentName.toLowerCase())) {
      target = studentName;
    }
    summary = `${actor} ${verb.toLowerCase()} ${target.toLowerCase()}`;
  }
  
  console.log('Generated summary:', summary);
  
  return {
    id: raw.id,
    actor,
    actorRole: raw.performedBy?.role,
    verb,
    target,
    summary,
    module: raw.module || 'System',
    time: raw.timestamp,
    raw,
  };
}

function extractCourseList(raw: RawActivityLog): string[] {
  const meta = raw.metadata || {};
  const newVals = raw.newValues || {};
  
  // Try various possible course data sources
  const candidates: any = meta.courses || 
                         meta.enrolledCourses || 
                         meta.courseList ||
                         newVals.courses || 
                         newVals.enrolledCourses ||
                         // Handle single course name
                         (meta.courseName ? [meta.courseName] : null) ||
                         (newVals.courseName ? [newVals.courseName] : null);
  
  if (!candidates) return [];
  
  if (Array.isArray(candidates)) {
    return candidates
      .map((c) => {
        if (typeof c === 'string') return c;
        if (c?.name) return c.name;
        if (c?.title) return c.title;
        if (c?.code) return c.code;
        if (c?.courseName) return c.courseName;
        return null;
      })
      .filter(Boolean)
      .slice(0, 6); // cap to avoid overflow
  }
  
  return [];
}

// Build diff of old vs new values (flattened dot path form) for display.
export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changed: boolean;
}

function flatten(obj: any, prefix = '', out: Record<string, any> = {}): Record<string, any> {
  if (!obj || typeof obj !== 'object') return out;
  Object.keys(obj).forEach((k) => {
    const val = obj[k];
    const path = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) flatten(val, path, out);
    else out[path] = val;
  });
  return out;
}

export function buildFieldChanges(oldValues: any, newValues: any): FieldChange[] {
  const EXCLUDE = new Set([
    'id', 'entityId', 'schoolId', 'createdBy', 'updatedBy', 'password', 
    'studentId', 'courseId', 'classId', 'parentId', 'teacherId', 'adminId',
    'userId', 'termId', 'gradeId'
  ]);
  
  const shouldExclude = (k: string) => {
    const base = k.split('.').pop() || k;
    return EXCLUDE.has(base) || 
           (base.toLowerCase().endsWith('id') && !['studentNumber', 'admissionId'].includes(base)) ||
           base.toLowerCase().includes('password');
  };

  const oldFlat = flatten(oldValues || {});
  const newFlat = flatten(newValues || {});
  const allKeys = Array.from(new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])).sort();
  
  const isDateLike = (val: any) => typeof val === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:/i.test(val);
  const fmt = (v: any) => {
    if (v === undefined || v === null) return null;
    if (isDateLike(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    }
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  return allKeys
    .filter((k) => !shouldExclude(k))
    .map((key) => {
      const o = oldFlat[key];
      const n = newFlat[key];
      const oldNorm = fmt(o);
      const newNorm = fmt(n);
      return { 
        field: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Format camelCase
        oldValue: oldNorm, 
        newValue: newNorm, 
        changed: oldNorm !== newNorm 
      };
    })
    .filter((fc) => fc.changed);
}
