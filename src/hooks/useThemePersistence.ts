import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook to handle theme persistence across sessions
 * This hook ensures theme preferences are maintained across:
 * - Page refreshes
 * - Browser restarts  
 * - Session expiry
 * - User login/logout cycles
 */
export const useThemePersistence = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  // Ensure theme is immediately applied on mount
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    
    // Set color scheme for native elements
    root.style.colorScheme = actualTheme;
    
    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#ffffff');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = actualTheme === 'dark' ? '#1f2937' : '#ffffff';
      document.head.appendChild(meta);
    }
  }, [actualTheme]);

  // Save theme preference whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      
      // Also save user-specific preference if logged in
      if (user?.id) {
        localStorage.setItem(`theme-${user.id}`, theme);
      }
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  }, [theme, user?.id]);

  // Restore theme on user login
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const userSpecificTheme = localStorage.getItem(`theme-${user.id}`);
      const generalTheme = localStorage.getItem('theme');
      
      // Prefer user-specific theme, then general theme
      const savedTheme = userSpecificTheme || generalTheme;
      
      // Only set theme if it's different from current theme and is valid
      if (savedTheme && 
          savedTheme !== theme && 
          ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme as 'light' | 'dark' | 'system');
      }
    }
  }, [isAuthenticated, user?.id]);

  return {
    theme,
    setTheme,
    actualTheme,
    isThemePersisted: !!localStorage.getItem('theme'),
  };
};

/**
 * Utility function to get the current theme preference from storage
 * Useful for server-side rendering or initial theme detection
 */
export const getStoredTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as 'light' | 'dark' | 'system';
    }
  } catch (error) {
    console.warn('Failed to read theme from storage:', error);
  }
  
  return 'system';
};

/**
 * Utility function to clear all theme preferences
 * Useful for debugging or reset functionality
 */
export const clearThemePreferences = () => {
  try {
    localStorage.removeItem('theme');
    
    // Clear all user-specific themes
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('theme-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear theme preferences:', error);
  }
};
