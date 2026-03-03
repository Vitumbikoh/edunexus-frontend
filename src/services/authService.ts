// authService.ts updated per user request
import { API_BASE_URL } from '@/config/api';

// If VITE_API_BASE_URL already contains /api/v1 strip it to append explicit endpoints below.
const API_BASE = API_BASE_URL.replace(/\/$/, '').replace(/\/?api\/v1\/?$/, '');

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      // Try to extract error message from response
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parsing fails, use default message
        errorMessage = `Login failed (HTTP ${response.status})`;
      }
      
      const error = new Error(errorMessage);
      (error as any).response = { data: { message: errorMessage } };
      throw error;
    }

    return response.json();
  },

  verifyToken: async (token: string) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return response.json();
  },

  refreshToken: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json() as Promise<{ access_token: string; refresh_token?: string }>;
  },

  logout: async (refreshToken?: string) => {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => undefined);
  },

  // First-login / standard password change. Some backends expect newPassword, others password.
  changePassword: async (newPassword: string, token: string) => {
    const url = `${API_BASE}/api/v1/users/me/change-password`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!res.ok) {
      // Try parse JSON error; fallback to text
      let serverMessage = '';
      try {
        const data = await res.json();
        serverMessage = data.message || data.error || '';
      } catch {
        serverMessage = await res.text().catch(() => '');
      }
      throw new Error(serverMessage || `Password change failed (HTTP ${res.status})`);
    }

    // Successful response (may or may not have body)
    try {
      return await res.json();
    } catch {
      return { success: true };
    }
  }
};
