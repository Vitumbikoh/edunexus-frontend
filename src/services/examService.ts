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
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    userId: string;
  };
  date: string;
  duration: string;
  totalMarks: number;
  status: 'upcoming' | 'administered' | 'graded';
  studentsEnrolled: number;
  studentsCompleted: number;
  academicYear: string;
  description?: string;
}

export interface ExamFilters {
  searchTerm?: string;
  classId?: string;
  teacherId?: string;
  academicYearId?: string;
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
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
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
      
      // Handle different response formats from backend
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.exams && Array.isArray(data.exams)) {
        return data.exams;
      }
      
      if (data.success && data.exams) {
        return data.exams;
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
