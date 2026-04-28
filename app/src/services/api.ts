import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getString, setString, deleteKey, STORAGE_KEYS } from './storage';
import type { ApiError } from '../types';

let serverUrl = getString(STORAGE_KEYS.SERVER_URL) || 'http://192.168.1.100:3000';

const api = axios.create({
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update base URL
export function setServerUrl(url: string): void {
  serverUrl = url;
  api.defaults.baseURL = url;
  setString(STORAGE_KEYS.SERVER_URL, url);
}

export function getServerUrl(): string {
  return serverUrl;
}

// Initialize base URL
api.defaults.baseURL = serverUrl;

// Request interceptor: attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 AUTH_003 (token expired)
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'AUTH_003' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getString(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        isRefreshing = false;
        deleteKey(STORAGE_KEYS.ACCESS_TOKEN);
        deleteKey(STORAGE_KEYS.REFRESH_TOKEN);
        deleteKey(STORAGE_KEYS.USER);
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${serverUrl}/auth/refresh`,
          { refreshToken },
          { timeout: 8000 },
        );

        const { accessToken } = response.data.data;
        setString(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        deleteKey(STORAGE_KEYS.ACCESS_TOKEN);
        deleteKey(STORAGE_KEYS.REFRESH_TOKEN);
        deleteKey(STORAGE_KEYS.USER);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// History reporting
export async function reportPlayHistory(trackId: number): Promise<void> {
  try {
    await api.post(`/history/${trackId}`);
  } catch {
    // Silent fail — history reporting is best-effort
  }
}

export default api;
