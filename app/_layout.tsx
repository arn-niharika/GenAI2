import '../global.css';
import 'expo-dev-client';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '../cache';
import { ThemeToggle } from '~/components/ThemeToggle';
import { NAV_THEME } from '~/theme';
import { ThemeProvider } from '~/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '~/components/ThemeProvider';

export { ErrorBoundary } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Define screen options
const SCREEN_OPTIONS = { animation: 'ios_from_right' } as const;
const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom',
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;

// Create a separate component for themed navigation
function ThemedNavigation({ children }: { children: React.ReactNode }) {
  // Import useTheme from your ThemeProvider
  const { isDark } = useTheme();
  
  // Use the appropriate theme based on isDark
  const navTheme = isDark ? NAV_THEME.dark : NAV_THEME.light;
  
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appIsReady || !publishableKey) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <ClerkLoaded>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
              <SafeAreaProvider>
                <BottomSheetModalProvider>
                  <ActionSheetProvider>
                    <ThemedNavigation>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                        <Stack.Screen
                          name="(app)"
                          options={{
                            headerShown: false,
                            animation: 'none'
                          }}
                        />
                        <Stack.Screen name="modal" options={MODAL_OPTIONS} />
                      </Stack>
                    </ThemedNavigation>
                  </ActionSheetProvider>
                </BottomSheetModalProvider>
              </SafeAreaProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </ClerkLoaded>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
