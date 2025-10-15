import { Drawer } from 'expo-router/drawer';
import { TouchableOpacity, StatusBar } from 'react-native';
import { useTheme } from '../../../../components/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Ionicons } from '@expo/vector-icons';
import useChatStore from '~/state';
import { useUser } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';

type DrawerNavProp = DrawerNavigationProp<Record<string, object | undefined>>;

// Custom Hamburger Menu SVG component
const HamburgerMenuIcon = (props: any) => {
  const { colors } = useTheme();

  return (
    <Svg
      width={24}
      height={22}
      viewBox="0 0 24 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M1.33337 1.66699H17.3334M1.33337 11.0003H22.6667M1.33337 20.3337H12"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const addIcon = () => {
  return (
    <Svg
      width={44}
      height={44}
      viewBox="0 0 44 44"
      fill="none"
    >
      <Rect width={44} height={44} rx={12} fill="url(#a)" />
      <Path
        d="M29 23.163h-5.833v5.834a1.167 1.167 0 1 1-2.334 0v-5.834H15a1.167 1.167 0 1 1 0-2.333h5.833v-5.833a1.167 1.167 0 1 1 2.334 0v5.833H29a1.167 1.167 0 1 1 0 2.333"
        fill="#fff"
      />
      <Defs>
        <LinearGradient
          id="a"
          x1={23.897}
          y1={17.829}
          x2={-1.112}
          y2={37.804}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#2F9A92" />
          <Stop offset={1} stopColor="#2C72FF" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

const Layout = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<DrawerNavProp>();
  const { chats, setChats, selectedChatId, createChat } = useChatStore();
  const { user } = useUser();
  const chatName = chats.find((chat) => chat.id === selectedChatId)?.name || 'Chat';
  const { getToken } = useAuth();


  // Set status bar to match header color when component mounts
  useEffect(() => {
    StatusBar.setBackgroundColor(colors.header);
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');

    return () => {
      // Reset when unmounting if needed
    };
  }, [colors]);

  const handleNewChat = async () => {
    if (!user?.id) return;
    const token = await getToken()

    if (!token) return;


    try {
      const newChat = await createChat(user.id, token);

      if (newChat) {
        console.log('New chat created:@header--->', newChat);
      } else {
        alert("Couldn't create chat");
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <>
      {/* Explicitly set StatusBar to match header */}
      <StatusBar
        backgroundColor={colors.header}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <Drawer
        screenOptions={{
          headerTitle: chatName,
          drawerStyle: { backgroundColor: colors.background },

          // Remove this line or set to appropriate value
          headerStatusBarHeight: 0,

          headerStyle: {
            backgroundColor: colors.header,
            height: 80,
          },

          headerTitleAlign: 'center',

          headerTitleStyle: {
            color: colors.text,
          },

          headerTintColor: colors.text,

          headerLeft: () => (
            <TouchableOpacity
              style={{
                marginLeft: 16,
                padding: 8,
              }}
              onPress={() => navigation.toggleDrawer()}
            >
              <HamburgerMenuIcon />
            </TouchableOpacity>
          ),

          headerRight: () => (
            <TouchableOpacity
              style={{
                marginRight: 16,
                padding: 8,
              }}
              onPress={handleNewChat}
            >
              {addIcon()}
            </TouchableOpacity>
          ),
        }}
      />
    </>
  );
};

export default Layout;
