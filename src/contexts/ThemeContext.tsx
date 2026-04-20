import React, { createContext, useContext, useState, useEffect } from 'react';
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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ThemeState>({
    isDarkMode: false,
    primaryColor: '#0EA5E9',
  });

  useEffect(() => {
    // Check for saved theme preferences
    const savedTheme = localStorage.getItem('puscart_theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setState(parsedTheme);
      } catch (error) {
        console.error('Failed to parse theme:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save theme preferences
    localStorage.setItem('puscart_theme', JSON.stringify(state));
    
    // Apply dark mode class to body
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const setPrimaryColor = (color: string) => {
    setState(prev => ({ ...prev, primaryColor: color }));
  };

  return (
    <ThemeContext.Provider value={{
      state,
      toggleDarkMode,
      setPrimaryColor,
    }}>
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
