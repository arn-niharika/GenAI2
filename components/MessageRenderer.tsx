import React, { useEffect, useState, useRef, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from './ThemeProvider';


interface MessageRendererProps {
  content: string;
  isStreaming?: boolean;
  chunks?: string[];
}

const MessageRendererComponent: React.FC<MessageRendererProps> = ({
  content,
  isStreaming = false,
  chunks = [],
}) => {
  const { colors } = useTheme();
  const [displayedContent, setDisplayedContent] = useState(content || '');
  const prevChunksLengthRef = useRef(0);

  useEffect(() => {
    // Always update with the direct content if not streaming
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }
    
    // Handle streaming content
    if (isStreaming && chunks.length > 0) {
      // Only process new chunks
      if (chunks.length > prevChunksLengthRef.current) {
        const newContent = chunks.join('');
        setDisplayedContent(newContent);
        prevChunksLengthRef.current = chunks.length;
      }
    }
  }, [content, chunks, isStreaming]);

  const markdownStyles = StyleSheet.create({
    body: { color: colors.text, fontSize: 14 },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 5,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 3,
    },
    heading3: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
    heading4: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    heading5: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
    heading6: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: 1 },
    paragraph: { marginVertical: 8, lineHeight: 20 },
    list_item: { marginLeft: 20, marginVertical: 5 },
    bullet_list: { marginVertical: 10 },
    ordered_list: { marginVertical: 10 },
    table: { borderWidth: 1, borderColor: colors.border, marginVertical: 10 },
    thead: { backgroundColor: colors.card },
    th: { padding: 8, borderWidth: 1, borderColor: colors.border, fontWeight: 'bold' },
    td: { padding: 8, borderWidth: 1, borderColor: colors.border },
    tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border },
    code_block: {
      fontFamily: 'monospace',
      backgroundColor: '#2d2d2d',
      color: '#f8f8f2',
      padding: 10,
      borderRadius: 5,
      marginVertical: 10,
    },
    code_inline: { fontFamily: 'monospace', backgroundColor: colors.card, padding: 2, borderRadius: 3 },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 10,
      marginLeft: 10,
      marginVertical: 10,
    },
    link: { color: colors.primary, textDecorationLine: 'underline' },
    strong: { fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    strikethrough: { textDecorationLine: 'line-through' },
    hr: { borderBottomWidth: 1, borderColor: colors.border, marginVertical: 10 },
  });

  return (
    <View style={{ flex: 1, maxWidth: '83%' }}>
      <Markdown style={markdownStyles}>{displayedContent}</Markdown>
      {/* removed the loader while streaming ui if required again add here {isStreamm && (ui)} */}
    </View>
  );
};

const MessageRenderer = memo(MessageRendererComponent, (prevProps, nextProps) => {
  // Improve the memoization to properly detect chunk changes
  if (prevProps.isStreaming && nextProps.isStreaming) {
    return (
      prevProps.content === nextProps.content &&
      prevProps.chunks?.length === nextProps.chunks?.length
    );
  }
  return (
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});

export default MessageRenderer;
