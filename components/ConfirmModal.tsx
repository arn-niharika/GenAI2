import * as  React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

interface ConfirmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View 
          className="w-[90%] max-w-[500px] rounded-xl p-5 shadow-lg"
          style={{ backgroundColor: colors.background }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text 
              className="text-xl font-bold"
              style={{ color: colors.text }}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View className="items-center mb-6">
            <Text 
              className="text-base text-center mb-4"
              style={{ color: colors.text }}
            >
              {message}
            </Text>
            
            <View className="flex-row justify-between w-full">
              <TouchableOpacity
                className="py-2 px-6 rounded-lg items-center justify-center min-w-[120px]"
                style={{ backgroundColor: colors.border }}
                onPress={onClose}
              >
                <Text className=" font-semibold"
                style={{ color: colors.text }}
                >Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="py-2 px-6 rounded-lg items-center justify-center min-w-[120px]"
                style={{ backgroundColor: colors.deleteIcon }}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
              >
                <Text className="text-white font-semibold">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
