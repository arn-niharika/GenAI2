import React from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeProvider';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (err) {
      console.error('Sign-out error:', err);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleManageAccount = () => {
    router.push('/manage-account');
  };

  // Placeholder avatar image or icon
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : undefined;
  const showAvatar = avatarSource ? (
    <Image source={avatarSource} className="w-20 h-20 rounded-full" />
  ) : (
    <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center">
      <Ionicons name="person" size={40} color={colors.text} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center p-4 border-b"  style={{ 
        backgroundColor: colors.header,
        borderColor: colors.header }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold" style={{ color: colors.text }}>
          Profile
        </Text>
      </View>
      <View className="flex-1 p-4 items-center">
        {/* Avatar Placeholder */}
        <View className="mb-6">{showAvatar}</View>

        {/* User Info */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-center" style={{ color: colors.text }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm opacity-70 text-center" style={{ color: colors.secondaryText }}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Manage Account Button */}
        <TouchableOpacity
          className="flex-row items-center p-4 mb-4 rounded-lg"
          style={{ backgroundColor: colors.card }}
          onPress={handleManageAccount}
        >
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <Text className="ml-4 text-base font-medium" style={{ color: colors.text }}>
            Manage Account
          </Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="flex-row items-center p-4 rounded-lg"
          style={{ backgroundColor: colors.card }}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.deleteIcon} />
          <Text className="ml-4 text-base font-medium" style={{ color: colors.deleteIcon }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;