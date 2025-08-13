import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/authService';
import { API_CONFIG } from '@/config/api';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'finance';

export interface ChildStudent {
  id: string;
  name: string;
  class: string;
  grade?: string;
  courses?: any[];
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: 'pending' | 'completed' | 'overdue';
    grade?: string;
  }>;
  grades: Array<{
    id: string;
    subject: string;
    course?: string;
    grade: string;
    date: string;
  }>;
  attendance: {
    present: number;
    absent: number;
    late?: number;
    total: number;
  };
  fees: {
    total: number;
    paid: number;
    pending: number;
    dueDate?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  
  // Role-specific data
  parentData?: {
    children: ChildStudent[];
  };
  teacherData?: {
    subjects: string[];
    classes: string[];
  };
  studentData?: {
    class: string;
    studentId: string;
    subjects: string[];
    courses?: any[];
    assignments?: any[];
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (role: string): UserRole => {
  const validRoles: UserRole[] = ['admin', 'teacher', 'student', 'parent', 'finance'];
  return validRoles.includes(role as UserRole) ? (role as UserRole) : 'student';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        
        if (storedToken) {
          setToken(storedToken);
          
          try {
            const response = await authApi.verifyToken(storedToken);
            
            if (response.valid && response.user) {
              const normalizedRole = normalizeRole(response.user.role);
              
              const userData: User = {
                id: response.user.id,
                email: response.user.email,
                name: response.user.name || response.user.email,
                role: normalizedRole,
                avatar: `https://ui-avatars.com/api/?name=${response.user.email}&background=0D8ABC&color=fff`
              };
              
              setUser(userData);
              console.log('✅ User authenticated with role:', normalizedRole);
            } else {
              localStorage.removeItem('access_token');
              setToken(null);
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('access_token');
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      const token = response.access_token;
      const normalizedRole = normalizeRole(response.user.role);
      
      localStorage.setItem('access_token', token);
      setToken(token);
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.email,
        role: normalizedRole,
        avatar: `https://ui-avatars.com/api/?name=${response.user.email}&background=0D8ABC&color=fff`
      };
      
      setUser(userData);
      console.log('✅ Login successful for role:', normalizedRole);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
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
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};