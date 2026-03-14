import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface Exam {
  id: string;
  title: string;
  subject: string;
  classId: string;
  class: {
    id: string;
    name: string;
    numericalName?: number;
    description?: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    userId: string;
    phoneNumber?: string;
    address?: string;
  };
  date: string;
  duration: string;
  totalMarks: number;
  status: 'upcoming' | 'administered' | 'graded';
  studentsEnrolled: number;
  studentsCompleted: number;
  term: {
    id: string;
    name?: string;
    startDate: string;
    endDate: string;
    academicCalendar?: any;
    period?: any;
  } | string; // Support both object and string formats
  termId?: string;
  description?: string;
  instructions?: string;
  examType?: string;
  course?: {
    id: string;
    name: string;
    code?: string;
    description?: string;
    status?: string;
  };
  schoolId?: string;
}

export interface ExamFilters {
  searchPeriod?: string;
  classId?: string;
  // Optional class name; when provided we pass it as 'class' to the backend
  className?: string;
  teacherId?: string;
  termId?: string;
  status?: string;
}

export interface ExamResponse {
  exams?: Exam[];
  success?: boolean;
  message?: string;
  pagination?: {
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
  };
}

export const examService = {
  // Get all exams with optional filters
  getExams: async (token: string, filters?: ExamFilters): Promise<Exam[]> => {
    // Map our local filter names to backend expected query params
    const queryParams = new URLSearchParams();
    if (filters) {
      if (filters.searchPeriod) queryParams.append('searchText', filters.searchPeriod);
      if (filters.className) queryParams.append('class', filters.className);
      if (filters.teacherId) queryParams.append('teacherId', filters.teacherId);
      if (filters.termId) queryParams.append('Term', filters.termId); // backend expects 'Term'
      if (filters.status) queryParams.append('status', filters.status);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE}/exams${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      if (response.status === 403) {
        throw new Error('Access Denied - Insufficient permissions');
      }
      throw new Error(`Failed to fetch exams: ${response.status}`);
    }

    // Check if response has content
    const text = await response.text();
    if (!text.trim()) {
      return []; // Empty response means no exams
    }

    try {
      const data = JSON.parse(text);

      const normalize = (e: any): Exam => {
        // Normalize term fields: support backend 'Term' relation and 'TermId'
        const termRel = e.term || e.Term || null;
        const normalizedTermId: string | undefined = e.termId || e.TermId || (termRel && typeof termRel === 'object' ? termRel.id : undefined);
        let normalizedTerm: any = undefined;
        if (termRel && typeof termRel === 'object') {
          const n = termRel.termNumber || termRel.term || termRel.period?.order;
          let name: string | undefined;
          if (typeof n === 'number') name = `Term ${n}`;
          else if (typeof n === 'string') {
            const num = n.match(/\d+/)?.[0];
            if (num) name = `Term ${num}`;
          } else if (termRel.name) {
            const num = String(termRel.name).match(/\d+/)?.[0];
            if (num) name = `Term ${num}`;
          }
          normalizedTerm = {
            id: normalizedTermId,
            name,
            startDate: termRel.startDate,
            endDate: termRel.endDate,
            academicCalendar: termRel.academicCalendar,
            period: termRel.period,
          };
        } else if (normalizedTermId) {
          normalizedTerm = { id: normalizedTermId } as any;
        }

        const normalizedSubject = e.subject || e.course?.name || e.courseName || e.subjectName || e.course?.code || 'N/A';
        const normalizedCourse = e.course || (
          e.courseId || e.courseName || e.courseCode || e.subject
            ? {
                id: e.courseId || '',
                name: e.courseName || e.subject || normalizedSubject,
                code: e.courseCode || e.course?.code,
              }
            : undefined
        );

        return {
          ...e,
          subject: normalizedSubject,
          course: normalizedCourse,
          termId: normalizedTermId,
          term: normalizedTerm || e.term,
        } as Exam;
      };

      // Handle different response formats from backend
      if (Array.isArray(data)) {
        return data.map(normalize);
      }

      if (data.exams && Array.isArray(data.exams)) {
        return data.exams.map(normalize);
      }

      if (data.success && data.exams) {
        return data.exams.map(normalize);
      }

      return [];
    } catch (error) {
      console.error('Failed to parse exams response:', text);
      throw new Error('Invalid response format from server');
    }
  },

  // Get exam by ID
  getExamById: async (id: string, token: string): Promise<Exam | null> => {
    const response = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Exam not found
      }
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      throw new Error(`Failed to fetch exam: ${response.status}`);
    }

    return response.json();
  },

  // Administer an exam (change status to administered)
  administerExam: async (id: string, token: string): Promise<Exam> => {
    const response = await fetch(`${API_BASE}/exams/${id}/administer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      if (response.status === 403) {
        throw new Error('Access Denied - You are not authorized to administer this exam');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to administer exam');
      }
      throw new Error(`Failed to administer exam: ${response.status}`);
    }

    return response.json();
  },

  // Create a new exam
  createExam: async (examData: Omit<Exam, 'id' | 'class' | 'teacher'>, token: string): Promise<Exam> => {
    const response = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create exam');
    }

    return response.json();
  },

  // Update an exam
  updateExam: async (id: string, examData: Partial<Exam>, token: string): Promise<Exam> => {
    const response = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update exam');
    }

    return response.json();
  },

  // Delete an exam
  deleteExam: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete exam');
    }
  },

  // Get exams for a specific teacher
  getTeacherExams: async (token: string, filters?: ExamFilters): Promise<Exam[]> => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE}/teacher/my-exams${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      throw new Error(`Failed to fetch teacher exams: ${response.status}`);
    }

    const data = await response.json();
    return data.exams || data || [];
  },

  // Get exams for a specific class
  getClassExams: async (classId: string, token: string, filters?: ExamFilters): Promise<Exam[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('classId', classId);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'classId') {
          queryParams.append(key, value);
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE}/exams?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      throw new Error(`Failed to fetch class exams: ${response.status}`);
    }

    const data = await response.json();
    return data.exams || data || [];
  },
};
