import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeProvider';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const ManageAccountScreen = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();

  // State for edit modes, form inputs, and password length
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isUsernameEditing, setIsUsernameEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLength, setPasswordLength] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null); // For profile picture

  // Separate loading states for each action
  const [profileLoading, setProfileLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load stored password length on mount
  useEffect(() => {
    const loadPasswordLength = async () => {
      try {
        const storedLength = await AsyncStorage.getItem('passwordLength');
        setPasswordLength(storedLength ? parseInt(storedLength, 10) : 10);
      } catch (error) {
        console.error('Error loading password length:', error);
        setPasswordLength(10);
      }
    };
    loadPasswordLength();
  }, []);

  // Pick image for profile picture
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Remove profile picture
  const removeProfileImage = () => {
    setProfileImage(null); // Reset to null to remove the image locally
  };

  // Update profile (first name, last name, and profile picture)
  const handleUpdateProfile = async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      // Update firstName and lastName
      await user.update({
        firstName,
        lastName,
      });

      // Update profile picture if selected
      if (profileImage) {
        const base64 = await FileSystem.readAsStringAsync(profileImage, { encoding: 'base64' });
        await user.setProfileImage({ file: `data:image/jpeg;base64,${base64}` });
      } else if (profileImage === null && user.imageUrl) {
        // If profileImage is explicitly null and there was an existing image, remove it
        await user.setProfileImage({ file: null });
      }

      setIsProfileEditing(false);
      setProfileImage(null); // Reset after update
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  // Update username
  const handleUpdateUsername = async () => {
    if (!user || !username) return;

    setUsernameLoading(true);
    try {
      await user.update({ username });
      setIsUsernameEditing(false);
      Alert.alert('Success', 'Username updated successfully');
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Failed to update username';
      Alert.alert('Error', errorMessage);
    } finally {
      setUsernameLoading(false);
    }
  };

  // Update password and store the new length
  const handleUpdatePassword = async () => {
    if (!user || !newPassword || newPassword !== confirmPassword) return;

    setPasswordLoading(true);
    try {
      await user.updatePassword({ newPassword });
      await AsyncStorage.setItem('passwordLength', newPassword.length.toString());
      setPasswordLength(newPassword.length);
      setIsPasswordEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Failed to update password';
      Alert.alert('Error', errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await user.delete();
              await signOut();
              router.replace('/sign-in');
              await AsyncStorage.removeItem('passwordLength');
            } catch (error: any) {
              const errorMessage = error.errors?.[0]?.message || 'Failed to delete account';
              Alert.alert('Error', errorMessage);
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  // Avatar placeholder with proper typing
  const avatarSource: ImageSourcePropType | undefined = profileImage
    ? { uri: profileImage }
    : user?.imageUrl
    ? { uri: user.imageUrl }
    : undefined;

  const showAvatar = avatarSource ? (
    <Image source={avatarSource} className="w-20 h-20 rounded-full" />
  ) : (
    <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center">
      <Ionicons name="person" size={40} color={colors.text} />
    </View>
  );

  // Generate dots based on password length
  const generatePasswordDots = (length: number) => '•'.repeat(length);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center p-4 border-b" style={{ backgroundColor: colors.header, borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold" style={{ color: colors.text }}>
          Manage Account
        </Text>
      </View>

      <ScrollView className="flex-1 p-4" style={{ backgroundColor: colors.background }}>
        {/* Profile Section */}
        <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
          Profile
        </Text>

        {/* Profile Details */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            Profile
          </Text>
          {!isProfileEditing ? (
            <View className="p-4 bg-gray-100 rounded-lg mb-2" style={{ backgroundColor: colors.searchbg }}>
              <View className="flex-row items-center mb-2">
                {showAvatar}
                <View className="ml-4">
                  <Text className="text-base" style={{ color: colors.text }}>
                    {firstName} {lastName || 'Not set'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsProfileEditing(true)}
                className="flex-row items-center"
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text className="ml-2 text-sm" style={{ color: colors.primary }}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4  rounded-lg mb-2" style={{ backgroundColor: colors.searchbg }}>
              <View className="mb-4 flex-row items-center">
                {showAvatar}
                <View className="ml-4">
                  <TouchableOpacity onPress={pickImage}>
                    <Text className="text-sm mb-2" style={{ color: colors.primary }}>
                      Change Profile Picture
                    </Text>
                  </TouchableOpacity>
                  {(profileImage || user?.imageUrl) && (
                    <TouchableOpacity onPress={removeProfileImage}>
                      <Text className="text-sm" style={{ color: colors.deleteIcon }}>
                        Remove Profile Picture
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View className="mb-4">
                <Text className="text-sm mb-1" style={{ color: colors.secondaryText }}>
                  First Name
                </Text>
                <TextInput
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.background, color: colors.text }}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor={colors.secondaryText}
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm mb-1" style={{ color: colors.secondaryText }}>
                  Last Name
                </Text>
                <TextInput
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.background, color: colors.text }}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor={colors.secondaryText}
                />
              </View>
              <TouchableOpacity
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={handleUpdateProfile}
                disabled={profileLoading}
              >
                <Text className="text-center text-white font-medium">
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="mt-2" onPress={() => setIsProfileEditing(false)}>
                <Text className="text-center text-sm" style={{ color: colors.deleteIcon }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Username */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            Username
          </Text>
          {!isUsernameEditing ? (
            <View className="p-4 bg-gray-100 rounded-lg mb-2" style={{ backgroundColor: colors.searchbg }}>
              <Text className="text-base" style={{ color: colors.text }}>
                {username || 'No username set'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsUsernameEditing(true)}
                className="flex-row items-center mt-2"
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text className="ml-2 text-sm" style={{ color: colors.primary }}>
                  Edit Username
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4 bg-gray-100 rounded-lg mb-2" style={{ backgroundColor: colors.searchbg }}>
              <TextInput
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: colors.background, color: colors.text }}
                value={username}
                onChangeText={setUsername}
                placeholder="New Username"
                placeholderTextColor={colors.secondaryText}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={handleUpdateUsername}
                disabled={usernameLoading || !username}
              >
                <Text className="text-center text-white font-medium">
                  {usernameLoading ? 'Updating...' : 'Update Username'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="mt-2" onPress={() => setIsUsernameEditing(false)}>
                <Text className="text-center text-sm" style={{ color: colors.deleteIcon }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security Section */}
        <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
          Security
        </Text>

        {/* Password Management */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            Password
          </Text>
          {!isPasswordEditing ? (
            <View className="p-4 bg-gray-100 rounded-lg mb-2" style={{ backgroundColor: colors.searchbg }}>
              <Text className="text-base" style={{ color: colors.text }}>
                {passwordLength !== null ? generatePasswordDots(passwordLength) : '••••••••••'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsPasswordEditing(true)}
                className="flex-row items-center mt-2"
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text className="ml-2 text-sm" style={{ color: colors.primary }}>
                  Update Password
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4 bg-gray-100 rounded-lg mb-2" style={{ backgroundColor: colors.searchbg }}>
              <View className="mb-4">
                <Text className="text-sm mb-1" style={{ color: colors.secondaryText }}>
                  Current Password
                </Text>
                <TextInput
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.background, color: colors.text }}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current Password"
                  placeholderTextColor={colors.secondaryText}
                  secureTextEntry
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm mb-1" style={{ color: colors.secondaryText }}>
                  New Password
                </Text>
                <TextInput
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.background, color: colors.text }}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New Password"
                  placeholderTextColor={colors.secondaryText}
                  secureTextEntry
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm mb-1" style={{ color: colors.secondaryText }}>
                  Confirm Password
                </Text>
                <TextInput
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.background, color: colors.text }}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.secondaryText}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={handleUpdatePassword}
                disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
              >
                <Text className="text-center text-white font-medium">
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="mt-2" onPress={() => setIsPasswordEditing(false)}>
                <Text className="text-center text-sm" style={{ color: colors.deleteIcon }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Delete Account */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            Delete Account
          </Text>
          <TouchableOpacity
            className="p-3 rounded-lg"
            style={{ backgroundColor: '#F25D711A' }}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            <Text className="text-center font-medium" style={{ color: '#F25D71' }}>
              {deleteLoading ? 'Deleting...' : 'Delete Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManageAccountScreen;