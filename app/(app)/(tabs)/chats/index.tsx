import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../components/ThemeProvider';
import { useUser } from '@clerk/clerk-expo';
import { Chat, Message } from '../../../../utils/utils';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './CustomeDrawer';
import useChatStore from '../../../../state/index';
import ChatMessages from '../../../../components/ChatMessages';
import ChatInput from '../../../../components/ChatInput';
import SpeechToSpeechComponent from '~/components/SpeechToSpeechComponent';
import ComingSoonModal from '~/components/ComingSoonModal';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-expo';

// Define the BASE_URL using environment variables or a fallback
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const WS_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

// Main chat screen component
const ChatScreen = () => {
  const { colors } = useTheme();
  const { chatId } = useLocalSearchParams();
  const { getToken } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectWebSocket, setConnectWebSocket] = useState(false);

  // Use Zustand store
  const { chats, selectedChatId, setSelectedChatId, setChats, fetchChats, createChat } = useChatStore();

  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [endpoint] = useState<string>('query');
  const [isChatMode, setIsChatMode] = useState(true);
  const [isQueryMode, setIsQueryMode] = useState(false);
  const [streamingChunks, setStreamingChunks] = useState<{ [key: string]: string[] }>({});
  // const [response?.message_id, setresponse?.message_id] = useState<string | null>(null);

  // Search, Sort, and Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(15);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Memoize selected chat
  const selectedChat = useMemo(
    () => chats.find((chat: { id: string }) => chat.id === selectedChatId),
    [chats, selectedChatId]
  );


  useEffect(() => {
    if (messages.length === 0) {
      console.log("-------messages changed: ---> EMPTY")
    } else {
      console.log("-------messages changed: --->'NOT  EMPTY' ")
    }
  }, [messages])


  useEffect(() => {
    if (chats.length === 0) {
      console.log("-------chats changed: ---> EMPTY")
    } else {
      console.log("-------chats changed: --->'NOT  EMPTY' ")
    }
  }, [chats])

  // Fetch chats when user changes
  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();

      if (token) {
        setInitialLoading(true);

        fetchChats(token)
          .finally(() => {
            setInitialLoading(false);
          });
      }
    };
    fetchData();
  }, [fetchChats]);

  // Set default chat or selected chat
  useEffect(() => {
    if (chatId) {
      console.log('Setting selected chat ID from params:', chatId);
      setSelectedChatId(chatId as string);
    }
  }, [chatId, setSelectedChatId]);

  // Fetch messages for the selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChatId) return;
      try {
        if (selectedChat && selectedChat.messages) {
          setMessages(selectedChat.messages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [selectedChatId, selectedChat]);

  const filteredMessages = useMemo(() => {
    return messages
      .filter((msg) => msg.question.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(a.q_timestamp).getTime() - new Date(b.q_timestamp).getTime()
          : new Date(b.q_timestamp).getTime() - new Date(a.q_timestamp).getTime()
      );
  }, [messages, searchQuery, sortOrder]);

  useEffect(() => {
    let socket: Socket | null = null;

    const setup = async () => {
      socket = io(WS_URL || '', {
        transports: ['websocket'],
        withCredentials: false,
        forceNew: false,
        reconnection: true,
        timeout: 20000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
      });

      socket.on('netlogistik_chunk', (response) => {
        console.log('Received chunk from server:', response);
        if (response?.data && response?.message_id) {
          setIsQueryMode(true);
          setStreamingChunks((prev) => {
            const existingChunks = prev[response.message_id] || [];
            const newChunks = [...existingChunks, response.data];
            return {
              ...prev,
              [response.message_id]: newChunks,
            };
          });
        }
      });

      socket.on('complete', async (data) => {
        console.log('on complete:', data);
        // Use Zustand's get() to access the latest chats state
        const currentChats = useChatStore.getState().chats;
        const currentSelectedChatId = useChatStore.getState().selectedChatId;
        console.log('on complete messages -->', messages);
        console.log('on complete chats------->', currentChats);

        setIsQueryMode(false);
        setConnectWebSocket(false);

        const finalContent = streamingChunks[data.message_id]?.join('') || data.answer || '';

        // Update messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id
              ? {
                ...msg,
                answer: finalContent,
                orderline_json: data.orderline_json,
                previous_json: data.previous_json,
                a_timestamp: new Date().toISOString(),
              }
              : msg
          )
        );

        // Update chats using the latest state
        const updatedChats = currentChats.map((chat) => {
          if (chat.id === currentSelectedChatId) {
            return {
              ...chat,
              messages: (chat.messages || []).map((msg) =>
                msg.id === data.message_id
                  ? {
                    ...msg,
                    answer: finalContent,
                    orderline_json: data.orderline_json,
                    previous_json: data.previous_json,
                    a_timestamp: new Date().toISOString(),
                  }
                  : msg
              ),
            };
          }
          return chat;
        });

        setChats(updatedChats);

        // Clear streaming chunks
        setStreamingChunks((prev) => {
          const newChunks = { ...prev };
          delete newChunks[data.message_id];
          return newChunks;
        });

        const token = await getToken()

        // Fetch chats to sync with server
        if (token) {
          fetchChats(token).then(() => {
            const updatedChat = useChatStore.getState().chats.find((chat) => chat.id === currentSelectedChatId);
            if (updatedChat) {
              setMessages(updatedChat.messages || []);
            }
          });
        }
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setIsConnected(false);
      });
    };

    setup();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Empty dependencies to prevent reconnection

  const sendMessageWithWebSocket = useCallback(
    async (messageText: string) => {
      setConnectWebSocket(true);
      console.log('sendMessageWithWebSocket called');
      console.log('messageText:', messageText);
      console.log('selectedChatId:', selectedChatId);
      console.log('user?.id:', user?.id);

      if (!messageText.trim() || !selectedChatId || !user?.id) return;

      const newMessage: Message = {
        id: Date.now().toString(),
        question: messageText,
        answer: '',
        q_timestamp: new Date().toISOString(),
        a_timestamp: '',
        isFeedbackGiven: false,
        chatId: selectedChatId,
      };

      // Set response?.message_id synchronously

      console.log('newMessage.id:---->', newMessage.id);
      setIsQueryMode(true);

      // Update local state
      const updatedChats = chats.map((chat) =>
        chat.id === selectedChatId
          ? {
            ...chat,
            messages: [...(chat.messages || []), newMessage],
          }
          : chat
      );

      setChats(updatedChats);
      setMessages((prev) => [...prev, newMessage]);

      if (socketRef.current?.connected) {
        console.log('Emitting query:', newMessage);
        socketRef.current.emit('query', {
          id: user.id,
          question: newMessage.question,
          chatId: newMessage.chatId,
          message_id: newMessage.id,
        });
      } else {
        console.error('WebSocket not connected');
        setIsQueryMode(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                ...msg,
                answer: 'Error: WebSocket not connected.',
                a_timestamp: new Date().toISOString(),
              }
              : msg
          )
        );

        const updatedChats = chats.map((chat) =>
          chat.id === selectedChatId
            ? {
              ...chat,
              messages: (chat.messages || []).map((msg) =>
                msg.id === newMessage.id
                  ? {
                    ...msg,
                    answer: 'Error: WebSocket not connected.',
                    a_timestamp: new Date().toISOString(),
                  }
                  : msg
              ),
            }
            : chat
        )


        setChats(updatedChats);
      }
    },
    [chats, selectedChatId, user?.id, setChats]
  );

  const handleFeedback = useCallback(
    async (messageId: string, feedback: 'positive' | 'negative') => {
      if (!user?.id || !selectedChatId) return;

      try {
        await fetch(`${BASE_URL}/db/${user.id}/chat/${selectedChatId}/message/${messageId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback }),
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isFeedbackGiven: true, feedback } : msg
          )
        );

        const updatedChats = chats.map((chat) =>
          chat.id === selectedChatId && chat.messages
            ? {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === messageId ? { ...msg, isFeedbackGiven: true, feedback } : msg
              ),
            }
            : chat
        )

        setChats(updatedChats);
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    },
    [user?.id, selectedChatId]
  );

  const handleNewChat = async () => {
    if (!user?.id) return;

    try {
      setInitialLoading(true);
      const token = await getToken();

      if(!token) return

      const newChat = await createChat(user.id, token);

      if (newChat) {
        console.log('New chat created:@chatscreen--->', newChat);
      } else {
        alert("Couldn't create chat");
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    console.log('streamingChunks:', streamingChunks);
  }, [streamingChunks]);

  useEffect(() => {
    console.log('loading value in index:isQueryMode', isQueryMode);
  }, [isQueryMode]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {initialLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading chats...</Text>
        </View>
      ) :
        isChatMode ? (
          selectedChatId && chats.length > 0 ? (
            <>
              <ChatMessages
                chat={selectedChat}
                messages={filteredMessages}
                onFeedback={handleFeedback}
                loading={false}
                isStreaming={isQueryMode}
                streamingChunks={streamingChunks}
              />
              <ChatInput
                onSend={sendMessageWithWebSocket}
                onVoiceMode={() => {
                  setIsChatMode(false)
                  setModalVisible(true)
                }}
                loading={isQueryMode}
              />
            </>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text style={{ color: colors.text, fontSize: 18, marginBottom: 20 }}>
                {chats.length > 0 ? 'Select a chat from the drawer' : 'No chats yet. Create a new one!'}
              </Text>
              <TouchableOpacity
                onPress={handleNewChat}
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-bold">+ New Chat</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View className="flex-1 justify-center items-center">
            <ComingSoonModal visible={modalVisible} onClose={() => {
              setIsChatMode(true)
              setModalVisible(false)
            }} feature='voice' />
            {/*for now disabling the voice mode }
          {/* <SpeechToSpeechComponent onExit={() => setIsChatMode(true)} visible={true} /> */}
          </View>
        )
      }
    </View>
  );
};

const Drawer = createDrawerNavigator();

const ChatScreenWithDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 100 },
      }}
    >
      <Drawer.Screen name="ChatScreen" component={ChatScreen} />
    </Drawer.Navigator>
  );
};

export default ChatScreenWithDrawer;