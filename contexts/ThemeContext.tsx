import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Définition des types pour le contexte de thème
type ThemeType = 'light' | 'dark' | 'system';
type ThemeContextType = {
  theme: ThemeType;
  currentTheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    secondaryText: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    error: string;
  };
};

// Définition des couleurs pour chaque thème
const lightColors = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#121212',
  secondaryText: '#666666',
  border: '#E0E0E0',
  primary: '#6200EE',
  secondary: '#03DAC6',
  accent: '#955ae9',
  error: '#B00020',
};

const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  secondaryText: '#666666',
  border: '#333333',
  primary: '#6200EE',
  secondary: '#03DAC6',
  accent: '#955ae9',
  error: '#B00020',
};

// Création du contexte avec une valeur par défaut
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  currentTheme: 'dark',
  setTheme: () => {},
  colors: darkColors,
});

// Hook personnalisé pour utiliser le contexte de thème
export const useTheme = () => useContext(ThemeContext);

// Fournisseur de contexte pour le thème
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Utilisation de useColorScheme pour détecter le thème du système
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('system');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  // Mise à jour du thème actuel en fonction du thème choisi et du thème du système
  useEffect(() => {
    if (theme === 'system') {
      setCurrentTheme(colorScheme === 'light' ? 'light' : 'dark');
    } else {
      setCurrentTheme(theme);
    }
  }, [theme, colorScheme]);

  // Valeur du contexte
  const contextValue: ThemeContextType = {
    theme,
    currentTheme,
    setTheme,
    colors: currentTheme === 'light' ? lightColors : darkColors,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 