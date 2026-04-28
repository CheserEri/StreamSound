import { create } from 'zustand';
import api from '../services/api';
import { getString, setString, deleteKey, STORAGE_KEYS } from '../services/storage';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<{ approved: boolean; message: string }>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken, user } = response.data.data;

      setString(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      setString(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      setString(STORAGE_KEYS.USER, JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/register', { username, password });
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    deleteKey(STORAGE_KEYS.ACCESS_TOKEN);
    deleteKey(STORAGE_KEYS.REFRESH_TOKEN);
    deleteKey(STORAGE_KEYS.USER);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  loadFromStorage: () => {
    const userStr = getString(STORAGE_KEYS.USER);
    const accessToken = getString(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = getString(STORAGE_KEYS.REFRESH_TOKEN);

    if (userStr && accessToken && refreshToken) {
      try {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      } catch {
        deleteKey(STORAGE_KEYS.USER);
        deleteKey(STORAGE_KEYS.ACCESS_TOKEN);
        deleteKey(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }
  },
}));
