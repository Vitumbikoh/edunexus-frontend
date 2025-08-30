export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
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
  }
} as const;