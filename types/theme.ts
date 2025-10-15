export type ThemeMode = 'light' | 'dark';

export interface colors {
  background: string;
  text: string;
  border: string;
  primary: string;
  secondaryText: string;
  card: string;
  check: string;
  tabIconActive: string;
  tabIconInactive: string;
  isDark: string;
  icon: string;
  signOutIcon: string;
}

export interface Themes {
  [key: string]: colors;
}
