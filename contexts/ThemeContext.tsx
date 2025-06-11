import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clé pour AsyncStorage
const THEME_STORAGE_KEY = '@MyApp:themePreference';

// Définition des types pour le contexte de thème
type ThemeType = 'light' | 'dark' | 'system';
interface ThemeContextType {
  theme: ThemeType;
  currentTheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
  isLoadingTheme: boolean; // Indicateur de chargement
  colors: {
    background: string;
    card: string;
    text: string;
    icon: string;
    secondaryText: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    error: string;
    searchBar: string;
    review: string;
    list: string;
    actionButton: string;
    secondaryButton: string;
    secondaryButtonText: string;
    tabBarBorder: string;
    tabBarBackground: string;
    tabBarHighlight: string;
    tabBarText: string;
    tabBarTextActive: string;
    buttonText: string;
    backButtonBackground: string;
    badgeBackground: string;
    badgeBorder: string;
    badgeText: string;
    planToRead: string;
    reading: string;
    completed: string;
    onHold: string;
    dropped: string;
  };
};

// Définition des couleurs pour chaque thème
const lightColors = {
  background: '#fcfcfc',
  card: '#f5f5f5',
  text: '#202020',
  icon: '#666666',
  secondaryText: '#666666',
  border: '#E0E0E0',
  primary: '#6200EE',
  secondary: '#03DAC6',
  accent: '#955ae9',
  error: '#B00020',
  searchBar: '#FFFFFF',
  review: '#51d2f9',
  list: '#11d261',
  actionButton: '#eaeaea',
  secondaryButton: '#121212',
  secondaryButtonText: '#FFFFFF',
  // TabBar
  tabBarBorder: '#F6F6F6',
  tabBarBackground: '#F0F0F3',
  tabBarHighlight: '#fff',
  tabBarText: '#888',
  tabBarTextActive: '#222',
  buttonText: '#FFFFFF',

  backButtonBackground: '#f1f1f1',
  // Badges
  badgeBackground: '#f6f6f6',
  badgeBorder: '#e6e6e6',
  badgeText: '#3b3b3bad',

  // Status icons
  planToRead: '#717171',
  reading: '#0b71dd',
  completed: '#12ac4d',
  onHold: '#f6c43c',
  dropped: '#d21212',
};

const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  icon: '#acacac',
  secondaryText: '#666666',
  border: '#333333',
  primary: '#6200EE',
  secondary: '#03DAC6',
  accent: '#955ae9',
  error: '#B00020',
  searchBar: '#2b2b2b',
  review: '#51d2f9',
  list: '#11d261',
  actionButton: '#2b2b2b',
  secondaryButton: '#FFFFFF',
  secondaryButtonText: '#202020',
  // TabBar
  tabBarBorder: '#18181d',
  tabBarBackground: '#23232a',
  tabBarHighlight: '#333347',
  tabBarText: '#aaa',
  tabBarTextActive: '#fff',
  buttonText: '#FFFFFF',

  backButtonBackground: '#222222',

  badgeBackground: '#1c1c1c',
  badgeBorder: '#242424',
  badgeText: '#c7c7c7ac',

  // Status icons
  planToRead: '#717171',
  reading: '#0b71dd',
  completed: '#12ac4d',
  onHold: '#f6c43c',
  dropped: '#d21212',
};
// Création du contexte avec une valeur par défaut initiale (sera mise à jour après chargement)
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system', // Sera écrasé après chargement
  currentTheme: 'dark', // Sera écrasé après chargement
  setTheme: () => {},
  isLoadingTheme: true, // Commence en chargement
  colors: darkColors, // Sera mis à jour
});

// Hook personnalisé pour utiliser le contexte de thème
export const useTheme = () => useContext(ThemeContext);

// Fournisseur de contexte pour le thème
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [theme, _setTheme] = useState<ThemeType>('system'); // Préférence utilisateur
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(systemColorScheme); // Thème appliqué

  // Charger la préférence de thème au montage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
        if (storedTheme) {
          _setTheme(storedTheme);
        } else {
          _setTheme('system'); // Défaut si rien n'est stocké
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
        _setTheme('system'); // Sécurité en cas d'erreur
      } finally {
        setIsLoadingTheme(false);
      }
    };

    loadThemePreference();
  }, []);

  // Mettre à jour le thème appliqué (currentTheme) quand la préférence (theme) ou le schéma système change
  useEffect(() => {
    if (!isLoadingTheme) { // Ne pas exécuter avant le chargement initial
      if (theme === 'system') {
        setCurrentTheme(systemColorScheme);
      } else {
        setCurrentTheme(theme);
      }
    }
  }, [theme, systemColorScheme, isLoadingTheme]);

  // Fonction pour définir et sauvegarder la préférence de thème
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      _setTheme(newTheme);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  // Valeur du contexte
  const contextValue: ThemeContextType = {
    theme,
    currentTheme,
    setTheme,
    isLoadingTheme,
    colors: currentTheme === 'light' ? lightColors : darkColors,
  };

  // Optionnel: Afficher un écran de chargement ou null pendant le chargement initial
  // if (isLoadingTheme) {
  //   return null; // Ou un composant de chargement
  // }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 