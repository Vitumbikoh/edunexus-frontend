import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface AcademicYear {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  isCurrent?: boolean;
  current?: boolean;
  description?: string;
}

export interface AcademicYearResponse {
  academicYears?: AcademicYear[];
  success?: boolean;
  message?: string;
}

export const academicYearService = {
  // Get all academic years
  getAcademicYears: async (token: string): Promise<AcademicYear[]> => {
    const response = await fetch(`${API_BASE}/settings/academic-years`, {
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
      if (response.status === 404) {
        return []; // No academic years found
      }
      throw new Error(`Failed to fetch academic years: ${response.status}`);
    }

    // Check if response has content
    const text = await response.text();
    if (!text.trim()) {
      return []; // Empty response means no academic years
    }

    try {
      const data = JSON.parse(text);
      
      // Handle different response formats from backend
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.academicYears && Array.isArray(data.academicYears)) {
        return data.academicYears;
      }
      
      if (data.success && data.academicYears) {
        return data.academicYears;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to parse academic years response:', text);
      throw new Error('Invalid response format from server');
    }
  },

  // Get the active/current academic year
  getActiveAcademicYear: async (token: string): Promise<AcademicYear | null> => {
    try {
      const response = await fetch(`${API_BASE}/settings/active-academic-year`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No active academic year found
        }
        throw new Error('Failed to fetch active academic year');
      }

      // Check if response has content
      const text = await response.text();
      if (!text.trim()) {
        return null; // Empty response means no active academic year
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('Failed to parse active academic year response:', text);
        return null; // Invalid JSON, treat as no active academic year
      }
    } catch (error) {
      // If active endpoint fails, try to get from all academic years
      console.warn('Active academic year endpoint failed, falling back to all years');
      try {
        const allYears = await academicYearService.getAcademicYears(token);
        return allYears.find(year => year.isActive || year.isCurrent || year.current) || null;
      } catch (fallbackError) {
        console.error('Fallback to get active academic year also failed:', fallbackError);
        return null;
      }
    }
  },

  // Create a new academic year
  createAcademicYear: async (yearData: Omit<AcademicYear, 'id'>, token: string): Promise<AcademicYear> => {
    const response = await fetch(`${API_BASE}/settings/academic-years`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(yearData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create academic year');
    }

    return response.json();
  },

  // Update an academic year
  updateAcademicYear: async (id: string, yearData: Partial<AcademicYear>, token: string): Promise<AcademicYear> => {
    const response = await fetch(`${API_BASE}/settings/academic-years/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(yearData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update academic year');
    }

    return response.json();
  },

  // Set an academic year as active
  setActiveAcademicYear: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/academic-years/${id}/set-active`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to set active academic year');
    }
  },

  // Delete an academic year
  deleteAcademicYear: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/academic-years/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete academic year');
    }
  },
};
