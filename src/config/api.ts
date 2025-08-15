export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'School Management Portal',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const;