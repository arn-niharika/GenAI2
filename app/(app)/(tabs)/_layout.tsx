import { Tabs } from 'expo-router';
import { useTheme } from '../../../components/ThemeProvider';
import { View, Text, ViewStyle, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { LogoSVG, ProfileIconSVG, AddButtonSVG, HomeIcon, ChatIcon, UsersIcon } from '~/assets/svgicons';
import DocumentUploadModal from '../../../components/DocumentUploadModal';
import { useDocumentStore } from '../../../state';
import { useAuth } from '@clerk/clerk-expo';



const TabsLayout = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const { fetchDocuments } = useDocumentStore();

  // Handle the initial render case
  useEffect(() => {
    // After the component mounts, set isInitialRender to false
    // This will hide the header on the first render
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 300); // Small delay to allow navigation to complete

    return () => clearTimeout(timer);
  }, []);

  // If it's the initial render, assume we're on the chats screen regardless of pathname
  const isChatsScreen = isInitialRender || pathname.includes('/chats');
  const showCustomHeader = !isChatsScreen;
  const isUsersScreen = pathname.includes('/users');
  const isHomeScreen = pathname.includes('/home');

  // Handle add button press
  const handleAddButtonPress = () => {
    if (isHomeScreen) {
      // Show document upload modal
      setIsUploadModalVisible(true);
    }
  };


  // Handle document upload success
  const handleUploadSuccess = async() => {
    const token = await getToken()
    if (!token) return;
    fetchDocuments(token);
  };

  // Handle profile button press
  const handleProfilePress = () => {
    router.push('/(app)/profile');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Custom Header - only show for non-chat screens */}
      {showCustomHeader && (
        <View style={{
          height: 60,
          backgroundColor: colors.header,
          // borderBottomWidth: 1,
          // borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          zIndex: 1 // Add zIndex to ensure header is above other content
        }}>
          {/* Left side with logo and title */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LogoSVG />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: colors.text,
              marginLeft: 8
            }}>
              GenLog AI
            </Text>
          </View>

          {/* Right side with profile and add button */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Only show Add button on home screen, not on users screen */}
            <TouchableOpacity
              style={{ marginRight: 12 }}
              onPress={handleProfilePress}
            >

              <ProfileIconSVG color={colors.text} />
            </TouchableOpacity>


            {!isUsersScreen && (
              <TouchableOpacity
                style={{ marginRight: 12 }}
                onPress={handleAddButtonPress}
              >
                <AddButtonSVG />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isVisible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}

      />

      {/* Tabs below header */}
      <Tabs
        screenOptions={({ route }) => {
          const isFocused = pathname.includes(`/${route.name}`);

          return {
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.text,
            tabBarStyle: (route.name === 'chats'
              ? { display: 'none' } // Hide tab bar for "chats"
              : {
                backgroundColor: colors.header,
                // Remove border on top
                borderTopWidth: 0,
                height: 50, // Slightly increase height to give more space
                paddingHorizontal: 0, // Remove horizontal padding
                paddingTop: 0,
                paddingBottom: 0,
                zIndex: 0 // Ensure tab bar is below header
              }) as ViewStyle,
            // Adjust tab item style to allow more space for text
            tabBarItemStyle: {
              paddingHorizontal: 0, // Remove horizontal padding
              marginHorizontal: 0, // Remove horizontal margin
              width: 'auto', // Let the tab take its natural width
              flex: 1, // Distribute space evenly
              backgroundColor: isFocused ? '#2F9A921A' : 'transparent', // Add background color for selected tab
              borderRadius: 8, // Add rounded corners
              marginVertical: 5, // Add some vertical margin
              // marginHorizontal: 5, // Add some horizontal margin
            },
            // Make the label appear next to the icon
            tabBarLabelPosition: 'beside-icon',
            // Adjust label style
            tabBarLabelStyle: {
              fontSize: 14,
              fontWeight: '500',
              marginLeft: 4,
              paddingRight: 0,
            },
            // Adjust icon style
            tabBarIconStyle: {
              width: 24, // Fixed width for icon
              marginRight: 0,
            },
            tabBarPosition: 'top',
            headerShown: false,
            // Add animation properties for smoother transitions
            animationEnabled: true,
            // Use a faster animation duration for immediate but smooth transitions
            animationDuration: 150,
            // Optimize tab press handling for immediate response
            lazy: false,
            // Improve tab press responsiveness
            tabBarPressColor: 'transparent',
            tabBarPressOpacity: 0.8,
          };
        }}
      >

        <Tabs.Screen
          name="home"
          options={({ route, navigation }) => ({
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => (
              <HomeIcon color={focused ? colors.tabIconActive : colors.tabIconInactive} />
            ),
          })}
        />
        <Tabs.Screen
          name="chats"
          options={({ route, navigation }) => ({
            tabBarLabel: 'Chats',
            tabBarIcon: ({ focused }) => (
              <ChatIcon color={focused ? colors.tabIconActive : colors.tabIconInactive} />
            ),
            href: '/(app)/(tabs)/chats',
          })}
        />
        <Tabs.Screen
          name="users"
          options={({ route, navigation }) => ({
            tabBarLabel: 'Users',
            tabBarIcon: ({ focused }) => (
              <UsersIcon color={focused ? colors.tabIconActive : colors.tabIconInactive} />
            ),
          })}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default TabsLayout;
