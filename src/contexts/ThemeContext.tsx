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
  
  // Initialize theme with better fallback logic
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      // Try to get from localStorage first
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
      // Fallback to system preference if no stored theme
      return 'system';
    } catch {
      return 'system';
    }
  });

  // Initialize actual theme based on the current preference
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    
    const getInitialSystemTheme = (): 'light' | 'dark' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored === 'system' || !stored) {
        return getInitialSystemTheme();
      }
      return stored as 'light' | 'dark';
    } catch {
      return getInitialSystemTheme();
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
        // If no user or unauthenticated, use stored preference
        try {
          const storedTheme = (localStorage.getItem('theme') as Theme) || 'system';
          if (['light', 'dark', 'system'].includes(storedTheme)) {
            const resolved = calculateActualTheme(storedTheme);
            setThemeState(storedTheme);
            setActualTheme(resolved);
          }
        } catch (error) {
          console.warn('Failed to load theme from localStorage:', error);
        }
        return;
      }

      // When user logs in, only load from backend if we don't have a valid stored preference
      const currentStoredTheme = localStorage.getItem('theme') as Theme;
      const hasValidStoredTheme = currentStoredTheme && ['light', 'dark', 'system'].includes(currentStoredTheme);

      try {
        // Try to get from backend
        const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userTheme = data.user?.theme || data.theme;
          
          // Only use backend theme if we don't have a valid stored theme or if backend theme is different
          if (userTheme && ['light', 'dark', 'system'].includes(userTheme)) {
            if (!hasValidStoredTheme || userTheme !== currentStoredTheme) {
              setThemeState(userTheme);
              setActualTheme(calculateActualTheme(userTheme));
              // Sync with localStorage
              localStorage.setItem('theme', userTheme);
              localStorage.setItem(`theme-${user.id}`, userTheme);
            }
          } else if (hasValidStoredTheme) {
            // Use stored theme if backend doesn't have a valid one
            setThemeState(currentStoredTheme);
            setActualTheme(calculateActualTheme(currentStoredTheme));
          }
        } else {
          // Backend failed, use stored preferences
          const storageKey = `theme-${user.id}`;
          const userSpecificTheme = localStorage.getItem(storageKey) as Theme;
          const fallbackTheme = userSpecificTheme || currentStoredTheme || 'system';
          
          if (['light', 'dark', 'system'].includes(fallbackTheme)) {
            setThemeState(fallbackTheme);
            setActualTheme(calculateActualTheme(fallbackTheme));
          }
        }
      } catch (error) {
        console.warn('Failed to load theme preference from backend:', error);
        // Use stored preferences as fallback
        if (hasValidStoredTheme) {
          setThemeState(currentStoredTheme);
          setActualTheme(calculateActualTheme(currentStoredTheme));
        } else {
          const storageKey = `theme-${user.id}`;
          const userSpecificTheme = localStorage.getItem(storageKey) as Theme || 'system';
          if (['light', 'dark', 'system'].includes(userSpecificTheme)) {
            setThemeState(userSpecificTheme);
            setActualTheme(calculateActualTheme(userSpecificTheme));
          }
        }
      }
    };

    loadThemePreference();
  }, [user, token]);

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
    // Validate theme value
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn('Invalid theme value:', newTheme);
      return;
    }

    // Update state immediately
    setThemeState(newTheme);
    const newActualTheme = calculateActualTheme(newTheme);
    setActualTheme(newActualTheme);

    // Persist theme preferences immediately and synchronously
    try {
      localStorage.setItem('theme', newTheme);
      console.log('Theme saved to localStorage:', newTheme); // Debug log
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }

    if (user) {
      // Store per-user preference as backup
      const storageKey = `theme-${user.id}`;
      try {
        localStorage.setItem(storageKey, newTheme);
        console.log('User-specific theme saved:', newTheme); // Debug log
      } catch (error) {
        console.warn('Failed to save user-specific theme to localStorage:', error);
      }

      // Try to save to backend (non-blocking)
      if (token) {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme: newTheme }),
          });
          
          if (!response.ok) {
            console.warn('Failed to save theme preference to backend - status:', response.status);
          } else {
            console.log('Theme saved to backend:', newTheme); // Debug log
          }
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