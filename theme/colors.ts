// Define light and dark color themes
export const lightColors = {
  background: '#F8F8F8',
  header: 'white',
  primaryText: '#000000',
  secondaryBackground: '#f2f2f2',
  text: 'black',
  icons: '#005650', // Using your existing active tab color
  button: 'black',
  buttonText: '#005650',
  border: '#e0e0e0',
  primary: '#005650',
  secondaryText: 'gray',
  card: 'white',
  tabIconActive: '#005650',
  tabIconInactive: '#0D0909',
  signOutIcon: 'black',
  questionbg: '#E5E5E5',
  drawerIcons: '#111111',
  deleteIcon: '#AD0000',
  tail: '#E5E5E5',
  searchbg: '#EEEEEE',
  searchPlaceholder: '#44444',
  tableBorder: '#0000000D',
  arrowBg: '#000000CC',
  grey: '#999999',
  grey3: '#E0E0E0',
  grey4: '#CCCCCC',
  grey5: '#AAAAAA',
  grey6: '#888888',
  foreground: '#000000',
  brandPrimary: '#2F9A92',
  brandSecondary: '#2C72FF',
  primaryGradient: ['#2F9A92', '#2C72FF'],


};

export const darkColors = {
  background: '#262626',
  header: '#262626',
  secondaryBackground: '#1e1e1e',
  primaryText: '#FFFFFF',
  text: '#FFFFFF',
  icons: '#63EDE3', // Using your existing active tab color
  button: '#63EDE3',
  buttonText: 'black',
  border: '#333333',
  primary: '#63EDE3',
  secondaryText: 'lightgray',
  card: '#333333',
  tabIconActive: '#63EDE3',
  tabIconInactive: '#FFFFFF',
  signOutIcon: 'white',
  questionbg: '#363636',
  drawerIcons: '#D9D9D9',
  deleteIcon: '#E15555',
  tail: '#363636',
  searchbg: '#343434',
  searchPlaceholder: '#EAEAEA',
  tableBorder: '#FFFFFF0D',
  arrowBg: '#000000CC',
  grey: '#777777',
  grey3: '#555555',
  grey4: '#444444',
  grey5: '#333333',
  grey6: '#222222',
  foreground: '#FFFFFF',
  brandPrimary: '#2F9A92',
  brandSecondary: '#2C72FF',
  primaryGradient: ['#2F9A92', '#2C72FF'],
};

export const BASE_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  foreground: '#F8F8F8', // fallback if you reference COLORS.foreground directly
};
export const COLORS = {
  light: lightColors,
  dark: darkColors,
  ...BASE_COLORS,
};