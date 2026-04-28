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
  LYRICS_CACHE: 'lyrics_cache',
  PERSISTED_QUEUE: 'persisted_queue',
  PERSISTED_QUEUE_INDEX: 'persisted_queue_index',
  PLAY_MODE: 'play_mode',
} as const;

// --- Lyrics Cache ---
const LYRICS_CACHE_MAX = 200;

interface LyricsCacheEntry {
  lyrics: string;
  cachedAt: number;
}

export function getCachedLyrics(trackId: number): string | null {
  try {
    const raw = getString(STORAGE_KEYS.LYRICS_CACHE);
    if (!raw) return null;
    const cache: Record<number, LyricsCacheEntry> = JSON.parse(raw);
    return cache[trackId]?.lyrics ?? null;
  } catch {
    return null;
  }
}

export function setCachedLyrics(trackId: number, lyrics: string): void {
  try {
    const raw = getString(STORAGE_KEYS.LYRICS_CACHE);
    const cache: Record<number, LyricsCacheEntry> = raw ? JSON.parse(raw) : {};
    cache[trackId] = { lyrics, cachedAt: Date.now() };

    // Evict oldest entries if over limit
    const keys = Object.keys(cache);
    if (keys.length > LYRICS_CACHE_MAX) {
      const sorted = keys.sort((a, b) => cache[Number(a)].cachedAt - cache[Number(b)].cachedAt);
      for (let i = 0; i < sorted.length - LYRICS_CACHE_MAX; i++) {
        delete cache[Number(sorted[i])];
      }
    }

    setString(STORAGE_KEYS.LYRICS_CACHE, JSON.stringify(cache));
  } catch {
    // Silent fail
  }
}

// --- Queue Persistence ---
const QUEUE_MAX = 500;

export function getPersistedQueue(): { queue: any[]; index: number } | null {
  try {
    const queueRaw = getString(STORAGE_KEYS.PERSISTED_QUEUE);
    const indexRaw = getNumber(STORAGE_KEYS.PERSISTED_QUEUE_INDEX);
    if (!queueRaw) return null;
    const queue = JSON.parse(queueRaw);
    if (!Array.isArray(queue) || queue.length === 0) return null;
    return { queue, index: indexRaw ?? 0 };
  } catch {
    return null;
  }
}

export function setPersistedQueue(queue: any[], index: number): void {
  try {
    const capped = queue.length > QUEUE_MAX ? queue.slice(0, QUEUE_MAX) : queue;
    setString(STORAGE_KEYS.PERSISTED_QUEUE, JSON.stringify(capped));
    setNumber(STORAGE_KEYS.PERSISTED_QUEUE_INDEX, Math.min(index, capped.length - 1));
  } catch {
    // Silent fail
  }
}

export function clearPersistedQueue(): void {
  deleteKey(STORAGE_KEYS.PERSISTED_QUEUE);
  deleteKey(STORAGE_KEYS.PERSISTED_QUEUE_INDEX);
}
