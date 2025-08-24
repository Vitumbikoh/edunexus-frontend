import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface Class {
  id: string;
  name: string;
  numericalName?: number;
  description?: string;
  studentsCount?: number;
}

export interface ClassResponse {
  classes?: Class[];
  success?: boolean;
  message?: string;
}

export const classService = {
  // Get all classes
  getClasses: async (token: string): Promise<Class[]> => {
    const response = await fetch(`${API_BASE}/classes`, {
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
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }

    // Check if response has content
    const text = await response.text();
    if (!text.trim()) {
      return []; // Empty response means no classes
    }

    try {
      const data = JSON.parse(text);
      
      // Handle different response formats from backend
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.classes && Array.isArray(data.classes)) {
        return data.classes;
      }
      
      if (data.success && data.classes) {
        return data.classes;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to parse classes response:', text);
      throw new Error('Invalid response format from server');
    }
  },

  // Get classes for teacher
  getTeacherClasses: async (token: string): Promise<Class[]> => {
    const response = await fetch(`${API_BASE}/teacher/my-classes`, {
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
      throw new Error(`Failed to fetch teacher classes: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.classes) {
      return data.classes;
    }
    
    return data.classes || [];
  },

  // Create a new class (admin only)
  createClass: async (classData: Omit<Class, 'id'>, token: string): Promise<Class> => {
    const response = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(classData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create class');
    }

    return response.json();
  },

  // Update a class (admin only)
  updateClass: async (id: string, classData: Partial<Class>, token: string): Promise<Class> => {
    const response = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(classData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update class');
    }

    return response.json();
  },

  // Delete a class (admin only)
  deleteClass: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete class');
    }
  },
};
