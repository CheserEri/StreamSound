import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const STORAGE_KEYS = {
  SERVER_URL: 'ss_server_url',
  ACCESS_TOKEN: 'ss_access_token',
  REFRESH_TOKEN: 'ss_refresh_token',
  USER: 'ss_user',
  THEME: 'ss_theme',
  PLAY_MODE: 'ss_play_mode',
} as const;

function getString(key: string): string | null {
  return localStorage.getItem(key);
}

function setString(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function deleteKey(key: string): void {
  localStorage.removeItem(key);
}

export { STORAGE_KEYS, getString, setString, deleteKey };

let serverUrl = getString(STORAGE_KEYS.SERVER_URL) || window.location.origin;

const api = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function setServerUrl(url: string): void {
  serverUrl = url;
  api.defaults.baseURL = url;
  setString(STORAGE_KEYS.SERVER_URL, url);
}

export function getServerUrl(): string {
  return serverUrl;
}

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

// Response interceptor: retry on network errors and 5xx
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { __retryCount?: number };
    if (error.code === 'ERR_CANCELED') return Promise.reject(error);
    const retryCount = config.__retryCount || 0;
    if (retryCount >= MAX_RETRIES) return Promise.reject(error);
    const method = (config.method || 'get').toUpperCase();
    const isIdempotent = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const shouldRetry = isIdempotent && (!error.response || (error.response.status >= 500 && error.response.status < 600));
    if (!shouldRetry) return Promise.reject(error);
    config.__retryCount = retryCount + 1;
    const delay = RETRY_DELAYS[retryCount] + Math.random() * 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(config);
  },
);

// Response interceptor: handle token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code: string } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'AUTH_003' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
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
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const response = await axios.post(`${serverUrl}/auth/refresh`, { refreshToken }, { timeout: 8000 });
        const { accessToken } = response.data.data;
        setString(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        processQueue(null, accessToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        deleteKey(STORAGE_KEYS.ACCESS_TOKEN);
        deleteKey(STORAGE_KEYS.REFRESH_TOKEN);
        deleteKey(STORAGE_KEYS.USER);
        window.location.href = '/login';
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
    // Silent fail
  }
}

export default api;