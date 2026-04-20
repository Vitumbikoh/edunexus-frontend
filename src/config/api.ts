/**
 * Centralized API Configuration
 *
 * Uses environment variables for all environments.
 *
 * .env (development)
 * VITE_API_BASE_URL=http://localhost:5000/api/v1
 *
 * .env.production (production)
 * VITE_API_BASE_URL=https://api.educnexus.tech/api/v1
 */

/**
 * Get API base URL from environment variables
 */
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

  // 🚨 No fallback in production
  if (import.meta.env.PROD) {
    if (!envUrl) {
      throw new Error(
        'VITE_API_BASE_URL is not defined in production environment'
      );
    }
    return envUrl;
  }

  // ✅ Development fallback
  return envUrl || 'http://localhost:5000/api/v1';
};

/**
 * Main API base URL
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Server base URL (without /api/v1)
 */
export const getServerBaseUrl = (): string => {
  return API_BASE_URL.replace('/api/v1', '');
};

/**
 * API Configuration object
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: getServerBaseUrl(),
} as const;

export default API_BASE_URL;