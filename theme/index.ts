import { Theme, DefaultTheme, DarkTheme } from '@react-navigation/native';
// import { darkColors } from './colors';
import { colors } from '../types/theme';
import { lightColors, darkColors } from './colors';
// Create a single theme object for both light and dark modes
const THEME_COLORS = {
  light: {
    background: lightColors.background,
    text: lightColors.text,
    border: lightColors.border,
    primary: lightColors.primary,
    secondaryText: lightColors.secondaryText,
    card: lightColors.card,
    // check: lightColors.check,
    tabIconActive: lightColors.tabIconActive || '#005650',
    tabIconInactive: lightColors.tabIconInactive || '#0D0909',
    isDark: 'false',
    icon: lightColors.icons,
    signOutIcon: lightColors.signOutIcon,
  } as colors,
  
  dark: {
    background: darkColors.background,
    text: darkColors.text,
    border: darkColors.border,
    primary: darkColors.primary,
    secondaryText: darkColors.secondaryText,
    card: darkColors.card,
    // check: darkColors.check,
    tabIconActive: darkColors.tabIconActive || '#63EDE3',
    tabIconInactive: darkColors.tabIconInactive || '#FFFFFF',
    isDark: 'true',
    icon: darkColors.icons,
    signOutIcon: darkColors.signOutIcon,
  } as colors
};

// Navigation theme for React Navigation
const NAV_THEME: { light: Theme; dark: Theme } = {
  light: {
    dark: false,
    colors: {
      background: lightColors.background,
      border: lightColors.border,
      card: lightColors.card,
      notification: '#ff3b30', // Using a standard notification color since check is not defined
      primary: lightColors.primary,
      text: lightColors.text,
    },
    fonts: DefaultTheme.fonts, // Add this line to include the fonts property
  },
  dark: {
    dark: true,
    colors: {
      background: darkColors.background,
      border: darkColors.border,
      card: darkColors.card,
      notification: '#ff3b30', // Using a standard notification color
      primary: darkColors.primary,
      text: darkColors.text,
    },
    fonts: DarkTheme.fonts, // Add this line to include the fonts property
  }
};

export { NAV_THEME, THEME_COLORS };
