
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

// Function to normalize role from backend to UserRole type
const normalizeRole = (role: string): UserRole => {
  const roleStr = role.toLowerCase();
  if (['admin', 'teacher', 'student', 'parent', 'finance'].includes(roleStr)) {
    return roleStr as UserRole;
  }
  // Default fallback
  return 'student' as UserRole;
};

// Demo user data
const createDemoUser = (email: string, role: UserRole): User => {
  const baseUser: User = {
    id: `demo-${role}-${Date.now()}`,
    email,
    role,
    name: email.split('@')[0],
    avatar: `https://ui-avatars.com/api/?name=${email}&background=0D8ABC&color=fff`,
    isActive: true,
  };

  switch (role) {
    case 'parent':
      return {
        ...baseUser,
        parentData: {
          children: [
            {
              id: 'child-1',
              name: 'Emma Johnson',
              grade: 'Grade 9',
              subjects: ['Mathematics', 'Science', 'English', 'History'],
              assignments: [
                { id: 'a1', title: 'Math Assignment 1', subject: 'Mathematics', dueDate: '2024-01-15', status: 'pending' },
                { id: 'a2', title: 'Science Project', subject: 'Science', dueDate: '2024-01-20', status: 'submitted' },
                { id: 'a3', title: 'English Essay', subject: 'English', dueDate: '2024-01-10', status: 'graded' },
              ],
              grades: [
                { subject: 'Mathematics', grade: 'A-', term: 'Fall 2023' },
                { subject: 'Science', grade: 'B+', term: 'Fall 2023' },
                { subject: 'English', grade: 'A', term: 'Fall 2023' },
                { subject: 'History', grade: 'B', term: 'Fall 2023' },
              ],
              attendance: { total: 120, present: 88, absent: 8, late: 4 },
              fees: { total: 2500, paid: 2000, pending: 500, dueDate: '2024-01-30' },
            },
            {
              id: 'child-2',
              name: 'Alex Johnson',
              grade: 'Grade 7',
              subjects: ['Mathematics', 'Science', 'English', 'Art'],
              assignments: [
                { id: 'a4', title: 'Math Quiz', subject: 'Mathematics', dueDate: '2024-01-18', status: 'pending' },
                { id: 'a5', title: 'Art Project', subject: 'Art', dueDate: '2024-01-25', status: 'submitted' },
              ],
              grades: [
                { subject: 'Mathematics', grade: 'B+', term: 'Fall 2023' },
                { subject: 'Science', grade: 'A-', term: 'Fall 2023' },
                { subject: 'English', grade: 'B', term: 'Fall 2023' },
                { subject: 'Art', grade: 'A', term: 'Fall 2023' },
              ],
              attendance: { total: 110, present: 92, absent: 5, late: 3 },
              fees: { total: 2200, paid: 1800, pending: 400, dueDate: '2024-01-30' },
            },
          ],
        },
      };

    case 'teacher':
      return {
        ...baseUser,
        teacherData: {
          subjects: ['Mathematics', 'Physics', 'Chemistry'],
          classes: ['9A', '10B', '11A', '11B', '12A'],
          students: Array.from({ length: 24 }, (_, i) => `student-${i + 1}`),
        },
      };

    case 'student':
      return {
        ...baseUser,
        studentData: {
          grade: 'Grade 10',
          subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'],
          assignments: [
            { id: 'as1', title: 'Math Assignment - Calculus', subject: 'Mathematics', dueDate: '2024-01-15', status: 'pending' },
            { id: 'as2', title: 'Physics Lab Report', subject: 'Physics', dueDate: '2024-01-20', status: 'submitted' },
            { id: 'as3', title: 'Chemistry Project', subject: 'Chemistry', dueDate: '2024-01-10', status: 'graded' },
            { id: 'as4', title: 'English Literature Essay', subject: 'English', dueDate: '2024-01-25', status: 'pending' },
            { id: 'as5', title: 'History Research Paper', subject: 'History', dueDate: '2024-01-18', status: 'submitted' },
            { id: 'as6', title: 'Computer Programming Task', subject: 'Computer Science', dueDate: '2024-01-22', status: 'pending' },
            { id: 'as7', title: 'Math Quiz - Trigonometry', subject: 'Mathematics', dueDate: '2024-01-12', status: 'graded' },
            { id: 'as8', title: 'Physics Experiment Report', subject: 'Physics', dueDate: '2024-01-28', status: 'pending' },
          ],
          grades: [
            { subject: 'Mathematics', grade: 'A-', term: 'Fall 2023' },
            { subject: 'Physics', grade: 'B+', term: 'Fall 2023' },
            { subject: 'Chemistry', grade: 'A', term: 'Fall 2023' },
            { subject: 'English', grade: 'B+', term: 'Fall 2023' },
            { subject: 'History', grade: 'B', term: 'Fall 2023' },
            { subject: 'Computer Science', grade: 'A+', term: 'Fall 2023' },
          ],
        },
      };

    default:
      return baseUser;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('demo_user');
      
      if (storedToken && storedUser) {
        try {
          // Try backend verification first
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
            console.log('✅ Backend user authenticated with role:', normalizedRole);
          } else {
            // Backend verification failed, remove tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('demo_user');
          }
        } catch (error) {
          console.error('Auth check failed, checking for demo user:', error);
          // Backend is not available, check for demo user
          try {
            const demoUser = JSON.parse(storedUser);
            setUser(demoUser);
            setToken(storedToken);
            console.log('✅ Demo user authenticated with role:', demoUser.role);
          } catch (parseError) {
            console.error('Demo user parsing failed:', parseError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('demo_user');
          }
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login with:', { email, password: '***' });
    
    try {
      // Try backend login first
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
      localStorage.setItem('demo_user', JSON.stringify(userData));
      console.log('✅ Backend login successful for role:', normalizedRole);
    } catch (error) {
      console.error('Backend login failed, trying demo login:', error);
      
      // Backend failed, try demo credentials
      const demoCredentials = [
        { email: 'admin@schoolportal.com', password: 'admin123', role: 'admin' as UserRole },
        { email: 'teacher@schoolportal.com', password: 'teacher123', role: 'teacher' as UserRole },
        { email: 'student@schoolportal.com', password: 'student123', role: 'student' as UserRole },
        { email: 'parent@schoolportal.com', password: 'parent123', role: 'parent' as UserRole },
        { email: 'finance@schoolportal.com', password: 'finance123', role: 'finance' as UserRole },
      ];
      
      const demoUser = demoCredentials.find(
        cred => cred.email === email && cred.password === password
      );
      
      if (demoUser) {
        // Create demo user with role-specific data
        const userData = createDemoUser(email, demoUser.role);
        const demoToken = `demo-token-${Date.now()}`;
        
        localStorage.setItem('access_token', demoToken);
        localStorage.setItem('demo_user', JSON.stringify(userData));
        setToken(demoToken);
        setUser(userData);
        
        console.log('✅ Demo login successful for role:', demoUser.role);
      } else {
        throw new Error('Invalid credentials');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('demo_user');
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
