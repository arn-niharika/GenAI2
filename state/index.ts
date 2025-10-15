import { create } from 'zustand';
import { Chat } from '../utils/utils';
// Define the BASE_URL using environment variables or a fallback
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'YOUR_BASE_URL_HERE';

export interface ChatState {
  chats: Chat[];
  selectedChatId: string | null;
  setChats: (chats: Chat[]) => void;
  setSelectedChatId: (id: string | null) => void;
  fetchChats: (token: string) => Promise<void>;
  createChat: (userId: string,token:string, chatName?: string) => Promise<Chat | null>;
  editChat: (token: string, chatId: string, newName: string) => Promise<boolean>;
  deleteChat: (token: string, chatId: string,) => Promise<boolean>;
}

interface Document {
  id: string;
  title: string;
  size: string;
  url: string;
  type?: string;
}

interface DocumentState {
  documents: Document[];
  loading: boolean;
  setDocuments: (documents: Document[]) => void;
  fetchDocuments: (token:string) => Promise<void>;
}


interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

type ActionType = 'changeRole' | 'changeStatus' | 'changePremium';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  rowsPerPage: number;
  searchTerm: string;
  selectedUser: User | null;
  modalVisible: boolean;
  actionType: ActionType | null;

  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  setSearchTerm: (term: string) => void;
  setSelectedUser: (user: User | null) => void;
  setModalVisible: (visible: boolean) => void;
  setActionType: (type: ActionType | null) => void;

  fetchUsers: (userId: string) => Promise<void>;
  changeUserRole: (token: string, userDetails: User, newRole: string) => Promise<boolean>;
  changeUserStatus: (userId: string, userDetails: User) => Promise<boolean>;
}

const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  selectedChatId: null,
  setChats: (chats) => set({ chats }),

  setSelectedChatId: (id) => {
    console.log("Zustand: Setting selectedChatId to:", id);
    set({ selectedChatId: id });
  },

  fetchChats: async (token) => {
    console.log("in fetch chats method------>", token);
    if (!token) {
      console.log("No user ID available for fetching chats");
      return;
    }
    try {
      console.log(`Fetching chats for user: ${token}`);
      const response = await fetch(`${BASE_URL}/db/chat`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetch chats response:------->", response);
      console.log("Fetch chats response status:", response.status);
      if (!response.ok) {
        console.log(`Token ${token}`)
        console.error(`Error fetching chats: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await response.json();

      if (data && data.chats && Array.isArray(data.chats)) {
        console.log('Chats found:', data.chats.length);

        // Sort chats by creation date (newest first)
        const sortedChats = data.chats.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => {
          const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
          const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });

        set({ chats: sortedChats });

        // If no chat is selected and we have chats, select the first one
        const { selectedChatId } = get();
        if (!selectedChatId && data.chats.length > 0) {
          console.log('No chat selected, selecting the latest one');
          set({ selectedChatId: sortedChats[0].id });
        }
      } else {
        console.log('No chats found or invalid data structure:', data);
        console.log('@settingchat ----> to empty', data);
        set({ chats: [] });
      }
    } catch (error) {
      // console.log("Fetch chats endpoint:", `${BASE_URL}/db/${userId}/chat`);
      console.error('Error fetching chats:---->', error);
    }
  },

  createChat: async (userId, token, chatName) => {
    if (!userId) {
      console.log("No user ID available for creating chat");
      return null;
    }
    try {
      console.log(`Creating new chat for user: ${userId}`);
      const { chats } = get();

      // Create a new chat object
      const newChat: Chat = {
        id: Date.now().toString(),
        name: chatName || `Chat ${chats.length + 1}`,
        created_at: new Date(),
        userId: userId,
        messages: [],
      };

      // Call the API to create the chat
      const response = await fetch(`${BASE_URL}/db/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,
           "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newChat.name,
          id: newChat.id
        }),
        
      });



      console.log("Create chat response status:", response.status);

      if (response.status !== 200) {
        console.error("Couldn't create chat");
        return null;
      }

      const responseData = await response.json();

      // Check if the response contains an error message
      if ("message" in responseData) {
        console.error(responseData.message);
        return null;
      }

      // Update the local state with the new chat
      const updatedChats = [...chats, responseData].sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });


      set({ chats: updatedChats });

      // Set the newly created chat as selected
      set({ selectedChatId: responseData.id });

      return responseData;
    } catch (error) {
      console.error('Error creating new chat:', error);
      return null;
    }
  },

  editChat: async (token, chatId, newName) => {
    if (!token || !chatId) {
      console.log("Missing user ID or chat ID for editing chat");
      return false;
    }

    try {
      console.log(`Editing chat ${chatId} for user: ${token}`);
      const response = await fetch(`${BASE_URL}/db/chat/${chatId}`, {
        method: 'PUT',
        headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        body: JSON.stringify({ name: newName }),
      });

      console.log("Edit chat response status:", response.status);

      if (!response.ok) {
        console.error("Couldn't edit chat");
        return false;
      }

      // Update the chat name in the local state
      const { chats } = get();
      const updatedChats = chats.map(chat =>
        chat.id === chatId ? { ...chat, name: newName } : chat
      );

      set({ chats: updatedChats });
      return true;
    } catch (error) {
      console.error('Error editing chat:', error);
      return false;
    }
  },

  deleteChat: async (token, chatId) => {
    if (!token || !chatId) {
      console.log("Missing user ID or chat ID for deleting chat");
      return false;
    }

    try {
      console.log(`Deleting chat ${chatId} for token: ${token}`);
      const response = await fetch(`${BASE_URL}/db/chat/${chatId}`, {
        method: 'DELETE',
          headers: {
                "Authorization": `Bearer ${token}`,
            }
      });

      console.log("Delete chat response status:", response.status);

      if (!response.ok) {
        console.error("Couldn't delete chat");
        return false;
      }

      // Remove the deleted chat from the local state
      const { chats, selectedChatId } = get();
      const updatedChats = chats.filter(chat => chat.id !== chatId);

      set({ chats: updatedChats });

      // If the deleted chat was selected, select another one
      if (selectedChatId === chatId) {
        const nextChatId = updatedChats[0]?.id || null;
        set({ selectedChatId: nextChatId });
      }

      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }
}));

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  setDocuments: (documents) => set({ documents }),
  fetchDocuments: async (token) => {
    // Check if we're already loading to prevent duplicate calls
    if (get().loading) return;
    set({ loading: true });
    try {
      const response = await fetch(`${BASE_URL}/document/list`,
      {  method: 'GET',
         headers: {
                    "Authorization": `Bearer ${token}`,
                }
        }
      );
      if (!response.ok) {
        console.error(`Server responded with status: ${response.status}`);
        const text = await response.text();
        console.error('Response content:', text);
        set({ documents: [], loading: false });
        return;
      }

      const data = await response.json();
      if (data.success) {
        set({ documents: data.data || [], loading: false });
      } else {
        console.error('Fetch documents failed:', data);
        set({ documents: [], loading: false });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ documents: [], loading: false });
    }
  }
}));


export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  currentPage: 1,
  rowsPerPage: 5,
  searchTerm: '',
  selectedUser: null,
  modalVisible: false,
  actionType: null,

  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setRowsPerPage: (rows) => set({ rowsPerPage: rows }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setModalVisible: (visible) => set({ modalVisible: visible }),
  setActionType: (type) => set({ actionType: type }),

  fetchUsers: async (token) => {
    if (get().loading) return;
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/db/users`,{
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${token}` // Include token for authentication
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      set({ users: data, loading: false });
    } catch (error) {
      console.log('Error ----> user endpoint', `${BASE_URL}/db/users`);
      console.error('Error fetching users:', error);
      set({
        users: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      });
    }
  },

  changeUserRole: async (token, userDetails, newRole) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/db/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: userDetails.id, role: newRole }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const updatedUser = await response.json();
      const currentUsers = get().users;

      set({
        users: currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u),
        loading: false,
        modalVisible: false,
        selectedUser: null,
        actionType: null
      });

      return true;
    } catch (error) {
      console.error('Error changing user role:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to change user role',
        modalVisible: false
      });
      return false;
    }
  },

  changeUserStatus: async (token, userDetails) => {
    const newStatus = userDetails.status === 'enabled' ? 'disabled' : 'enabled';
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/db/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: userDetails.id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const updatedUser = await response.json();
      const currentUsers = get().users;

      set({
        users: currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u),
        loading: false,
        modalVisible: false,
        selectedUser: null,
        actionType: null
      });

      return true;
    } catch (error) {
      console.error('Error changing user status:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to change user status',
        modalVisible: false
      });
      return false;
    }
  }
}));

export default useChatStore;


