import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface ExamResultSummary {
  totalResults: number;
  averageScore: number;
  overallGPA: number;
  remarks: string;
  totalMarks: number;
  totalPossible: number;
}

export interface CourseResult {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  termId: string;
  termName: string;
  finalPercentage: number;
  finalGradeCode: string;
  pass: boolean;
  breakdown?: any;
  computedAt: Date;
  schemeVersion: number;
}

export interface StudentExamResult {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    class?: any;
  };
  summary: ExamResultSummary;
  results: CourseResult[];
}

export interface ClassExamResult {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  totalResults: number;
  averageScore: number;
  overallGPA: number;
  remarks: string;
  results: Array<{
    courseId: string;
    courseName: string;
    courseCode: string;
    finalPercentage: number;
    finalGradeCode: string;
    pass: boolean;
  }>;
}

export interface ClassExamResults {
  classInfo: {
    id: string;
    name: string;
  };
  students: ClassExamResult[];
  summary: {
    totalStudents: number;
    studentsWithResults: number;
  };
}

export class ExamResultService {
  private static getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get aggregated exam results for a specific student
   */
  static async getStudentResults(
    studentId: string,
    token: string,
    classId?: string,
    termId?: string,
    academicCalendarId?: string,
  ): Promise<StudentExamResult> {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (termId) params.append('termId', termId);
    if (academicCalendarId) params.append('academicCalendarId', academicCalendarId);

    const url = `${API_BASE}/exam-results/student/${studentId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch student exam results: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get aggregated exam results for all students in a class
   */
  static async getClassResults(
    classId: string,
    token: string,
    schoolId?: string,
    termId?: string,
    academicCalendarId?: string,
  ): Promise<ClassExamResults> {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    if (termId) params.append('termId', termId);
    if (academicCalendarId) params.append('academicCalendarId', academicCalendarId);

    const url = `${API_BASE}/exam-results/class/${classId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch class exam results: ${response.statusText}`);
    }

    return response.json();
  }
}