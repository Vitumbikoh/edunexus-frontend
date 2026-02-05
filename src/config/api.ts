/**
 * Centralized API Configuration
 * 
 * This file contains the single source of truth for the API base URL.
 * All API calls throughout the application should import and use this configuration.
 * 
 * To change the backend URL, update the VITE_API_BASE_URL in your .env file:
 * VITE_API_BASE_URL=https://your-backend-url.com/api/v1
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost development server if not set
 */
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  
  // Return environment URL if set, otherwise use localhost default
  return envUrl || 'http://localhost:5000/api/v1';
};

/**
 * The main API base URL - use this for all API calls
 * Example: `${API_BASE_URL}/students`
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Get the base URL without the /api/v1 suffix
 * Useful for file uploads and other non-API endpoints
 */
export const getServerBaseUrl = (): string => {
  return API_BASE_URL.replace('/api/v1', '');
};

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: getServerBaseUrl(),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'School Management Portal',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENDPOINTS: {
  // Legacy dashboard endpoints (kept temporarily for backward compatibility)
  DASHBOARD_ATTENDANCE_OVERVIEW: '/dashboard/attendance-overview',
  DASHBOARD_CLASS_PERFORMANCE: '/dashboard/class-performance',
  DASHBOARD_FEE_COLLECTION: '/dashboard/fee-collection',

  // New analytics endpoints
  ATTENDANCE_BY_CLASS: '/analytics/attendance-by-class',
  CLASS_PERFORMANCE: '/analytics/course-averages',
  FEE_COLLECTION: '/analytics/fee-collection-status',
  CURRENT_ACADEMIC_YEAR: '/analytics/current-term',
  RECENT_ACTIVITIES: '/activities/recent',

  // Finance endpoints
  TRANSACTIONS: '/finance/transactions',
  }
} as const;

export default API_BASE_URL;