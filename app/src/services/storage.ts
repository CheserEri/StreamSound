import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export function getString(key: string): string | undefined {
  return storage.getString(key);
}

export function setString(key: string, value: string): void {
  storage.set(key, value);
}

export function getNumber(key: string): number | undefined {
  return storage.getNumber(key);
}

export function setNumber(key: string, value: number): void {
  storage.set(key, value);
}

export function getBoolean(key: string): boolean | undefined {
  return storage.getBoolean(key);
}

export function setBoolean(key: string, value: boolean): void {
  storage.set(key, value);
}

export function deleteKey(key: string): void {
  storage.delete(key);
}

export function clearAll(): void {
  storage.clearAll();
}

// Storage keys
export const STORAGE_KEYS = {
  SERVER_URL: 'server_url',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  LYRICS_SIZE: 'lyrics_size',
  THEME: 'theme',
} as const;
