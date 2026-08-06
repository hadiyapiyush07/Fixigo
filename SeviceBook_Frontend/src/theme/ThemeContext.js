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
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) {
          setThemeMode(storedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(deviceTheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, deviceTheme]);

  const toggleTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('app_theme', mode);
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
