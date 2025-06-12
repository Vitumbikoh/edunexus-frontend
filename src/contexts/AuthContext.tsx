
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authApi } from '@/services/authService';

// Define user roles based on your backend enum
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'finance';

// Define student type for parent's children
export type ChildStudent = {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
  assignments: {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
  }[];
  grades: {
    subject: string;
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
  // Frontend specific fields for demo purposes
  name?: string;
  avatar?: string;
  // Parent specific data
  parentData?: {
    children: ChildStudent[];
  };
  // Teacher specific data
  teacherData?: {
    subjects: string[];
    classes: string[];
    students: string[];
  };
  // Student specific data
  studentData?: {
    grade: string;
    subjects: string[];
    assignments: {
      id: string;
      title: string;
      subject: string;
      dueDate: string;
      status: 'pending' | 'submitted' | 'graded';
    }[];
    grades: {
      subject: string;
      grade: string;
      term: string;
    }[];
  };
};

// Define AuthContext type
export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const response = await authApi.verifyToken(storedToken);
          if (response.valid && response.user) {
            setUser({
              ...response.user,
              name: response.user.email.split('@')[0], // Fallback name from email
              avatar: `https://ui-avatars.com/api/?name=${response.user.email}&background=0D8ABC&color=fff`
            });
            setToken(storedToken);
          } else {
            localStorage.removeItem('access_token');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      // Store token
      localStorage.setItem('access_token', response.access_token);
      setToken(response.access_token);
      
      // Set user with additional frontend fields
      const userData: User = {
        ...response.user,
        name: response.user.email.split('@')[0], // Fallback name from email
        avatar: `https://ui-avatars.com/api/?name=${response.user.email}&background=0D8ABC&color=fff`
      };
      
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
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
