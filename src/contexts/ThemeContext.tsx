'use client';

import { createContext, useContext, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme store with subscription support
let themeCache: Theme | null = null;
const listeners = new Set<() => void>();

const getThemeSnapshot = (): Theme => {
  if (themeCache === null) {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      themeCache = stored;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeCache = 'dark';
    } else {
      themeCache = 'light';
    }
  }
  return themeCache;
};

const getServerThemeSnapshot = (): Theme => 'light';

const subscribeTheme = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const setTheme = (newTheme: Theme) => {
  themeCache = newTheme;
  localStorage.setItem('theme', newTheme);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(newTheme);
  listeners.forEach((listener) => listener());
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  // Apply theme class on client
  if (typeof window !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }

  const toggleTheme = useCallback(() => {
    const newTheme = themeCache === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
