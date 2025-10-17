import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../components/ThemeProvider';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chat } from '../../../../utils/utils';
import { ThemeToggle } from '~/components/ThemeToggle';
import useChatStore from '../../../../state/index';
import Svg, { Rect, Path, Defs, Stop } from "react-native-svg";
import { LinearGradient } from 'expo-linear-gradient';
import { LogoSVG } from '~/assets/svgicons';
import { checkRole } from '../../../../utils/utils';
import ConfirmModal from '../../../../components/ConfirmModal';
import { useAuth } from '@clerk/clerk-expo';

// Define the BASE_URL using environment variables or a fallback
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'YOUR_BASE_URL_HERE';

// Define props type for CustomDrawerContent
interface CustomDrawerContentProps {
  navigation: any;
}

// Custom Drawer Content Component
const CustomDrawerContent: React.FC<CustomDrawerContentProps> = (props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {getToken} = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showOptionsForChat, setShowOptionsForChat] = useState<string | null>(null);
  
  // Add state for confirmation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // Use the shared context
  const { chats, setChats, selectedChatId, setSelectedChatId, fetchChats,
    createChat,
    editChat,
    deleteChat
  } = useChatStore();

  useEffect(() => {
    console.log(" selectedChatId in drawer ----------->", selectedChatId);
  }, [selectedChatId]);


  const HomeIcon = ({ color }: { color: string }) => {
    return (
      <Svg
        width={18}
        height={20}
        viewBox="0 0 18 20"
        fill="none"
      >
        <Path
          d="m9.857 2.06 5.866 4.818c.33.27.527.686.527 1.13v8.803c0 .814-.638 1.44-1.383 1.44H12.25V13.5a2.75 2.75 0 0 0-2.75-2.75h-1a2.75 2.75 0 0 0-2.75 2.75v4.75H3.133c-.745 0-1.383-.626-1.383-1.44V8.009c0-.445.197-.86.527-1.13l5.866-4.82a1.34 1.34 0 0 1 1.714.002m5.01 17.69c1.61 0 2.883-1.335 2.883-2.94V8.008a2.96 2.96 0 0 0-1.075-2.29L10.81.9a2.84 2.84 0 0 0-3.618 0L1.325 5.719A2.96 2.96 0 0 0 .25 8.009v8.802c0 1.605 1.273 2.94 2.883 2.94z"
          fill={color}
        />
      </Svg>
    );
  };

  const ProfileIcon = ({ color }: { color: string }) => {
    return (
      <Svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Path
          d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8 7.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5"
          opacity={0.7}
          fill={color}
        />
      </Svg>
    );
  };

  const SignOutIcon = ({ color }: { color: string }) => {
    return (
      <Svg
        width={22}
        height={22}
        viewBox="0 0 22 22"
        fill="none"
      >
        <Path
          opacity={0.5}
          d="M13.998 6c-.012-2.175-.109-3.353-.877-4.121C12.242 1 10.828 1 8 1H7c-2.829 0-4.243 0-5.122.879C1 2.757 1 4.172 1 7v8c0 2.828 0 4.243.878 5.121C2.758 21 4.171 21 7 21h1c2.828 0 4.242 0 5.121-.879.768-.768.865-1.946.877-4.121"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M8 11h13m0 0-3.5-3m3.5 3-3.5 3"
          stroke={color}

          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };
  const isAdmin = checkRole('admin');

  useEffect(() => {
      // console.log("user Role-------> isAdmin", isAdmin)
  },[])

  const NewChatButton = ({ onPress, isCreating = false, style }: { onPress: () => void, isCreating?: boolean, style?: any }) => {
    // Option 1: Using LinearGradient (recommended for better performance)
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isCreating}
        style={[
          {
            borderRadius: 12,
            marginHorizontal: 4,
            marginVertical: 4,
            opacity: isCreating ? 0.7 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style
        ]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2F9A92', '#2C72FF']}
          locations={[0, 1]}
          start={{ x: 0.54, y: 0.41 }}
          end={{ x: 0.49, y: 1.5 }}
          style={{
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            height: 47,
            width: '80%',
            flexDirection: 'row',
          }}
        >
          {[
            <Text key="text" style={{ color: 'white', fontSize: 15, fontWeight: '400', marginLeft: 4 }}>
              {isCreating ? "Creating..." : "+ New Chat"}
            </Text>
          ]}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  const ThreeDotsIcon = ({ color }: { color: string }) => {
    return (
      <Svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Path
          d="M6 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m6 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m6 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"
          opacity={0.5}
          fill={color}
        />
      </Svg>
    );
  };

  const handleNewChat = async () => {
    if (!user?.id || isCreatingChat) return;
    const token = await getToken()

    if (!token) return;


    try {
      setIsCreatingChat(true);

      // Use the store method to create a new chat
      const newChat = await createChat(user.id, token);

      if (newChat) {
        // Chat was created successfully
        props.navigation.closeDrawer();
      } else {
        // Chat creation failed
        alert("Couldn't create chat");
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleEditChat = async (chatId: string) => {

  const token = await getToken()

    if (!token) return;

    try {
      // Use the store method to edit the chat
      const success = await editChat(token, chatId, newChatName);

      if (success) {
        setEditingChatId(null);
        setNewChatName('');
        setShowOptionsForChat(null);
      } else {
        alert("Couldn't edit chat");
      }
    } catch (error) {
      console.error('Error editing chat:', error);
    }
  };

  // Modified to show confirmation modal
  const handleDeleteChat = async (chatId: string) => {
  
  const token = await getToken()

    if (!token) return;

    try {
      // Use the store method to delete the chat
      await deleteChat(token, chatId);
      setModalVisible(false);
      setChatToDelete(null);
      setShowOptionsForChat(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // New method to open delete confirmation modal
  const confirmDeleteChat = (chatId: string) => {
    setChatToDelete(chatId);
    setModalVisible(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Get the chat name for the confirmation modal
  const getChatNameById = (chatId: string | null) => {
    if (!chatId) return '';
    const chat = chats.find(c => c.id === chatId);
    return chat?.name || 'Chat';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Top Area - App Title, New Chat Button, and Chat List */}
          <View>
            <View className="px-4 py-3" style={{ flexDirection: 'row', alignItems:'center', gap:8, borderBottomColor: colors.border }}>
               {LogoSVG()}
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Gen AI
              </Text>
            </View>

            <NewChatButton
              onPress={handleNewChat}
              isCreating={isCreatingChat}
              style={{ marginBottom: 36 }}
            />

            {/* Display chats in the drawer - already in reverse order */}
            {chats.length > 0 ? (
              // Using toReversed() to show newest chats first
              chats.map((chat: Chat) => (
                <View key={chat.id}>
                  <View
                    className="flex-row items-center justify-between px-4 py-2"
                    style={{
                      backgroundColor: selectedChatId === chat.id ? colors.border + '40' : 'transparent',
                      borderRadius: 8,
                      marginHorizontal: 4,
                    }}
                  >
                    {editingChatId === chat.id ? (
                      <View className="flex-row flex-1">
                        <TextInput
                          className="flex-1 p-2 rounded-lg border"
                          style={{ borderColor: colors.border, color: colors.text }}
                          value={newChatName}
                          onChangeText={setNewChatName}
                          placeholder="New chat name"
                        />
                        <TouchableOpacity onPress={() => handleEditChat(chat.id)} className="ml-2">
                          <Ionicons name="checkmark" size={24} color="green" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          setEditingChatId(null);
                          setShowOptionsForChat(null);
                        }} className="ml-2">
                          <Ionicons name="close" size={24} color="red" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          className="flex-1"
                          onPress={() => {
                            setSelectedChatId(chat.id);
                            console.log("selecting chat in the drawer , the selectedChatId ->", chat.id)
                            props.navigation.closeDrawer();
                          }}
                        >
                          <Text style={{
                            color: selectedChatId === chat.id ? colors.primaryText : colors.text,
                            fontWeight: selectedChatId === chat.id ? 'bold' : 'normal',
                            fontSize: 14
                          }}>
                            {chat.name || 'Chat'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          if (showOptionsForChat === chat.id) {
                            setShowOptionsForChat(null);
                          } else {
                            setShowOptionsForChat(chat.id);
                          }
                        }}>
                          <ThreeDotsIcon color={colors.text} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {/* Options menu */}
                  {showOptionsForChat === chat.id && !editingChatId && (
                    <View className="ml-8 mt-1 mb-2 bg-gray-100 rounded-md" style={{ backgroundColor: colors.border + '30' }}>
                      <TouchableOpacity
                        className="flex-row items-center p-2"
                        onPress={() => {
                          setEditingChatId(chat.id);
                          setNewChatName(chat.name || '');
                        }}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primaryText} />
                        <Text className="ml-2" style={{ color: colors.primaryText, opacity: 75, fontSize: 14 }}>Rename</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-row items-center p-2"
                        onPress={() => confirmDeleteChat(chat.id)}
                      >
                        <Ionicons name="trash" size={16} color={colors.deleteIcon} />
                        <Text className="ml-2" style={{ color: colors.deleteIcon, fontSize: 14 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.text, textAlign: 'center', padding: 10 }}>
                No chats yet. Create a new one!
              </Text>
            )}
          </View>

          {/* Bottom Area - Navigation Items */}
          <View style={{
              marginBottom:24,
          }}>
            <View style={[{
              height: 1,
              marginVertical:10,
              marginHorizontal: 10,
            }, { backgroundColor: colors.border }]} />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Navigation Items */}
            <View style={{ marginBottom: insets.bottom }}>
              { isAdmin && (
                 <DrawerItem
                 label="Home"
                 icon={() => <HomeIcon color={colors.drawerIcons} />}
                 onPress={() => {
                   router.push('/(app)/(tabs)/home');
                   props.navigation.closeDrawer();
                 }}
                 labelStyle={{
                   color: colors.drawerIcons,
                   fontWeight: '400',
                   fontSize: 14
                 }}
               />
              )}

              {/* Profile and Sign Out in one row */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                marginVertical: 8
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    router.push('/(app)/profile');
                    props.navigation.closeDrawer();
                  }}
                >
                  <ProfileIcon color={colors.drawerIcons} />
                  <Text style={{
                    color: colors.drawerIcons,
                    marginLeft: 10,
                    fontWeight: '400',
                    fontSize: 14
                  }}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSignOut}
                  style={{ padding: 8 }}
                >
                  <SignOutIcon color={colors.drawerIcons} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </DrawerContentScrollView>

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isVisible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setChatToDelete(null);
        }}
        onConfirm={() => chatToDelete && handleDeleteChat(chatToDelete)}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${getChatNameById(chatToDelete)}"?`}
      />
    </View>
  );
};

// Add this default export to fix the warning
export default CustomDrawerContent;
