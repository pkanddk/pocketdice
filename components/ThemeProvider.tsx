import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  isJerryGame: boolean;
  isMernGame: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  isJerryGame: boolean;
  isMernGame: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, isJerryGame, isMernGame }) => {
  return (
    <ThemeContext.Provider value={{ isJerryGame, isMernGame }}>
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

