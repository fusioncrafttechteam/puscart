import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
/* eslint-disable react-refresh/only-export-components -- context module also exports useTheme */
import type { ReactNode } from 'react';

interface ThemeState {
  isDarkMode: boolean;
  primaryColor: string;
}

interface ThemeContextType {
  state: ThemeState;
  toggleDarkMode: () => void;
  setPrimaryColor: (color: string) => void;
}

const DEFAULT_THEME: ThemeState = {
  isDarkMode: false,
  primaryColor: '#0EA5E9',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadTheme(): ThemeState {
  try {
    const savedTheme = localStorage.getItem('puscart_theme');
    if (savedTheme) {
      return JSON.parse(savedTheme) as ThemeState;
    }
  } catch (error) {
    console.error('Failed to parse theme:', error);
  }
  return DEFAULT_THEME;
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ThemeState>(loadTheme);

  useEffect(() => {
    localStorage.setItem('puscart_theme', JSON.stringify(state));

    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, primaryColor: color }));
  }, []);

  const value = useMemo(() => ({
    state,
    toggleDarkMode,
    setPrimaryColor,
  }), [state, toggleDarkMode, setPrimaryColor]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
