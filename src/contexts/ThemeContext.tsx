import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

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
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

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
        // If no user, use system theme
        const systemTheme = getSystemTheme();
        setThemeState('system');
        setActualTheme(systemTheme);
        return;
      }

      try {
        // First try to get from backend
        const response = await fetch('http://localhost:5000/api/v1/settings', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userTheme = data.user?.theme || 'system';
          setThemeState(userTheme);
          setActualTheme(calculateActualTheme(userTheme));
        } else {
          // Fallback to localStorage for this user
          const storageKey = `theme-${user.id}`;
          const storedTheme = localStorage.getItem(storageKey) as Theme || 'system';
          setThemeState(storedTheme);
          setActualTheme(calculateActualTheme(storedTheme));
        }
      } catch (error) {
        // Fallback to localStorage for this user
        const storageKey = `theme-${user.id}`;
        const storedTheme = localStorage.getItem(storageKey) as Theme || 'system';
        setThemeState(storedTheme);
        setActualTheme(calculateActualTheme(storedTheme));
      }
    };

    loadThemePreference();
  }, [user, token]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
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

    if (user) {
      // Store in localStorage as backup
      const storageKey = `theme-${user.id}`;
      localStorage.setItem(storageKey, newTheme);

      // Try to save to backend
      if (token) {
        try {
          await fetch('http://localhost:5000/api/v1/settings', {
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