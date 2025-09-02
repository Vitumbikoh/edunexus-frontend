import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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
  
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        try {
          // Try backend verification
          const response = await authApi.verifyToken(storedToken);
          if (response.valid && response.user) {
            const normalizedRole = normalizeRole(response.user.role);
            setUser({
              ...response.user,
              role: normalizedRole,
              name: response.user.username || response.user.firstName || response.user.email?.split('@')[0] || 'User',
              avatar: `https://ui-avatars.com/api/?name=${response.user.username || response.user.firstName || 'User'}&background=0D8ABC&color=fff`
            });
            setToken(storedToken);
          } else {
            // Backend verification failed, remove tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      // Backend login
      const response = await authApi.login({ username, password });
      
      localStorage.setItem('access_token', response.access_token);
      setToken(response.access_token);
      
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
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
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
    // Clear authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    
    // Preserve theme preference for next login
    const currentTheme = localStorage.getItem('theme');
    
    // Clear user-specific theme preferences but keep general theme
    if (user?.id) {
      localStorage.removeItem(`theme-${user.id}`);
    }
    
    setUser(null);
    setToken(null);
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