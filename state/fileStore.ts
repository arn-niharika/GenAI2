import { create } from 'zustand';
import { notify } from '../utils/utils'; // Adjust path to your utils
import * as DocumentPicker from 'expo-document-picker'; // For potential future use; not directly used here
import { Linking } from 'react-native';

// Types (same as web)
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  folderId: string;
}

export interface Folder {
  id: string;
  name: string;
  children: Folder[];
}

export interface FileStore {
  // State
  files: FileItem[];
  folders: Folder[];
  currentFolderId: string | null;
  loading: boolean;
  error: string | null;
  currentPath: string;

  // Actions
  // List files and folders
  listFiles: (getToken: () => Promise<string | null>, path?: string, search?: string, sortBy?: 'name' | 'size' | 'date', order?: 'asc' | 'desc', page?: number, limit?: number) => Promise<void>;

  // Upload file
  uploadFile: (getToken: () => Promise<string | null>, file: any, path?: string, index?: number) => Promise<boolean>; // 'any' for RN file object

  // Create folder
  createFolder: (getToken: () => Promise<string | null>, name: string, path?: string) => Promise<void>;

  // Delete file or folder
  deleteItem: (getToken: () => Promise<string | null>, path: string) => Promise<void>;

  // Download file
  downloadFile: (getToken: () => Promise<string | null>, path: string) => Promise<void>;

  // Get recent activity
  getRecentActivity: (getToken: () => Promise<string | null>) => Promise<void>;

  // Fetch Children of a folder
  fetchChildren: (getToken: () => Promise<string | null>, path: string) => Promise<void>;

  // Utility actions
  setCurrentPath: (path: string) => void;
  clearError: () => void;
  reset: () => void;
}
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'YOUR_BASE_URL_HERE';


const API_BASE_URL =  `${BASE_URL}/document`; // Replace with your env var equivalent, e.g., process.env.EXPO_PUBLIC_API_URL

export const useFileStore = create<FileStore>((set, get) => ({
  // Initial state
  files: [],
  folders: [],
  currentFolderId: '',
  loading: false,
  error: null,
  currentPath: '',

  // List files and folders
  listFiles: async (getToken, path = '', search, sortBy = 'name', order = 'asc', page = 1, limit = 50) => {
    set({ loading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (path) params.append('path', path);
      if (search) params.append('search', search);
      if (sortBy) params.append('sort_by', sortBy);
      if (order) params.append('order', order);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const token = await getToken();

      console.log('Fetching files from:', `${API_BASE_URL}/tree`);

      const response = await fetch(`${API_BASE_URL}/tree`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const resp = await response.json();
      console.log('API response:', resp);
      if (!resp.success) {
        console.error('API error:', resp.message);
        throw new Error(resp.message || 'Failed to list files');
      }
      const data = resp.data[0] || {};
      console.log('Files and folders data:', data);
      const files = data.files || [];
      const folders = data.folders || [];
      const currentFolderId = data.currentFolderId || '';
      set({
        files: files || [],
        folders: folders || [],
        currentFolderId,
        currentPath: path,
        loading: false,
      });
    } catch (error) {
      console.error('Error listing files:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to list files',
        loading: false,
      });
    }
  },

  // Upload file (adapted for RN: file is from expo-document-picker, which has uri/name/type)
  uploadFile: async (getToken, file: any, path = '', index = 0) => {
    set({ loading: true, error: null });
    console.log('index----->', index);
    console.log('path inside upload---->', path);

    try {
      const formData = new FormData();
      // For RN, use file.uri, file.name, file.type/mimeType
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || file.type,
      } as any);
      if (path === 'root') {
        formData.append('path', '');
      } else {
        formData.append('path', path);
      }

      console.log('uploading file at ----------------------------------------->:', path);
      const token = await getToken();
      console.log('Token for upload:', token);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      console.log('File uploaded successfully');

      // Refresh the file list after upload
      await get().listFiles(getToken, get().currentPath);

      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to upload file',
        loading: false,
      });
      return false;
    }
  },

  // Create folder (same)
  createFolder: async (getToken, name: string, path = '') => {
    set({ loading: true, error: null });
    console.log('path inside create folder---->', path);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (path && path === 'root') {
        formData.append('path', '');
      } else {
        formData.append('path', path);
      }
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/folder`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`);
      }

      // Refresh the file list after creating folder
      await get().listFiles(getToken, get().currentPath);

      set({ loading: false });
      notify('folder created successfully');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create folder';
      set({
        error: msg,
        loading: false,
      });
      notify(msg, 'error');
    }
  },

  // Delete file or folder (same)
  deleteItem: async (getToken, path: string) => {
    set({ loading: true, error: null });

    try {
      const token = await getToken();
      console.log('Deleting item at path:', path);
      const response = await fetch(`${API_BASE_URL}/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.statusText}`);
      }

      // Refresh the file list after deletion
      await get().listFiles(getToken, get().currentPath);

      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete item',
        loading: false,
      });
    }
  },

  // Download file (adapted for RN: opens URL in browser/app)
  downloadFile: async (getToken, path: string) => {
    try {
      const token = await getToken();
      const downloadUrl = `${API_BASE_URL}/download?path=${encodeURIComponent(path)}`;
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      // In RN, open the URL to trigger download/open
      const url = response.url; // Or construct full URL
      await Linking.openURL(url);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to download file',
      });
    }
  },

  // Get recent activity (same)
  getRecentActivity: async (getToken) => {
    set({ loading: true, error: null });

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/recent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get recent activity: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Recent activity data:', data);
      // Handle recent activity data as needed
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get recent activity',
        loading: false,
      });
    }
  },

  // Fetch Children of a folder (same)
  fetchChildren: async (getToken, path: string) => {
    set({ loading: true, error: null });

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/list?path=${encodeURIComponent(path)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch children: ${response.statusText}`);
      }

      const resp = await response.json();
      console.log('Children resp:', resp);

      // Assuming the API returns an array of files and folders
      if (!resp.success) {
        console.error('API error:', resp.message);
        throw new Error(resp.message || 'Failed to fetch children');
      }

      const data = resp.data[0] || {};
      // get the folder item from Folders using the path and update its children only

      set({
        files: data.files || [],
        folders: data.folders || [],
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch children',
        loading: false,
      });
    }
  },

  // Utility actions (same)
  setCurrentPath: (path: string) => set({ currentPath: path }),
  clearError: () => set({ error: null }),
  reset: () => set({
    files: [],
    folders: [],
    loading: false,
    error: null,
    currentPath: '/',
  }),
}));