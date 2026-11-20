import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'prompt_linter_theme_preference';

/**
 * Vector ships dark-only. The provider keeps the original context shape so
 * existing consumers keep working, but the theme cannot be switched.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch {
      // ignore
    }
  }, []);

  const setTheme = (_theme: Theme) => {
    // Dark-only by design.
  };

  const toggleTheme = () => {
    // Dark-only by design.
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
