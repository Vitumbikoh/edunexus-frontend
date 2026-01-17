import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface Term {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  isCurrent?: boolean;
  current?: boolean;
  description?: string;
  // Additional fields returned by backend (harmonize naming)
  term?: string; // e.g. "2023-2024"
  periodName?: string; // e.g. "Period 1"
  termNumber?: number;
  isCompleted?: boolean;
  academicCalendarId?: string;
  periodId?: string;
  // Results publishing status
  resultsPublished?: boolean;
  resultsPublishedAt?: string | null;
  inExamPeriod?: boolean;
  examPeriodStartedAt?: string | null;
}

export interface TermResponse {
  terms?: Term[];
  success?: boolean;
  message?: string;
}

export const termService = {
  // Get all academic years
  getTerms: async (token: string): Promise<Term[]> => {
    const response = await fetch(`${API_BASE}/settings/terms`, {
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
      
      if (data.terms && Array.isArray(data.terms)) {
        return data.terms;
      }
      
      if (data.success && data.terms) {
        return data.terms;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to parse academic years response:', text);
      throw new Error('Invalid response format from server');
    }
  },

  // Get the active/current academic year
  getActiveTerm: async (token: string): Promise<Term | null> => {
    try {
      // Backend exposes the active calendar at /settings/active-academic-calendar
      const response = await fetch(`${API_BASE}/settings/active-academic-calendar`, {
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
        const allYears = await termService.getTerms(token);
        return allYears.find(year => year.isActive || year.isCurrent || year.current) || null;
      } catch (fallbackError) {
        console.error('Fallback to get active academic year also failed:', fallbackError);
        return null;
      }
    }
  },

  // Create a new academic year
  createTerm: async (yearData: Omit<Term, 'id'>, token: string): Promise<Term> => {
    const response = await fetch(`${API_BASE}/settings/terms`, {
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
  updateTerm: async (id: string, yearData: Partial<Term>, token: string): Promise<Term> => {
    const response = await fetch(`${API_BASE}/settings/terms/${id}`, {
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
  setActiveTerm: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/terms/${id}/set-active`, {
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
  deleteTerm: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/terms/${id}`, {
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

  // Enter exam period for a term
  enterExamPeriod: async (termId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/terms/${termId}/enter-exam-period`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to enter exam period');
    }
  },

  // Publish results for a term
  publishResults: async (termId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/terms/${termId}/publish-results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to publish results');
    }
  },

  // Unpublish results for a term
  unpublishResults: async (termId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/terms/${termId}/unpublish-results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to unpublish results');
    }
  },
};
