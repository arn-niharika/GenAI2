import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Audio } from 'expo-av';
import { io, Socket } from 'socket.io-client';
import { useTheme } from './ThemeProvider';
import { X, Mic, Send, Loader, MessageSquare, Radio, ChevronDown } from 'lucide-react-native';
import { Buffer } from 'buffer';
global.Buffer = Buffer;


const SpeechToSpeechComponent = ({ onExit, visible }: { onExit: () => void, visible: boolean }) => {
 const { colors } = useTheme();
 const [isConnected, setIsConnected] = useState(false);
 const [isRecording, setIsRecording] = useState(false);
 const [isProcessing, setIsProcessing] = useState(false);
 const [apiType, setApiType] = useState<'RAG' | 'LLM'>('LLM');
 const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'response'>('idle');
 const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([]);
  const socketRef = useRef<Socket | null>(null);
 const recordingRef = useRef<Audio.Recording | null>(null);
 const soundRef = useRef<Audio.Sound | null>(null);
 const audioQueueRef = useRef<Blob[]>([]);
 const isPlayingRef = useRef(false);


 const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || '';


 // Initialize WebSocket and audio permissions
 useEffect(() => {
   let socket: Socket | null = null;
  
   const setup = async () => {
     // Request microphone permission
     const { status } = await Audio.requestPermissionsAsync();
     if (status !== 'granted') {
       console.error('Microphone permission denied');
       return;
     }


     // Configure audio session
     await Audio.setAudioModeAsync({
       allowsRecordingIOS: true,
       playsInSilentModeIOS: true,
       shouldDuckAndroid: true,
       playThroughEarpieceAndroid: false,
     });


     // Initialize WebSocket
     socket = io(SOCKET_URL, {
       transports: ['websocket'],
       withCredentials: false,
       forceNew: true,
       reconnection: true,
       timeout: 20000,
       reconnectionAttempts: 5,
     });


     socketRef.current = socket;


     socket.on('connect', () => {
       console.log('Connected to WebSocket server');
       setIsConnected(true);
     });


     socket.on('audio_chunk', (audioBytes) => {
       console.log('Received audio chunk from server');
       const audioBlob = new Blob([new Uint8Array(audioBytes)], { type: 'audio/wav' });
       audioQueueRef.current.push(audioBlob);
       playNextAudioChunk();
     });


     socket.on('audio_complete', (data) => {
       console.log("on complete ----->",data);
       setStatus('idle');
       setIsProcessing(false);
       setMessages((prev) => [...prev, { type: 'ai', content: 'Audio response received.' }]);
     });


     socket.on('disconnect', (reason) => {
       console.log('Disconnected from WebSocket server, reason:', reason);
       setIsConnected(false);
     });
   };


   if (visible) {
     setup();
   }


   return () => {
     if (socket) {
       socket.disconnect();
     }
    
     // Clean up recording if it exists
     if (recordingRef.current) {
       recordingRef.current.stopAndUnloadAsync().catch(err => {
         console.log("Cleanup recording error:", err);
       });
       recordingRef.current = null;
     }
    
     // Clean up sound if it exists
     if (soundRef.current) {
       soundRef.current.unloadAsync().catch(err => {
         console.log("Cleanup sound error:", err);
       });
       soundRef.current = null;
     }
   };
 }, [visible]);


 // Play next audio chunk
 const playNextAudioChunk = async () => {
   if (isPlayingRef.current || audioQueueRef.current.length === 0) {
     setStatus('idle');
     setIsProcessing(false);
     return;
   }
    const nextChunk = audioQueueRef.current.shift();
   if (!nextChunk) return;
    try {
     // Convert Blob to base64
     const arrayBuffer = await nextChunk.arrayBuffer();
     const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
     const { sound } = await Audio.Sound.createAsync(
       { uri: `data:audio/wav;base64,${base64Audio}` },
       { shouldPlay: true }
     );
    
     soundRef.current = sound;
     isPlayingRef.current = true;
      sound.setOnPlaybackStatusUpdate((status) => {
       if (status.isLoaded && status.didJustFinish) {
         isPlayingRef.current = false;
         sound.unloadAsync().catch(console.error);
         playNextAudioChunk();
       }
     });
      setStatus('response');
   } catch (error) {
     console.error('Error playing audio chunk:', error);
     isPlayingRef.current = false;
     playNextAudioChunk();
   }
 };


 // Start recording
 const startRecording = async () => {
   try {
     // Make sure any previous recording is properly unloaded
     if (recordingRef.current) {
       await recordingRef.current.stopAndUnloadAsync();
       recordingRef.current = null;
     }
    
     const recording = new Audio.Recording();
     await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
     await recording.startAsync();
     recordingRef.current = recording;
     setIsRecording(true);
     setStatus('recording');
   } catch (error) {
     console.error('Error starting recording:', error);
   }
 };


 // Stop recording and send audio
 const stopRecording = async () => {
   if (!recordingRef.current) return;


   try {
     // First, stop the recording
     await recordingRef.current.stopAndUnloadAsync();
     const uri = recordingRef.current.getURI();
    
     // Clear the recording reference immediately to prevent double unloading
     const currentRecording = recordingRef.current;
     recordingRef.current = null;
    
     if (!uri) throw new Error('No recording URI');


     // Fetch the audio file
     const response = await fetch(uri);
     const blob = await response.blob();
    
     // Read as array buffer
     const reader = new FileReader();
    
     reader.onload = async (e) => {
       if (!e.target || !e.target.result) {
         throw new Error('Failed to read file');
       }
      
       const arrayBuffer = e.target.result as ArrayBuffer;
       const uint8Array = new Uint8Array(arrayBuffer);
       const base64 = Buffer.from(uint8Array).toString('base64');


       if (socketRef.current?.connected) {
         socketRef.current.emit('audio', { query_type: apiType, data: base64 });
         setStatus('processing');
         setIsProcessing(true);
         setMessages((prev) => [...prev, { type: 'user', content: 'Audio message sent.' }]);
       } else {
         console.error('Socket not connected');
       }
     };
    
     reader.onerror = (error) => {
       console.error('Error reading file:', error);
     };
    
     reader.readAsArrayBuffer(blob);
    
     setIsRecording(false);
   } catch (error) {
     console.error('Error stopping recording:', error);
     // Reset recording state
     setIsRecording(false);
     recordingRef.current = null;
   }
 };


 const handleButtonClick = () => {
   if (!isRecording && !isProcessing) {
     startRecording();
   } else if (isRecording) {
     stopRecording();
   }
 };


 return (
   <Modal
     visible={visible}
     animationType="slide"
     transparent={false}
     onRequestClose={onExit}
   >
     <View style={[styles.container, { backgroundColor: colors.background }]}>
       <View style={[styles.chatContainer, { backgroundColor: colors.card }]}>
         <View style={styles.header}>
           <Text style={[styles.title, { color: colors.text }]}>Voice Chat</Text>
           {/* <View style={styles.dropdownContainer}>
             <Text style={[styles.dropdownText, { color: colors.text }]}>
               {apiType}
             </Text>
             <TouchableOpacity
               onPress={() => setApiType(apiType === 'RAG' ? 'LLM' : 'RAG')}
             >
               <ChevronDown color={colors.text} size={16} />
             </TouchableOpacity>
           </View> */}
           <View
             style={[
               styles.statusDot,
               { backgroundColor: isConnected ? '#22c55e' : '#ef4444' },
             ]}
           />
         </View>


         <View style={styles.messagesContainer}>
           {messages.map((message, index) => (
             <View
               key={index}
               style={[
                 styles.message,
                 message.type === 'user' ? styles.userMessage : styles.aiMessage,
               ]}
             >
               <Text style={{ color: message.type === 'user' ? '#fff' : '#000' }}>
                 {message.content}
               </Text>
             </View>
           ))}
         </View>
       </View>


       <View style={styles.controls}>
         {status === 'idle' && (
           <Text style={[styles.statusText, { color: colors.secondaryText }]}>
             Tap to start recording
           </Text>
         )}
         {status === 'recording' && (
           <View style={styles.statusRow}>
             {/* <Radio color="#ef4444" size={20} /> */}
             <Text style={[styles.statusText, { color: '#ef4444' }]}>
               Recording...
             </Text>
           </View>
         )}
         {status === 'processing' && (
           <View style={styles.statusRow} >
             {/* <Loader color="#3b82f6" size={20} /> */}
             <Text style={[styles.statusText, { color: '#3b82f6' }]}>
               Processing...
             </Text>
           </View>
         )}
         {status === 'response' && (
           <View style={styles.statusRow}>
             <MessageSquare color="#22c55e" size={20} />
             <Text style={[styles.statusText, { color: '#22c55e' }]}>
               Playing response...
             </Text>
           </View>
         )}


         <View style={styles.buttonRow}>
           <TouchableOpacity
             onPress={handleButtonClick}
             disabled={isProcessing || status === 'response'}
             style={[
               styles.button,
               isRecording
                 ? styles.stopButton
                 : isProcessing || status === 'response'
                 ? styles.disabledButton
                 : styles.recordButton,
             ]}
           >
             {isRecording ? (
               <>
                 <Send color="#fff" size={20} />
                 <Text style={styles.buttonText}>Send</Text>
               </>
             ) : (
               <>
                 <Mic color="#fff" size={20} />
                 <Text style={styles.buttonText}>Record</Text>
               </>
             )}
           </TouchableOpacity>


           <TouchableOpacity onPress={onExit} style={styles.exitButton}>
             <X color="#fff" size={20} />
           </TouchableOpacity>
         </View>
       </View>
     </View>
   </Modal>
 );
};


const styles = StyleSheet.create({
 container: {
   flex: 1,
   padding: 16,
   justifyContent: 'space-between',
 },
 chatContainer: {
   flex: 1,
   borderRadius: 12,
   padding: 16,
   marginBottom: 16,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.2,
   shadowRadius: 4,
   elevation: 5,
 },
 header: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   marginBottom: 16,
 },
 title: {
   fontSize: 24,
   fontWeight: 'bold',
 },
 dropdownContainer: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 dropdownText: {
   marginRight: 8,
   fontSize: 16,
 },
 statusDot: {
   width: 12,
   height: 12,
   borderRadius: 6,
 },
 messagesContainer: {
   flex: 1,
   overflow: 'scroll',
 },
 message: {
   padding: 12,
   borderRadius: 8,
   marginVertical: 4,
   maxWidth: '70%',
 },
 userMessage: {
   backgroundColor: '#3b82f6',
   alignSelf: 'flex-end',
 },
 aiMessage: {
   backgroundColor: '#e5e7eb',
   alignSelf: 'flex-start',
 },
 controls: {
   alignItems: 'center',
 },
 statusText: {
   fontSize: 16,
   marginBottom: 16,
 },
 statusRow: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 16,
   justifyContent: 'center',
 },
 buttonRow: {
   flexDirection: 'row',
   gap: 16,
 },
 button: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingVertical: 12,
   paddingHorizontal: 24,
   borderRadius: 999,
 },
 recordButton: {
   backgroundColor: '#3b82f6',
 },
 stopButton: {
   backgroundColor: '#ef4444',
 },
 disabledButton: {
   backgroundColor: '#9ca3af',
},
exitButton: {
 backgroundColor: '#ef4444',
 padding: 12,
 borderRadius: 999,
},
buttonText: {
 color: '#fff',
 marginLeft: 8,
 fontSize: 16,
 fontWeight: '600',
},
});


export default SpeechToSpeechComponent;