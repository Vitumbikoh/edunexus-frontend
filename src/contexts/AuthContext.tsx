
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

// Mock student user
const mockStudent: User = {
  id: '3',
  name: 'Emma Johnson',
  email: 'student@schoolportal.com',
  role: 'student',
  avatar: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=7C3AED&color=fff',
  studentData: {
    grade: '10A',
    subjects: ['Mathematics', 'Physics', 'English', 'History', 'Computer Science'],
    assignments: [
      {
        id: '1',
        title: 'Math Problem Set 3',
        subject: 'Mathematics',
        dueDate: '2025-04-25',
        status: 'pending'
      },
      {
        id: '2',
        title: 'English Essay',
        subject: 'English',
        dueDate: '2025-04-28',
        status: 'submitted'
      },
      {
        id: '3',
        title: 'Physics Lab Report',
        subject: 'Physics',
        dueDate: '2025-04-22',
        status: 'graded'
      }
    ],
    grades: [
      { subject: 'Mathematics', grade: 'A-', term: 'Midterm' },
      { subject: 'Physics', grade: 'B+', term: 'Midterm' },
      { subject: 'English', grade: 'A', term: 'Midterm' },
      { subject: 'History', grade: 'B', term: 'Midterm' },
      { subject: 'Computer Science', grade: 'A+', term: 'Midterm' }
    ]
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
      // Using mock student by default for testing student functionality
      setUser(mockStudent); // Change to mockUser for admin view or mockTeacher for teacher view
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
