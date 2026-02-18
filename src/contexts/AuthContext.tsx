import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { authApi } from '@/services/authService';

// Define user roles based on your backend enum
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'finance';

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
  if (['super_admin', 'admin', 'teacher', 'student', 'parent', 'finance'].includes(roleStr)) {
    return roleStr as UserRole;
  }
  // Default fallback
  return 'student' as UserRole;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000; // avoid refreshing on every activity event
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshRef = useRef<number>(0);

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

  const performLogout = useCallback(() => {
    clearIdleTimer();
    const currentUser = JSON.parse(localStorage.getItem('user_data') || 'null') as User | null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    if (currentUser?.id) {
      localStorage.removeItem(`theme-${currentUser.id}`);
    }

    setUser(null);
    setToken(null);
  }, [clearIdleTimer]);

  const tryRefreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
      const refreshed = await authApi.refreshToken(refreshToken);
      if (!refreshed?.access_token) return false;
      persistTokens(refreshed.access_token, refreshed.refresh_token);
      lastRefreshRef.current = Date.now();
      return true;
    } catch {
      return false;
    }
  }, [persistTokens]);

  const scheduleIdleLogout = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      performLogout();
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
    ];

    events.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      clearIdleTimer();
    };
  }, [user, handleUserActivity, scheduleIdleLogout, clearIdleTimer]);

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
    performLogout();
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
