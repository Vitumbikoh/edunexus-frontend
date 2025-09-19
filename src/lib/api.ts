

import { API_CONFIG } from '@/config/api';

export const api = {
  get: async (endpoint: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  post: async (endpoint: string, body: unknown) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  patch: async (endpoint: string, body: unknown) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  put: async (endpoint: string, body: unknown) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  delete: async (endpoint: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};
