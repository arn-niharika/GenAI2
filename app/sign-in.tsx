import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the eye icon

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const router = useRouter();

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');
    
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });
      // console.log('Sign-in attempt status:', signInAttempt.status);
      if (signInAttempt.status === 'complete') {
        // console.log('Session ID:', signInAttempt.createdSessionId);
        await setActive({ session: signInAttempt.createdSessionId });
        // console.log('Session set active successfully');
        router.replace('/(app)/(tabs)/chats');
      } else {
        // console.log('Sign-in incomplete:', signInAttempt);
        setError('Sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign-in error:', JSON.stringify(err, null, 2));
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { createdSessionId, setActive } = (await startOAuthFlow()) || {};
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)/(tabs)/chats');
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      <Text className="text-2xl font-bold text-center mb-2">Sign in to Copilot</Text>
      <Text className="text-sm text-gray-600 text-center mb-5">Welcome back! Please sign in to continue</Text>

      <TouchableOpacity
        className="flex-row items-center justify-center bg-white border border-gray-300 rounded-md py-3 mb-5"
        onPress={onGoogleSignIn}
        disabled={isLoading}
      >
        <Image
          source={{ uri: 'https://www.google.com/favicon.ico' }} // Replace with actual Google logo URL
          className="w-5 h-5 mr-2"
        />
        <Text className="text-base text-black">
          {isLoading ? 'Processing...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <Text className="text-center text-gray-600 my-3">or</Text>

      <TextInput
        className="h-12 border border-gray-300 rounded-md px-3 mb-3 bg-gray-100"
        value={email}
        onChangeText={setEmail}
        placeholder="Email address or username"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
      />
      <View className="relative">
        <TextInput
          className="h-12 border border-gray-300 rounded-md px-3 mb-3 bg-gray-100 pr-10"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword} // Toggle visibility
          editable={!isLoading}
        />
        <TouchableOpacity
          className="absolute right-3 top-3"
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {error ? <Text className="text-red-500 text-center mb-3">{error}</Text> : null}

      <TouchableOpacity
        className={`rounded-md py-4 ${isLoading ? 'bg-gray-600' : 'bg-black'}`}
        onPress={onSignInPress}
        disabled={isLoading}
      >
        <Text className="text-white text-center text-base font-bold">
          {isLoading ? 'Signing In...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-5">
        <Text>Don't have an account? </Text>
        <Link href="/sign-up">
          <Text className="text-blue-600">Sign up</Text>
        </Link>
      </View>

    </View>
  );
}