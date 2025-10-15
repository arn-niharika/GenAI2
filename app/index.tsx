import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { useAuth } from '@clerk/clerk-expo';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className=" flex bg-red-700 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)/chats" />;
  }

  return <Redirect href="/sign-in" />;
}