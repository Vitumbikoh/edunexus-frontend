import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authApi } from '@/services/authService';

// Define user roles based on your backend enum
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'finance';

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
    term: string;
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
  createdAt?: Date;
  updatedAt?: Date;
  
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
      term: string;
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

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to normalize role from backend to UserRole type
const normalizeRole = (role: string): UserRole => {
  const roleStr = role.toLowerCase();
  if (['admin', 'teacher', 'student', 'parent', 'finance'].includes(roleStr)) {
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
              name: response.user.email.split('@')[0],
              avatar: `https://ui-avatars.com/api/?name=${response.user.email}&background=0D8ABC&color=fff`
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

  const login = async (email: string, password: string) => {
    try {
      // Backend login
      const response = await authApi.login({ email, password });
      
      localStorage.setItem('access_token', response.access_token);
      setToken(response.access_token);
      
      const normalizedRole = normalizeRole(response.user.role);
      const userData: User = {
        ...response.user,
        role: normalizedRole,
        name: response.user.email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${response.user.email}&background=0D8ABC&color=fff`
      };
      
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
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