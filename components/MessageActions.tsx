import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from './ThemeProvider';

interface MessageActionsProps {
  messageId: string;
  messageContent: string | null | undefined;
  isFeedbackGiven: boolean;
  feedback?: string;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  messageContent,
  isFeedbackGiven,
  feedback,
  onFeedback,
}) => {
  const { colors } = useTheme();

  const handleCopy = async () => {
    if (messageContent) {
      await Clipboard.setStringAsync(messageContent);
      Alert.alert('Copied to clipboard!');
    }
  };

  return (
    <View className="flex-row mt-2 space-x-4">
      <TouchableOpacity onPress={handleCopy} className="p-1">
        <Ionicons name="copy-outline" size={20} color={colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => onFeedback(messageId, 'positive')}
        disabled={isFeedbackGiven}
        className="p-1"
      >
        <Ionicons
          name="thumbs-up"
          size={20}
          color={isFeedbackGiven && feedback === 'positive' ? 'green' : colors.text}
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => onFeedback(messageId, 'negative')}
        disabled={isFeedbackGiven}
        className="p-1"
      >
        <Ionicons
          name="thumbs-down"
          size={20}
          color={isFeedbackGiven && feedback === 'negative' ? 'red' : colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

export default MessageActions;
