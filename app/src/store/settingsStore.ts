import { create } from 'zustand';
import { getString, setString, STORAGE_KEYS } from '../services/storage';
import { setServerUrl as setApiServerUrl, getServerUrl } from '../services/api';
import type { LyricsSize, Theme } from '../types';

interface SettingsState {
  serverUrl: string;
  lyricsSize: LyricsSize;
  theme: Theme;

  setServerUrl: (url: string) => void;
  setLyricsSize: (size: LyricsSize) => void;
  setTheme: (theme: Theme) => void;
  loadFromStorage: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  serverUrl: getServerUrl(),
  lyricsSize: (getString(STORAGE_KEYS.LYRICS_SIZE) as LyricsSize) || 'md',
  theme: (getString(STORAGE_KEYS.THEME) as Theme) || 'dark',

  setServerUrl: (url: string) => {
    setApiServerUrl(url);
    set({ serverUrl: url });
  },

  setLyricsSize: (size: LyricsSize) => {
    setString(STORAGE_KEYS.LYRICS_SIZE, size);
    set({ lyricsSize: size });
  },

  setTheme: (theme: Theme) => {
    setString(STORAGE_KEYS.THEME, theme);
    set({ theme });
  },

  loadFromStorage: () => {
    const serverUrl = getServerUrl();
    const lyricsSize = (getString(STORAGE_KEYS.LYRICS_SIZE) as LyricsSize) || 'md';
    const theme = (getString(STORAGE_KEYS.THEME) as Theme) || 'dark';
    set({ serverUrl, lyricsSize, theme });
  },
}));
