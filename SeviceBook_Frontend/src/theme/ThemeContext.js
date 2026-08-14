import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, STATUS_COLORS_LIGHT, STATUS_COLORS_DARK } from './colors';
import { lightShadows, darkShadows } from './shadows';
import { FONT_SIZES } from './typography';
import { SPACING } from './spacing';
import { BORDER_RADIUS } from './radius';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('light');
  const isDark = false;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Just set ready to true, bypass async storage for theme preference
    setIsReady(true);
  }, []);

  const toggleTheme = async (mode) => {
    // Disabled to strictly enforce light theme
  };

  const colors = isDark ? darkColors : lightColors;
  const shadows = isDark ? darkShadows : lightShadows;
  const statusColors = isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;

  const theme = {
    mode: themeMode,
    isDark,
    colors,
    shadows,
    typography: FONT_SIZES,
    spacing: SPACING,
    radius: BORDER_RADIUS,
    statusColors,
    toggleTheme,
  };

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
