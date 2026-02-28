import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Theme } from '@gopx-drive/core';

const STORAGE_KEY = 'gopx-drive-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'light' || s === 'dark' || s === 'system') return s;
  } catch (_) {}
  return 'system';
}

interface ThemeContextValue {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const resolved = theme === 'system' ? getSystemTheme() : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
  }, [resolved]);

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') document.documentElement.setAttribute('data-theme', getSystemTheme());
    };
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch (_) {}
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
