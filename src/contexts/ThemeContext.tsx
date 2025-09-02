import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_CONFIG } from '@/config/api';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, token } = useAuth();

  // Initialize theme state more carefully to prevent flash
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      return stored || 'light';
    } catch {
      return 'light';
    }
  });

  // Initialize actual theme immediately to prevent flash
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    
    // Check if document already has the theme class (from inline script)
    const hasLight = document.documentElement.classList.contains('light');
    const hasDark = document.documentElement.classList.contains('dark');
    
    if (hasLight) return 'light';
    if (hasDark) return 'dark';
    
    // Fallback calculation
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      const themePreference = stored || 'light';
      if (themePreference === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return themePreference;
    } catch {
      return 'light';
    }
  });

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Calculate actual theme based on preference
  const calculateActualTheme = (themePreference: Theme): 'light' | 'dark' => {
    if (themePreference === 'system') {
      return getSystemTheme();
    }
    return themePreference;
  };

  // Load theme preference for the current user
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user || !token) {
        // If no user or unauthenticated, use stored preference or system
        const storedTheme = (localStorage.getItem('theme') as Theme) || 'light';
        const resolved = calculateActualTheme(storedTheme);
        
        // Only update if different to prevent unnecessary re-renders
        if (theme !== storedTheme) {
          setThemeState(storedTheme);
        }
        if (actualTheme !== resolved) {
          setActualTheme(resolved);
        }
        return;
      }

      try {
        // First try to get from backend
        const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userTheme = data.user?.theme || 'light'; // Default to light instead of system
          const resolved = calculateActualTheme(userTheme);
          
          if (theme !== userTheme) {
            setThemeState(userTheme);
          }
          if (actualTheme !== resolved) {
            setActualTheme(resolved);
          }
        } else {
          // Fallback to localStorage for this user
          const storageKey = `theme-${user.id}`;
          const storedTheme = localStorage.getItem(storageKey) as Theme || 'light';
          const resolved = calculateActualTheme(storedTheme);
          
          if (theme !== storedTheme) {
            setThemeState(storedTheme);
          }
          if (actualTheme !== resolved) {
            setActualTheme(resolved);
          }
        }
      } catch (error) {
        // Fallback to localStorage for this user
        const storageKey = `theme-${user.id}`;
        const storedTheme = localStorage.getItem(storageKey) as Theme || 'light';
        const resolved = calculateActualTheme(storedTheme);
        
        if (theme !== storedTheme) {
          setThemeState(storedTheme);
        }
        if (actualTheme !== resolved) {
          setActualTheme(resolved);
        }
      }
    };

    loadThemePreference();
  }, [user, token]); // Removed theme and actualTheme from dependencies to prevent loops

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    // Help the browser render native UI correctly in dark mode
    root.style.colorScheme = actualTheme;
  }, [actualTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setActualTheme(getSystemTheme());
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    const newActualTheme = calculateActualTheme(newTheme);
    setActualTheme(newActualTheme);

    // Always persist a generic theme preference
    try {
      localStorage.setItem('theme', newTheme);
    } catch {}

    if (user) {
      // Store per-user preference as backup
      const storageKey = `theme-${user.id}`;
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {}

      // Try to save to backend
      if (token) {
        try {
          await fetch(`${API_CONFIG.BASE_URL}/settings`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme: newTheme }),
          });
        } catch (error) {
          console.warn('Failed to save theme preference to backend:', error);
        }
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};