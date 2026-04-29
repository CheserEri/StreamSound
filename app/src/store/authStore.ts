/**
 * 认证状态管理
 * 使用 Zustand 管理用户认证状态，包括登录、注册、登出等操作
 */
import { create } from 'zustand';
import api from '../services/api';
import { getString, setString, deleteKey, STORAGE_KEYS } from '../services/storage';
import type { User } from '../types';

/**
 * 认证状态接口
 */
interface AuthState {
  user: User | null;                                    // 用户信息
  accessToken: string | null;                           // 访问令牌
  refreshToken: string | null;                          // 刷新令牌
  isAuthenticated: boolean;                             // 是否已认证
  isLoading: boolean;                                   // 是否正在加载

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<{ approved: boolean; message: string }>;
  logout: () => void;
  loadFromStorage: () => void;
}

/**
 * 认证状态 Store
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   */
  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken, user } = response.data.data;

      // 保存到本地存储
      setString(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      setString(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      setString(STORAGE_KEYS.USER, JSON.stringify(user));

      // 更新状态
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

  /**
   * 用户注册
   * @param username 用户名
   * @param password 密码
   * @returns 注册结果，包含是否通过和消息
   */
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

  /**
   * 用户登出
   * 清除本地存储和状态
   */
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

  /**
   * 从本地存储加载认证状态
   */
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
        // 如果解析失败，清除损坏的存储数据
        deleteKey(STORAGE_KEYS.USER);
        deleteKey(STORAGE_KEYS.ACCESS_TOKEN);
        deleteKey(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }
  },
}));
