import * as  React from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme/colors';

// Define the theme context type
export type ThemeContextType = {
  isDark: boolean;
  colors: typeof lightColors;
  setScheme: (scheme: 'light' | 'dark') => void;
  toggleTheme: () => void;
};

// Create the theme context with default values
export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  setScheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceColorScheme === 'dark');

  // Update theme when device color scheme changes
  useEffect(() => {
    if (deviceColorScheme) {
      setIsDark(deviceColorScheme === 'dark');
    }
  }, [deviceColorScheme]);

  // Function to set the theme explicitly
  const setScheme = (scheme: 'light' | 'dark') => {
    setIsDark(scheme === 'dark');
  };

  // Function to toggle between light and dark
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        isDark, 
        colors: isDark ? darkColors : lightColors, 
        setScheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
