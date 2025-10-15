// import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
// import { View, Text, FlatList, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as Clipboard from 'expo-clipboard';
// import { useTheme } from './ThemeProvider';
// import { Chat, Message } from '../utils/utils';
// import MessageRenderer from './MessageRenderer';
// import OrderTable from './OrderTable';
// import { Tail } from '~/assets/svgicons';
// import { Loader } from './Loader';

// const MessageItem = memo(
//   ({ item, onFeedback, colors, chat, isStreaming, chunks }: {
//     item: Message;
//     onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
//     colors: any;
//     chat: Chat | null;
//     isStreaming?: boolean;
//     chunks?: string[];
//   }) => {
//     const copyToClipboard = useCallback(() => {
//       if (item.answer) {
//         Clipboard.setStringAsync(item.answer);
//       }
//     }, [item.answer]);

//     // Determine what content to show
//     const displayContent = isStreaming && chunks?.length ? chunks.join('') : item.answer;

//     return (
//       <View className="my-2 w-full">
//         {item.question && (
//           <View className="flex flex-row p-3 text-left items-start gap-1.5 justify-end">
//             <View
//               className="relative flex flex-col rounded-xl p-3 px-4 gap-1 max-w-[75%] ml-auto"
//               style={{ backgroundColor: colors.questionbg }}
//             >
//               <View>
//                 <MessageRenderer content={item.question || ''} />
//                 <Text style={{ color: colors.text, fontSize: 12, opacity: 0.5 }}>
//                   {new Date(item.q_timestamp).toLocaleString()}
//                 </Text>
//                 <View
//                   style={{
//                     position: 'absolute',
//                     width: 19,
//                     height: 14,
//                     right: -25,
//                     bottom: -15,
//                     zIndex: 2,
//                   }}
//                 >
//                   <Tail color={colors.tail} />
//                 </View>
//               </View>
//             </View>
//           </View>
//         )}
//         {(item.answer || item.orderline_json || isStreaming) && (
//           <View className="flex flex-row p-1 items-start gap-2 pt-2">
//             <View className="w-fit max-w-[100%] rounded-lg">
//               <MessageRenderer
//                 content={item.answer || ''}
//                 isStreaming={isStreaming}
//                 chunks={chunks}
//               />


//               {item.orderline_json && <OrderTable msg={item} chat={chat} />}
//               <Text style={{ color: colors.secondaryText, fontSize: 12, marginTop: 5 }}>
//                 {item.a_timestamp ? new Date(item.a_timestamp).toLocaleString() : ''}
//               </Text>


//               {!isStreaming && (<View className="flex-row mt-2">
//                 <TouchableOpacity onPress={copyToClipboard} className="mx-2">
//                   <Ionicons name="copy-outline" size={20} color="gray" />
//                 </TouchableOpacity>
//               </View>)}

//               {isStreaming && chunks && chunks.length === 0 && (
//                 <View className="flex-row mt-2">
//                   <Loader />
//                 </View>

//               )}

//             </View>
//           </View>
//         )}


//       </View>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Improve memoization to properly detect streaming changes
//     if (prevProps.isStreaming || nextProps.isStreaming) {
//       return (
//         prevProps.item.id === nextProps.item.id &&
//         prevProps.isStreaming === nextProps.isStreaming &&
//         prevProps.chunks?.length === nextProps.chunks?.length
//       );
//     }

//     return (
//       prevProps.item.id === nextProps.item.id &&
//       prevProps.item.answer === nextProps.item.answer &&
//       prevProps.item.question === nextProps.item.question
//     );
//   }
// );


// interface ChatMessagesProps {
//   chat: Chat | undefined;
//   messages: Message[];
//   onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
//   loading: boolean;
//   isStreaming?: boolean;
//   streamingChunks?: { [key: string]: string[] };
// }

// const ChatMessages: React.FC<ChatMessagesProps> = memo(
//   ({ chat, messages, onFeedback, loading, isStreaming, streamingChunks = {} }) => {
//     const { colors } = useTheme();
//     const flatListRef = useRef<FlatList>(null);
//     const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
//     const [isManualScrolling, setIsManualScrolling] = useState(false);
//     const messagesLengthRef = useRef(messages.length);

//     useEffect(() => {
//       if (autoScrollEnabled && !isManualScrolling) {
//         // Always scroll to end when:
//         // 1. New messages are added
//         // 2. Streaming is active
//         // 3. Messages length changes
//         setTimeout(() => {
//           flatListRef.current?.scrollToEnd({ animated: true });
//         }, 100);
//       }
//       messagesLengthRef.current = messages.length;
//     }, [messages, autoScrollEnabled, isManualScrolling, isStreaming]);

//     const handleScroll = useCallback((event: any) => {
//       const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
//       const paddingToBottom = 20;
//       const isCloseToBottom =
//         layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

//       // Only disable auto-scroll if user has manually scrolled up
//       if (!isCloseToBottom && !isManualScrolling) {
//         setIsManualScrolling(true);
//         setAutoScrollEnabled(false);
//       }

//       // Re-enable auto-scroll when user scrolls back to bottom
//       if (isCloseToBottom && isManualScrolling) {
//         setIsManualScrolling(false);
//         setAutoScrollEnabled(true);
//         // Scroll to end when user reaches bottom
//         setTimeout(() => {
//           flatListRef.current?.scrollToEnd({ animated: true });
//         }, 100);
//       }
//     }, [isManualScrolling]);

//     const keyExtractor = useCallback((item: Message) => item.id, []);

//     const getItemLayout = useCallback(
//       (_: any, index: number) => ({
//         length: 150,
//         offset: 150 * index,
//         index,
//       }),
//       []
//     );
//     const renderItem = useCallback(
//       ({ item }: { item: Message }) => {
//         // Check if this is the message that's currently streaming
//         const isMessageStreaming = isStreaming && item.id === messages[messages.length - 1]?.id;
//         const chunks = streamingChunks[item.id] || [];

//         // console.log('Rendering message:', {
//         //   id: item.id,
//         //   isStreaming: isMessageStreaming,
//         //   chunksLength: chunks.length
//         // });

//         return (
//           <MessageItem
//             item={item}
//             onFeedback={onFeedback}
//             colors={colors}
//             chat={chat || null}
//             isStreaming={isMessageStreaming}
//             chunks={chunks}
//           />
//         );
//       },
//       [onFeedback, colors, chat, isStreaming, messages, streamingChunks]
//     );


//     return (
//       <View className="flex-1">
//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           renderItem={renderItem}
//           keyExtractor={keyExtractor}
//           contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
//           onScroll={handleScroll}
//           scrollEventThrottle={400}
//           initialNumToRender={5}
//           maxToRenderPerBatch={3}
//           windowSize={5}
//           removeClippedSubviews={true}
//           getItemLayout={getItemLayout}
//           updateCellsBatchingPeriod={50}
//           onEndReachedThreshold={0.5}
//           maintainVisibleContentPosition={{
//             minIndexForVisible: 0,
//             autoscrollToTopThreshold: 10,
//           }}
//           showsVerticalScrollIndicator={true}
//         />
//       </View>
//     );
//   },
//   (prevProps, nextProps) => {
//     return (
//       prevProps.messages === nextProps.messages &&
//       prevProps.isStreaming === nextProps.isStreaming &&
//       prevProps.streamingChunks === nextProps.streamingChunks &&
//       prevProps.chat === nextProps.chat
//     );
//   }
// );

// export default ChatMessages;
import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from './ThemeProvider';
import { Chat, Message } from '../utils/utils';
import MessageRenderer from './MessageRenderer';
import OrderTable from './OrderTable';
import { Tail } from '~/assets/svgicons';
import { Loader } from './Loader';
import ScrollToBottomButton from './ScrollToBottomButton';

const MessageItem = memo(
  ({ item, onFeedback, colors, chat, isStreaming, chunks }: {
    item: Message;
    onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
    colors: any;
    chat: Chat | null;
    isStreaming?: boolean;
    chunks?: string[];
  }) => {
    const copyToClipboard = useCallback(() => {
      if (item.answer) {
        Clipboard.setStringAsync(item.answer);
      }
    }, [item.answer]);

    // Determine what content to show
    const displayContent = isStreaming && chunks?.length ? chunks.join('') : item.answer;

    return (
      <View className="my-2 w-full">
        {item.question && (
          <View className="flex flex-row p-3 text-left items-start gap-1.5 justify-end">
            <View
              className="relative flex flex-col rounded-xl p-3 px-4 gap-1 max-w-[75%] ml-auto"
              style={{ backgroundColor: colors.questionbg }}
            >
              <View>
                <MessageRenderer content={item.question || ''} />
                <Text style={{ color: colors.text, fontSize: 12, opacity: 0.5 }}>
                  {new Date(item.q_timestamp).toLocaleString()}
                </Text>
                <View
                  style={{
                    position: 'absolute',
                    width: 19,
                    height: 14,
                    right: -25,
                    bottom: -15,
                    zIndex: 2,
                  }}
                >
                  <Tail color={colors.tail} />
                </View>
              </View>
            </View>
          </View>
        )}
        {(item.answer || item.orderline_json || isStreaming) && (
          <View className="flex flex-row p-1 items-start gap-2 pt-2">
            <View className="w-fit max-w-[100%] rounded-lg">
              <MessageRenderer
                content={item.answer || ''}
                isStreaming={isStreaming}
                chunks={chunks}
              />


              {item.orderline_json && <OrderTable msg={item} chat={chat} />}
              <Text style={{ color: colors.secondaryText, fontSize: 12, marginTop: 5 }}>
                {item.a_timestamp ? new Date(item.a_timestamp).toLocaleString() : ''}
              </Text>


              {!isStreaming && (<View className="flex-row mt-2">
                <TouchableOpacity onPress={copyToClipboard} className="mx-2">
                  <Ionicons name="copy-outline" size={20} color="gray" />
                </TouchableOpacity>
              </View>)}

              {isStreaming && chunks && chunks.length === 0 && (
                <View className="flex-row mt-2">
                  <Loader />
                </View>

              )}

            </View>
          </View>
        )}


      </View>
    );
  },
  (prevProps, nextProps) => {
    // Improve memoization to properly detect streaming changes
    if (prevProps.isStreaming || nextProps.isStreaming) {
      return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.isStreaming === nextProps.isStreaming &&
        prevProps.chunks?.length === nextProps.chunks?.length
      );
    }

    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.answer === nextProps.item.answer &&
      prevProps.item.question === nextProps.item.question
    );
  }
);


interface ChatMessagesProps {
  chat: Chat | undefined;
  messages: Message[];
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
  loading: boolean;
  isStreaming?: boolean;
  streamingChunks?: { [key: string]: string[] };
}

const ChatMessages: React.FC<ChatMessagesProps> = memo(
  ({ chat, messages, onFeedback, loading, isStreaming, streamingChunks = {} }) => {
    const { colors } = useTheme();
    const flatListRef = useRef<FlatList>(null);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const messagesLengthRef = useRef(messages.length);
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
      if (autoScrollEnabled && !isManualScrolling) {
        // Always scroll to end when:
        // 1. New messages are added
        // 2. Streaming is active
        // 3. Messages length changes
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      messagesLengthRef.current = messages.length;
    }, [messages, autoScrollEnabled, isManualScrolling, isStreaming]);

    const handleScroll = useCallback((event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      // Show scroll button when not at the bottom
      if (!isCloseToBottom) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }

      // Only disable auto-scroll if user has manually scrolled up
      if (!isCloseToBottom && !isManualScrolling) {
        setIsManualScrolling(true);
        setAutoScrollEnabled(false);
      }

      // Re-enable auto-scroll when user scrolls back to bottom
      if (isCloseToBottom && isManualScrolling) {
        setIsManualScrolling(false);
        setAutoScrollEnabled(true);
        
        // Scroll to end when user reaches bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }, [isManualScrolling]);

    const scrollToBottom = useCallback(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    
      setAutoScrollEnabled(true);
      setIsManualScrolling(false);
      setShowScrollButton(false);
    }, []);

    const keyExtractor = useCallback((item: Message) => item.id, []);

    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: 150,
        offset: 150 * index,
        index,
      }),
      []
    );
    
    const renderItem = useCallback(
      ({ item }: { item: Message }) => {
        // Check if this is the message that's currently streaming
        const isMessageStreaming = isStreaming && item.id === messages[messages.length - 1]?.id;
        const chunks = streamingChunks[item.id] || [];

        return (
          <MessageItem
            item={item}
            onFeedback={onFeedback}
            colors={colors}
            chat={chat || null}
            isStreaming={isMessageStreaming}
            chunks={chunks}
          />
        );
      },
      [onFeedback, colors, chat, isStreaming, messages, streamingChunks]
    );

    return (
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={getItemLayout}
          updateCellsBatchingPeriod={50}
          onEndReachedThreshold={0.5}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          showsVerticalScrollIndicator={true}
        />
        
        {/* Use the existing ScrollToBottomButton component */}
        {/* <ScrollToBottomButton 
          isVisible={showScrollButton} 
          onPress={scrollToBottom} 
        /> */}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messages === nextProps.messages &&
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.streamingChunks === nextProps.streamingChunks &&
      prevProps.chat === nextProps.chat
    );
  }
);

export default ChatMessages;
