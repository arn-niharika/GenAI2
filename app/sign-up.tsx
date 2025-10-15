import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the eye icon

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');
    try {
      await signUp.create({
        username,
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      console.error('Sign-up error:', JSON.stringify(err, null, 2));
      setError('Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        // router.replace('/(drawer)');
        router.replace('/(app)/(tabs)/chats');
      } else {
        // console.log('Verification incomplete:', signUpAttempt);
      }
    } catch (err) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
    }
  };

  const onGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // router.replace('/(drawer)');
        router.replace('/(app)/(tabs)/chats');
      }
    } catch (err) {
      console.error('Google OAuth sign-up error:', err);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className=" justify-center p-5 bg-white">
        <Text className="text-2xl font-bold text-center mb-2">Verify Your Email</Text>
        <TextInput
          className="h-12 border border-gray-300 rounded-md px-3 mb-3 bg-gray-100"
          value={code}
          onChangeText={setCode}
          placeholder="Enter verification code"
          keyboardType="numeric"
          editable={!isLoading}
        />
        <TouchableOpacity
          className={`rounded-md py-4 ${isLoading ? 'bg-gray-600' : 'bg-purple-600'}`}
          onPress={onVerifyPress}
          disabled={isLoading}
        >
          <Text className="text-white text-center text-base font-bold">
            {isLoading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className=" flex-1 justify-center p-5 bg-white">
      <Text className="text-2xl font-bold text-center mb-2">Create your account</Text>
      <Text className="text-sm text-gray-600 text-center mb-5">
        Welcome! Please fill in the details to get started.
      </Text>

      <TouchableOpacity
        className="flex-row items-center justify-center bg-white border border-gray-300 rounded-md py-3 mb-5"
        onPress={onGoogleSignUp}
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
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        className="h-12 border border-gray-300 rounded-md px-3 mb-3 bg-gray-100"
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
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
        className={`rounded-md py-4 ${isLoading ? 'bg-gray-600' : 'bg-purple-600'}`}
        onPress={onSignUpPress}
        disabled={isLoading}
      >
        <Text className="text-white text-center text-base font-bold">
          {isLoading ? 'Signing Up...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-5">
        <Text>Already have an account? </Text>
        <Link href="/sign-in">
          <Text className="text-blue-600">Sign in</Text>
        </Link>
      </View>
    </View>
  );
}