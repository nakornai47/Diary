import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0A84FF',
    primaryContainer: '#E6F4FE',
    secondary: '#34C759',
    secondaryContainer: '#E6F9ED',
    tertiary: '#FF9500',
    error: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceVariant: '#F2F2F7',
    outline: '#C7C7CC',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#0A84FF',
    primaryContainer: '#1C3A5A',
    secondary: '#34C759',
    secondaryContainer: '#1A4D2E',
    tertiary: '#FF9500',
    error: '#FF453A',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    outline: '#48484A',
  },
};

export type AppTheme = typeof lightTheme;
