import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '@clerk/clerk-expo';
import { useDocumentStore } from '../state';
import { useAuth } from '@clerk/clerk-expo';

interface DocumentUploadModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isVisible, onClose }) => {
  const { colors } = useTheme();
  const { user } = useUser();
  const {getToken} = useAuth();
  const fetchDocuments = useDocumentStore(state => state.fetchDocuments);

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'YOUR_BASE_URL_HERE';

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'audio/mpeg', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        // Check file size (limit to 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          alert("File size exceeds 10MB. Please upload a smaller file.");
          return;
        }
        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');


    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);

      // Upload file
      const uploadResponse = await fetch(`${BASE_URL}/document/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // 'Accept': 'application/json',
        },
      });



      const uploadResult = await uploadResponse.json();

      if (uploadResult.success) {
        setUploadStatus('Processing document...');

        // Process document
        const processResponse = await fetch(`${BASE_URL}/document/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_name: uploadResult.file_name,
            user_id: user?.id,
          }),
        });

        const processResult = await processResponse.json();

        if (processResult.success) {
          alert('Document processed successfully');
          const token = await getToken()
        if (!token) return;
        fetchDocuments(token); // Refresh document list using Zustand
          
          onClose(); // Close modal
        } else {
          alert('Error processing document');
        }
      } else {
        alert('Error uploading file');
      }
    } catch (error) {
      console.error('Error during upload:', error);
      alert('Error uploading document');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };


  return (

    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Upload New Document</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.uploadArea, { borderColor: colors.border }]}>
              {!selectedFile ? (
                <>
                  <Text style={{ color: colors.text, marginBottom: 16 }}>
                    Tap to select a file to upload
                  </Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={pickDocument}
                  >
                    <Text style={styles.buttonText}>Choose File</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={{ color: colors.text, marginBottom: 16 }}>
                    Selected file: {selectedFile.name}
                  </Text>
                  {isUploading ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={{ color: colors.text, marginLeft: 8 }}>{uploadStatus}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: colors.primary }]}
                      onPress={handleUpload}
                    >
                      <Ionicons name="cloud-upload" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>Upload File</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
    height: '100%',
  },
  modalView: {
    width: width * 0.9,
    maxWidth: 500,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DocumentUploadModal;
