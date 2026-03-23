import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { authApi } from '@/services/authService';

// Define user roles based on your backend enum
export type UserRole = 'super_admin' | 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'finance';

// Define student type for parent's children
export type ChildStudent = {
  id: string;
  name: string;
  grade: string;
  courses: string[];
  assignments: {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
  }[];
  grades: {
    course: string;
    grade: string;
    period: string;
  }[];
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };
  fees: {
    total: number;
    paid: number;
    pending: number;
    dueDate: string;
  };
};

// Updated User type to match your backend entity
export type User = {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
  phone?: string;
  image?: string;
  isActive?: boolean;
  schoolId?: string; // Added for multi-tenant support
  forcePasswordReset?: boolean; // Added for first-login password reset
  createdAt?: Date;
  updatedAt?: Date;
  
  // Name fields
  firstName?: string;
  lastName?: string;
  
  // Frontend only fields
  name?: string;
  avatar?: string;
  
  // Role-specific data structures
  parentData?: {
    children: ChildStudent[];
  };
  studentData?: {
    grade: string;
    courses: string[];
    assignments: {
      id: string;
      title: string;
      course: string;
      dueDate: string;
      status: 'pending' | 'submitted' | 'graded';
    }[];
    grades: {
      course: string;
      grade: string;
      period: string;
    }[];
    attendance: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
    fees: {
      total: number;
      paid: number;
      pending: number;
      dueDate: string;
    };
  };
  teacherData?: {
    subjects: string[];
    classes: string[];
    students: number;
  };
  financeData?: {
    permissions: string[];
    department: string;
  };
};

// Login response type
export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  changePassword: (newPassword: string, token?: string) => Promise<void>;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to normalize role from backend to UserRole type
const normalizeRole = (role: string): UserRole => {
  const roleStr = role.toLowerCase();
  if (['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent', 'finance'].includes(roleStr)) {
    return roleStr as UserRole;
  }
  // Default fallback
  return 'student' as UserRole;
};

const getJwtExpiryMs = (jwtToken: string): number | null => {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) return null;
    return Number(payload.exp) * 1000;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000; // avoid refreshing on every activity event
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());
  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const unauthorizedRedirectRef = useRef(false);

  const persistTokens = useCallback((accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    clearIdleTimer();
    const refreshToken = localStorage.getItem('refresh_token') || undefined;
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    const currentUser = JSON.parse(localStorage.getItem('user_data') || 'null') as User | null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    sessionStorage.clear();
    if (currentUser?.id) {
      localStorage.removeItem(`theme-${currentUser.id}`);
    }

    setUser(null);
    setToken(null);
  }, [clearIdleTimer]);

  const tryRefreshSession = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    refreshInFlightRef.current = (async () => {
      try {
        const refreshed = await authApi.refreshToken(refreshToken);
        if (!refreshed?.access_token) return false;
        persistTokens(refreshed.access_token, refreshed.refresh_token);
        lastRefreshRef.current = Date.now();
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    return refreshInFlightRef.current;
  }, [persistTokens]);

  const scheduleIdleLogout = useCallback(() => {
    clearIdleTimer();
    const now = Date.now();
    lastActivityAtRef.current = now;
    localStorage.setItem('last_activity_at', String(now));
    idleTimerRef.current = setTimeout(() => {
      void performLogout();
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, performLogout]);

  const handleUserActivity = useCallback(async () => {
    if (!user) return;
    scheduleIdleLogout();
    const now = Date.now();
    if (now - lastRefreshRef.current >= REFRESH_MIN_INTERVAL_MS) {
      await tryRefreshSession();
    }
  }, [user, scheduleIdleLogout, tryRefreshSession]);
  
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        try {
          // Try backend verification
          let response: any;
          try {
            response = await authApi.verifyToken(storedToken);
          } catch {
            const refreshed = await tryRefreshSession();
            if (!refreshed) throw new Error('Session expired');
            const newToken = localStorage.getItem('access_token');
            if (!newToken) throw new Error('Session expired');
            response = await authApi.verifyToken(newToken);
          }
          if (response.valid && response.user) {
            const normalizedRole = normalizeRole(response.user.role);
            // The /auth/verify endpoint returns the JWT payload which typically has `sub` for user id.
            // Ensure we always populate `id` for downstream consumers.
            const verifiedUser = {
              ...response.user,
              id: (response.user as any).id || (response.user as any).sub,
            } as any;

            setUser({
              ...verifiedUser,
              role: normalizedRole,
              name: verifiedUser.username || verifiedUser.firstName || verifiedUser.email?.split('@')[0] || 'User',
              avatar: `https://ui-avatars.com/api/?name=${verifiedUser.username || verifiedUser.firstName || 'User'}&background=0D8ABC&color=fff`
            });
            setToken(localStorage.getItem('access_token'));
            lastRefreshRef.current = Date.now();
          } else {
            // Backend verification failed, remove tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [tryRefreshSession]);

  useEffect(() => {
    const originalFetch = window.fetch;

    const getRequestUrl = (input: RequestInfo | URL): string => {
      if (typeof input === 'string') return input;
      if (input instanceof URL) return input.toString();
      if (input instanceof Request) return input.url;
      return '';
    };

    const getHeaderValue = (input: RequestInfo | URL, init: RequestInit | undefined, headerName: string): string | null => {
      if (init?.headers instanceof Headers) return init.headers.get(headerName);
      if (init?.headers && typeof init.headers === 'object' && !Array.isArray(init.headers)) {
        const value = (init.headers as Record<string, string>)[headerName] || (init.headers as Record<string, string>)[headerName.toLowerCase()];
        return value || null;
      }
      if (input instanceof Request) return input.headers.get(headerName);
      return null;
    };

    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      let response = await originalFetch.call(window, input, init);
      let didRefresh = false;

      if (response.status === 401) {
        const hasActiveSession = Boolean(localStorage.getItem('access_token'));
        const requestUrl = getRequestUrl(input);
        const isLoginRequest = requestUrl.includes('/auth/login');
        const isRefreshRequest = requestUrl.includes('/auth/refresh');
        const isLogoutRequest = requestUrl.includes('/auth/logout');
        const isSystemHealthRequest =
          requestUrl.includes('/system/overview') ||
          requestUrl.includes('/system/resources') ||
          requestUrl.includes('/system/services');
        const retryHeader = getHeaderValue(input, init, 'x-auth-retry');
        const alreadyRetried = retryHeader === '1';

        if (hasActiveSession && !isLoginRequest && !isRefreshRequest && !isLogoutRequest && !alreadyRetried) {
          const refreshed = await tryRefreshSession();
          didRefresh = refreshed;
          if (refreshed) {
            const newToken = localStorage.getItem('access_token');
            if (newToken) {
              if (input instanceof Request) {
                const retryRequest = new Request(input);
                retryRequest.headers.set('Authorization', `Bearer ${newToken}`);
                retryRequest.headers.set('x-auth-retry', '1');
                response = await originalFetch.call(window, retryRequest);
              } else {
                const retryHeaders = new Headers(init?.headers || {});
                retryHeaders.set('Authorization', `Bearer ${newToken}`);
                retryHeaders.set('x-auth-retry', '1');
                response = await originalFetch.call(window, input, {
                  ...(init || {}),
                  headers: retryHeaders,
                });
              }
            }
          }
        }

        if (
          response.status === 401 &&
          hasActiveSession &&
          !isLoginRequest &&
          !isSystemHealthRequest &&
          !unauthorizedRedirectRef.current
        ) {
          const latestToken = localStorage.getItem('access_token');
          const latestExpiry = latestToken ? getJwtExpiryMs(latestToken) : null;
          const tokenExpired = !latestExpiry || latestExpiry <= Date.now();

          // Only force logout when session is genuinely expired/invalid.
          // Keep users logged in for non-expiry 401s (role/path restrictions).
          if (!didRefresh || tokenExpired) {
            unauthorizedRedirectRef.current = true;
            void performLogout();
            if (window.location.pathname !== '/login') {
              window.location.replace('/login');
            }
          }
        }
      }

      return response;
    }) as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [performLogout, tryRefreshSession]);

  useEffect(() => {
    if (!user) {
      clearIdleTimer();
      return;
    }

    const onActivity = () => {
      void handleUserActivity();
    };

    scheduleIdleLogout();

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'pointermove',
      'pointerdown',
      'focus',
    ];

    events.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void handleUserActivity();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      clearIdleTimer();
    };
  }, [user, handleUserActivity, scheduleIdleLogout, clearIdleTimer]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) return;

      const expiryMs = getJwtExpiryMs(currentToken);
      if (!expiryMs) return;

      const now = Date.now();
      const msUntilExpiry = expiryMs - now;

      // Refresh shortly before expiry to avoid abrupt 401-triggered logout.
      if (msUntilExpiry <= 90 * 1000) {
        const refreshed = await tryRefreshSession();
        if (!refreshed && msUntilExpiry <= 0) {
          await performLogout();
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      }
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [user, performLogout, tryRefreshSession]);

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      // Backend login
      const response = await authApi.login({ username, password });
      
      localStorage.setItem('access_token', response.access_token);
      if ((response as any).refresh_token) {
        localStorage.setItem('refresh_token', (response as any).refresh_token);
      }
      setToken(response.access_token);
      lastRefreshRef.current = Date.now();
      
      const normalizedRole = normalizeRole(response.user.role);
      const userData: User = {
        ...response.user,
        role: normalizedRole,
        name: response.user.username || response.user.firstName || response.user.email?.split('@')[0] || 'User',
        avatar: `https://ui-avatars.com/api/?name=${response.user.username || response.user.firstName || 'User'}&background=0D8ABC&color=fff`
      };
      
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      return response;
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Check if it's a school suspension error
      if (error.message && error.message.includes('school account has been suspended')) {
        throw new Error(error.message);
      }
      
      // Check for other specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Default error message
      throw new Error('Invalid username or password');
    }
  };

  const changePassword = async (newPassword: string, authToken?: string): Promise<void> => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) {
      throw new Error('No authentication token available');
    }
    const result = await authApi.changePassword(newPassword, tokenToUse);
    if (user && user.forcePasswordReset) {
      const updatedUser = { ...user, forcePasswordReset: false };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
    return result;
  };

  const logout = () => {
    void performLogout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      changePassword,
      loading,
      token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
