import React, { useState } from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import {
  X,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { notify } from '../utils/utils'; // Adjust path
import { ProgressIndicator } from './nativewindui/ProgressIndicator'; // Use your component

interface ModalProps {
  closeModal: () => void;
  handleFileUpload: (file: any, index?: number) => Promise<boolean>; // 'any' for DocumentPicker result
}

interface FileWithStatus {
  file: any; // DocumentPicker.DocumentResult
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const { width } = Dimensions.get('window');

const UploadModal: React.FC<ModalProps> = ({ closeModal, handleFileUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: any): string | null => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.mimeType || file.type)) {
      return 'Only PDF, TXT, and Word documents are allowed';
    }

    // Check file size (limit: 10MB)
    // if (file.size > 10 * 1024 * 1024) {
    //   return 'File size exceeds 10MB';
    // }

    return null;
  };

  const addFiles = async () => {
    const results = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ],
    });

    // if (results.type === 'cancel') return;

    const newFiles: FileWithStatus[] = [];

    (results as unknown as any[]).forEach((result) => {
      const error = validateFile(result);
      if (error) {
        Alert.alert('Invalid File', `${result.name}: ${error}`);
        return;
      }

      // Check if file already exists
      const exists = selectedFiles.some((f) => f.file.name === result.name && f.file.size === result.size);
      if (exists) {
        Alert.alert('Duplicate File', `${result.name} is already selected`);
        return;
      }

      newFiles.push({
        file: result,
        status: 'pending',
        progress: 0,
      });
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileStatus = (index: number, status: FileWithStatus['status'], progress: number = 0, error?: string) => {
    setSelectedFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, status, progress, error } : file))
    );
  };

  const uploadFile = async (file: any, index: number): Promise<boolean> => {
    updateFileStatus(index, 'uploading', 0);

    try {
      updateFileStatus(index, 'processing', 50);
      const status = await handleFileUpload(file, index); // Call the parent function
      if (status) {
        updateFileStatus(index, 'completed', 100);
        return true;
      } else {
        updateFileStatus(index, 'error', 0, 'Processing failed');
        return false;
      }
    } catch (error) {
      updateFileStatus(index, 'error', 0, 'Network error');
      return false;
    }
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    const uploadPromises = selectedFiles.map((fileWithStatus, index) =>
      uploadFile(fileWithStatus.file, index)
    );

    try {
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(Boolean).length;

      if (successCount === selectedFiles.length) {
        notify(
          successCount === 1
            ? 'The document is processed successfully!'
            : `All ${successCount} documents are processed successfully!`
        );
      } else {
        notify(`${successCount} out of ${selectedFiles.length} documents processed successfully`);
      }

      closeModal();
    } catch (error) {
      notify('Error uploading files', 'error');
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: any) => {
    if (file.mimeType === 'application/pdf') return '📄';
    if (file.mimeType === 'text/plain') return '📝';
    if (file.mimeType?.includes('word')) return '📘';
    return '📄';
  };

  const getStatusIcon = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="green" />;
      case 'error':
        return <AlertCircle size={20} color="red" />;
      case 'uploading':
      case 'processing':
        return <ActivityIndicator size="small" color="blue" />;
      default:
        return <FileText size={20} color="gray" />;
    }
  };

  const renderFileItem = ({ item, index }: { item: FileWithStatus; index: number }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{getFileIcon(item.file)}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: 14, fontWeight: '500', color: '#111827', flexShrink: 1 }}
            numberOfLines={1}
          >
            {item.file.name}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            {(item.file.size / 1024 / 1024).toFixed(2)} MB
          </Text>
          {item.status === 'error' && item.error && (
            <Text style={{ fontSize: 12, color: 'red' }}>{item.error}</Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {getStatusIcon(item.status)}
        {item.status === 'pending' && (
          <TouchableOpacity
            onPress={() => removeFile(index)}
            style={{ marginLeft: 8 }}
            disabled={isUploading}
          >
            <Trash2 size={16} color="red" />
          </TouchableOpacity>
        )}
        {item.status === 'uploading' || item.status === 'processing' ? (
          <ProgressIndicator value={item.progress} max={100} />
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal visible={true} animationType="slide" transparent onRequestClose={closeModal}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <View
          style={{
            backgroundColor: 'var(--screen-background)',
            borderRadius: 12,
            padding: 16,
            width: width * 0.9,
            maxHeight: '80%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text
              style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', flex: 1 }}
            >
              Upload Documents
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Pick Files Button (replaces drag/drop) */}
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderStyle: 'dashed',
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              marginBottom: 16,
              borderColor: 'gray',
            }}
            onPress={addFiles}
            disabled={isUploading}
          >
            <Upload size={48} color="gray" />
            <Text style={{ color: 'gray', marginTop: 8, marginBottom: 4 }}>
              Tap to select files
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>
              Supports PDF, TXT, and Word documents
            </Text>
          </TouchableOpacity>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: 'white' }}>
                Selected Files ({selectedFiles.length})
              </Text>
              <FlatList
                data={selectedFiles}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderFileItem}
                style={{ maxHeight: 240 }}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: 'var(--primary-gradient)',
                  padding: 12,
                  borderRadius: 999,
                  alignItems: 'center',
                  marginTop: 16,
                }}
                onPress={handleUploadAll}
                disabled={isUploading || selectedFiles.length === 0}
              >
                <Text style={{ color: 'white', fontSize: 16 }}>
                  {isUploading
                    ? 'Processing...'
                    : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default UploadModal;