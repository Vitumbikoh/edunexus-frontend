
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define user roles
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'finance';

// Define user type
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  // Teacher specific data
  teacherData?: {
    subjects: string[];
    classes: string[];
    students: string[];
  }
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
};

// Mock user for demonstration
const mockUser: User = {
  id: '1',
  name: 'Demo User',
  email: 'admin@schoolportal.com',
  role: 'admin',
  avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
};

// Mock teacher user
const mockTeacher: User = {
  id: '2',
  name: 'John Smith',
  email: 'teacher@schoolportal.com',
  role: 'teacher',
  avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=10B981&color=fff',
  teacherData: {
    subjects: ['Mathematics', 'Physics'],
    classes: ['10A', '11B'],
    students: ['1', '3', '4', '7'] // IDs of students taught by this teacher
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulating initial auth check
    const checkAuth = () => {
      // In a real app, check local storage, cookies, or make an API call
      // Using mock teacher by default for testing teacher functionality
      setUser(mockTeacher); // Change to mockUser for admin view
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      loading
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
