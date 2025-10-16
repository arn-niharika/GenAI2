import { create } from 'zustand';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1'; // Use Expo env

export interface Log {
  id: string;
  user_name: string;
  action: string;
  message: string;
  timestamp: Date;
}

export interface AdminLogState {
  logs: Log[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  fetchLogs: (getToken: () => Promise<string | null>, start_time?: Date, end_time?: Date) => Promise<void>;
}

export const useAdminLogStore = create<AdminLogState>((set) => ({
  logs: [],
  loading: false,
  setLoading: (loading) => set({ loading }),
  fetchLogs: async (getToken, start_time?: Date, end_time?: Date) => {
    const formattedStartTime = start_time ? start_time.toISOString() : '';
    const formattedEndTime = end_time ? end_time.toISOString() : '';
    try {
      set({ loading: true });
      const token = await getToken();
      const response = await fetch(
        `${BASE_URL}/document/logs?start_time=${formattedStartTime}&end_time=${formattedEndTime}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const resp = await response.json();
      const data = resp.data;
      set({ logs: data });
      set({ loading: false });
      console.log('Fetched logs:', data);
    } catch (error) {
      set({ loading: false });
      console.error('Error fetching admin logs:', error);
    }
  },
}));