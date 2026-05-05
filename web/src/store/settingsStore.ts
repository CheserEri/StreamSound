import { create } from 'zustand';
import { STORAGE_KEYS, getString, setString } from '../services/api';
import { setServerUrl as setApiServerUrl, getServerUrl } from '../services/api';
import type { Theme } from '../types';

interface SettingsState {
  serverUrl: string;
  theme: Theme;
  setServerUrl: (url: string) => void;
  setTheme: (theme: Theme) => void;
  loadFromStorage: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  serverUrl: getServerUrl(),
  theme: (getString(STORAGE_KEYS.THEME) as Theme) || 'dark',

  setServerUrl: (url: string) => {
    setApiServerUrl(url);
    set({ serverUrl: url });
  },

  setTheme: (theme: Theme) => {
    setString(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  loadFromStorage: () => {
    const serverUrl = getServerUrl();
    const theme = (getString(STORAGE_KEYS.THEME) as Theme) || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    set({ serverUrl, theme });
  },
}));
