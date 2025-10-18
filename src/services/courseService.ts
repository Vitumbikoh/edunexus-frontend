// src/services/courseService.ts
import { API_CONFIG } from '@/config/api';

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'upcoming';
  teacherId?: string;
  classId?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  class?: {
    id: string;
    name: string;
  };
  enrollmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseDto {
  code: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'upcoming';
  teacherId?: string;
  classId?: string;
}

export interface UpdateCourseDto {
  code?: string;
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'upcoming';
  teacherId?: string;
  classId?: string;
}

export interface BulkUploadResult {
  success: boolean;
  summary: {
    totalRows: number;
    created: number;
    failed: number;
  };
  created: Array<{
    line: number;
    id: string;
    code: string;
    name: string;
  }>;
  errors: Array<{
    line: number;
    error: string;
  }>;
  message: string;
}

class CourseService {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getCourses(
    token: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    classId?: string
  ): Promise<{ courses: Course[]; totalPages: number; totalItems: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (classId && classId !== 'all') params.append('classId', classId);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course?${params.toString()}`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      return {
        courses: data.courses || data || [],
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0,
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getCourse(token: string, id: string): Promise<Course> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/${id}`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  async createCourse(token: string, courseData: CreateCourseDto): Promise<Course> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(courseData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(token: string, id: string, courseData: UpdateCourseDto): Promise<Course> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/${id}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(courseData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(token: string, id: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/${id}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  async assignTeacher(token: string, courseId: string, teacherId: string): Promise<Course> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/${courseId}/assign-teacher`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({ teacherId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign teacher');
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      throw error;
    }
  }

  async bulkUploadCourses(token: string, file: File): Promise<BulkUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/bulk-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Bulk upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk uploading courses:', error);
      throw error;
    }
  }

  async downloadTemplate(token: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/template`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'course-bulk-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }

  // NEW METHODS FOR STUDENT COURSE FUNCTIONALITY

  /**
   * Get detailed course information for a student
   */
  async getCourseDetails(token: string, courseId: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/${courseId}`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course details:', error);
      throw error;
    }
  }

  /**
   * Get course schedule for a specific course
   */
  async getCourseSchedule(token: string, courseId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/schedules/course/${courseId}`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        console.warn(`Schedule endpoint for course ${courseId} not available`);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.schedules || [];
    } catch (error) {
      console.error('Error fetching course schedule:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get exams for a course
   */
  async getCourseExams(token: string, courseId: string): Promise<any[]> {
    try {
      // Use general exams endpoint - backend doesn't have course-specific endpoint
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/exams`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        console.warn(`Exams endpoint not available`);
        return [];
      }

      const data = await response.json();
      // Filter exams by course on frontend since backend doesn't support course filter
      const exams = Array.isArray(data) ? data : data.exams || [];
      return exams.filter((exam: any) => exam.courseId === courseId || exam.course?.id === courseId);
    } catch (error) {
      console.error('Error fetching course exams:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get student progress for a course - simplified since backend doesn't have this endpoint
   */
  async getStudentCourseProgress(token: string, studentId: string, courseId: string): Promise<any> {
    // Backend doesn't have a progress endpoint, return basic structure
    return {
      completedItems: 0,
      totalItems: 1,
      percentage: 0,
      averageScore: 0
    };
  }

  /**
   * Format schedule for display
   */
  formatScheduleDisplay(schedules: any[]): string {
    if (!schedules || schedules.length === 0) {
      return 'No scheduled classes';
    }

    // Group by day and time
    const scheduleByDay = schedules.reduce((acc, schedule) => {
      const day = schedule.day || 'Unknown';
      if (!acc[day]) acc[day] = [];
      acc[day].push({
        time: `${schedule.startTime || '00:00'}-${schedule.endTime || '00:00'}`,
        room: schedule.classroom?.name || 'TBD'
      });
      return acc;
    }, {});

    // Format for display
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const formattedDays = dayOrder
      .filter(day => scheduleByDay[day])
      .map(day => {
        const times = scheduleByDay[day].map(s => s.time).join(', ');
        return `${day.substring(0, 3)} ${times}`;
      });

    return formattedDays.length > 0 ? formattedDays.join(' • ') : 'Schedule TBD';
  }

  /**
   * Get the next upcoming exam for a course (no assignments)
   */
  async getNextCourseItem(token: string, courseId: string): Promise<string> {
    try {
      // Only fetch exams, no assignments
      const exams = await this.getCourseExams(token, courseId);

      const now = new Date();
      
      // Filter upcoming exams
      const upcomingExams = exams.filter(e => 
        e.date && new Date(e.date) > now
      );

      // Get the next exam (earliest date)
      let nextItem = null;
      let nextDate = null;

      upcomingExams.forEach(exam => {
        const examDate = new Date(exam.date);
        if (!nextDate || examDate < nextDate) {
          nextDate = examDate;
          nextItem = `Exam: ${exam.title}`;
        }
      });

      return nextItem || 'No upcoming exams';
    } catch (error) {
      console.error('Error fetching next course item:', error);
      return 'Unable to load';
    }
  }
}

export const courseService = new CourseService();