// Academic Calendar Service for managing academic calendar operations
import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface AcademicCalendar {
  id?: string;
  term: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  isCompleted?: boolean;
}

export const academicCalendarService = {
  // Get all academic calendars
  getAcademicCalendars: async (token: string): Promise<AcademicCalendar[]> => {
    // Try the accessible endpoint first (works for any authenticated user)
    try {
      const response = await fetch(`${API_BASE}/settings/academic-calendars/accessible`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (!text.trim()) {
          return []; // Empty response means no calendars
        }

        try {
          const data = JSON.parse(text);
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Failed to parse accessible calendars response:', text);
          return [];
        }
      }
    } catch (error) {
      console.warn('Failed to fetch accessible academic calendars, trying admin endpoint:', error);
    }

    // Fallback to admin-only endpoint
    const response = await fetch(`${API_BASE}/settings/academic-calendars`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch academic calendars');
    }

    // Check if response has content
    const text = await response.text();
    if (!text.trim()) {
      return []; // Empty response means no calendars
    }

    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to parse academic calendars response:', text);
      throw new Error('Invalid response format from server');
    }
  },

  // Get the active academic calendar
  getActiveAcademicCalendar: async (token: string): Promise<AcademicCalendar | null> => {
    const response = await fetch(`${API_BASE}/settings/active-academic-calendar`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No active calendar found
      }
      throw new Error('Failed to fetch active academic calendar');
    }

    // Check if response has content
    const text = await response.text();
    if (!text.trim()) {
      return null; // Empty response means no active calendar
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse active calendar response:', text);
      return null; // Invalid JSON, treat as no active calendar
    }
  },

  // Set an academic calendar as active
  setActiveAcademicCalendar: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/set-active-academic-calendar/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to set active academic calendar');
    }
  },

  // Close an academic calendar
  closeAcademicCalendar: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/settings/close-academic-calendar/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to close academic calendar');
    }
  },

  // Create a new academic calendar
  createAcademicCalendar: async (calendar: Omit<AcademicCalendar, 'id'>, token: string): Promise<AcademicCalendar> => {
    const response = await fetch(`${API_BASE}/settings/academic-calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        term: calendar.term,
        startDate: calendar.startDate || undefined,
        endDate: calendar.endDate || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create academic calendar');
    }

    return response.json();
  },

  // Update an existing academic calendar
  updateAcademicCalendar: async (id: string, calendar: Partial<AcademicCalendar>, token: string): Promise<AcademicCalendar> => {
    const response = await fetch(`${API_BASE}/settings/academic-calendars/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(calendar),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update academic calendar');
    }

    return response.json();
  },
};
