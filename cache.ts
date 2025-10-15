import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TokenCache } from '@clerk/clerk-expo/dist/cache';

const createTokenCache = (): TokenCache => ({
  getToken: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Secure store get error:', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  saveToken: (key: string, token: string) => SecureStore.setItemAsync(key, token),
});

export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;