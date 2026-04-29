/**
 * 设置状态管理
 * 使用 Zustand 管理应用设置，包括服务器地址、歌词尺寸、主题等
 */
import { create } from 'zustand';
import { getString, setString, STORAGE_KEYS } from '../services/storage';
import { setServerUrl as setApiServerUrl, getServerUrl } from '../services/api';
import type { LyricsSize, Theme } from '../types';

/**
 * 设置状态接口
 */
interface SettingsState {
  serverUrl: string;                 // 服务器地址
  lyricsSize: LyricsSize;            // 歌词显示尺寸
  theme: Theme;                      // 主题

  setServerUrl: (url: string) => void;
  setLyricsSize: (size: LyricsSize) => void;
  setTheme: (theme: Theme) => void;
  loadFromStorage: () => void;
}

/**
 * 设置状态 Store
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  // 从本地存储初始化状态
  serverUrl: getServerUrl(),
  lyricsSize: (getString(STORAGE_KEYS.LYRICS_SIZE) as LyricsSize) || 'md',
  theme: (getString(STORAGE_KEYS.THEME) as Theme) || 'dark',

  /**
   * 设置服务器地址
   * @param url 服务器地址
   */
  setServerUrl: (url: string) => {
    setApiServerUrl(url);
    set({ serverUrl: url });
  },

  /**
   * 设置歌词显示尺寸
   * @param size 歌词尺寸
   */
  setLyricsSize: (size: LyricsSize) => {
    setString(STORAGE_KEYS.LYRICS_SIZE, size);
    set({ lyricsSize: size });
  },

  /**
   * 设置主题
   * @param theme 主题名称
   */
  setTheme: (theme: Theme) => {
    setString(STORAGE_KEYS.THEME, theme);
    set({ theme });
  },

  /**
   * 从本地存储加载设置
   */
  loadFromStorage: () => {
    const serverUrl = getServerUrl();
    const lyricsSize = (getString(STORAGE_KEYS.LYRICS_SIZE) as LyricsSize) || 'md';
    const theme = (getString(STORAGE_KEYS.THEME) as Theme) || 'dark';
    set({ serverUrl, lyricsSize, theme });
  },
}));
