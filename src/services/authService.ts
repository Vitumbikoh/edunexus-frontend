import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Try to parse as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.log('❌ Parsed error:', errorJson);
        throw new Error(errorJson.message || errorJson.error || 'Invalid credentials');
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText || 'Invalid credentials'}`);
      }
    }

    const responseData = await response.json();
    return responseData;
  },

  validateToken: async (token: string): Promise<ValidateTokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    return response.json();
  },

  verifyToken: async (token: string): Promise<ValidateTokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  },
};
