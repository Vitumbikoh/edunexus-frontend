// authService.ts updated per user request
// Note: Using process.env.REACT_APP_API_URL (CRA style). In Vite, prefer import.meta.env.VITE_API_BASE_URL.
// To keep compatibility, we also check Vite env if available.
// Falls back to localhost server root (without /api/v1) because endpoints below include /api/v1.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runtimeEnv: any = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
// Vite doesn't expose process.env by default; use import.meta.env only.
// If VITE_API_BASE_URL already contains /api/v1 strip it to append explicit endpoints below.
const API_BASE_URL = (runtimeEnv.VITE_API_BASE_URL || 'http://localhost:5000')
  .replace(/\/$/, '')
  .replace(/\/?api\/v1\/?$/, '');

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
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
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify`, {
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

  // First-login / standard password change. Some backends expect newPassword, others password.
  changePassword: async (newPassword: string, token: string) => {
    const url = `${API_BASE_URL}/api/v1/users/me/change-password`;
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
