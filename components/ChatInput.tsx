// import React, { useEffect, useState } from 'react';
// import { View, TextInput, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useTheme } from './ThemeProvider';
// import { Mic } from 'lucide-react-native';

// interface ChatInputProps {
//  onSend: (message: string) => void;
//  onVoiceMode: () => void;
//  loading: boolean;
// }

// const ChatInput: React.FC<ChatInputProps> = ({ onSend, onVoiceMode, loading }) => {
//  const { colors } = useTheme();
//  const [message, setMessage] = useState('');

//  const handleSend = () => {
//    if (message.trim() && !loading) {
//      onSend(message);
//      setMessage('');
//    }
//  };

//  useEffect(() => {
//   console.log('loading:---> in chatInput', loading);

//  },[loading])

//  return (
//    <View className="py-2">
//      <View
//        className="flex-row items-center rounded-full px-4 py-3"
//        style={{
//          backgroundColor: colors.background,
//          borderColor: colors.border,
//          borderWidth: 1,
//          shadowColor: colors.text,
//          shadowOpacity: 0.1,
//          shadowRadius: 4,
//          elevation: 2,
//          opacity: loading ? 0.7 : 1,
//        }}
//      >
//        <TextInput
//          className="flex-1"
//          style={{ color: colors.text }}
//         //  placeholder={loading ? "Waiting for response..." : "Your query..."}
//         placeholder='Your query...'
//          placeholderTextColor={colors.text}
//         //  value={loading ? "" : message} // Clear input visually when loading
//         value={message}
//         //  onChangeText={loading ? () => {} : setMessage} // Prevent typing when loading
//         onChangeText={setMessage}
//          multiline
//          numberOfLines={1}
//         //  editable={!loading}
//        />
//        {!loading && message.trim() ? (
//          <TouchableOpacity
//            onPress={handleSend}
//            className="ml-2 p-2 rounded-full"
//            style={{
//              backgroundColor: colors.arrowBg,
//            }}
//            disabled={loading}
//          >
//            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
//          </TouchableOpacity>
//        ) : (
//          <TouchableOpacity
//            onPress={loading ? () => {} : onVoiceMode}
//            className="ml-2 p-2 rounded-full"
//            style={{
//              backgroundColor: colors.arrowBg,
//              opacity: loading ? 0.5 : 1,
//            }}
//            disabled={loading}
//          >
//            <Mic color="#FFFFFF" size={20} />
//          </TouchableOpacity>
//        )}
//      </View>
//    </View>
//  );
// };

// export default ChatInput;
import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { Mic } from 'lucide-react-native';

interface ChatInputProps {
 onSend: (message: string) => void;
 onVoiceMode: () => void;
 loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onVoiceMode, loading }) => {
 const { colors } = useTheme();
 const [message, setMessage] = useState('');

 const handleSend = () => {
   if (message.trim() && !loading) {
     onSend(message);
     setMessage('');
   }
 };

 useEffect(() => {
  console.log('loading:---> in chatInput', loading);
 },[loading])

 return (
   <View className="p-2">
     <View
       className="rounded-xl px-4 py-2"
       style={{
         backgroundColor: colors.background,
         borderColor: colors.border,
         borderWidth: 1,
         shadowColor: colors.text,
         shadowOpacity: 0.1,
         shadowRadius: 4,
         elevation: 2,
         opacity: loading ? 0.7 : 1,
       }}
     >
       <View className="flex-row">
         <TextInput
           className="flex-1"
           style={{ 
             color: colors.text,
             paddingTop: Platform.OS === 'ios' ? 8 : 0,
             paddingBottom: Platform.OS === 'ios' ? 8 : 0,
             maxHeight: 120, // Set a maximum height before scrolling
           }}
           placeholder='Your query...'
           placeholderTextColor={colors.text}
           value={message}
           onChangeText={setMessage}
           multiline={true}
           textAlignVertical="top"
           scrollEnabled={true}
         />
       </View>
       
       <View className="flex-row justify-end mt-1">
         {!loading && message.trim() ? (
           <TouchableOpacity
             onPress={handleSend}
             className="p-2 rounded-full"
             style={{
               backgroundColor: colors.arrowBg,
             }}
             disabled={loading}
           >
             <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
           </TouchableOpacity>
         ) : (
           <TouchableOpacity
             onPress={loading ? () => {} : onVoiceMode}
             className="p-2 rounded-full"
             style={{
               backgroundColor: colors.arrowBg,
               opacity: loading ? 0.5 : 1,
             }}
             disabled={loading}
           >
             <Mic color="#FFFFFF" size={20} />
           </TouchableOpacity>
         )}
       </View>
     </View>
   </View>
 );
};
export default ChatInput;
