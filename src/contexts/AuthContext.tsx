
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulating initial auth check
    const checkAuth = () => {
      // In a real app, check local storage, cookies, or make an API call
      // For now, we'll auto-login with mock user
      setUser(mockUser);
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
