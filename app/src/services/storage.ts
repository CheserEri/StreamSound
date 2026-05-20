/**
 * 本地存储服务
 * 使用 MMKV 提供高性能的键值存储功能
 */
import { MMKV } from 'react-native-mmkv';

// 创建 MMKV 实例
const storage = new MMKV();

/**
 * 获取字符串值
 * @param key 存储键
 * @returns 字符串值或 undefined
 */
export function getString(key: string): string | undefined {
  return storage.getString(key);
}

/**
 * 设置字符串值
 * @param key 存储键
 * @param value 字符串值
 */
export function setString(key: string, value: string): void {
  storage.set(key, value);
}

/**
 * 获取数字值
 * @param key 存储键
 * @returns 数字值或 undefined
 */
export function getNumber(key: string): number | undefined {
  return storage.getNumber(key);
}

/**
 * 设置数字值
 * @param key 存储键
 * @param value 数字值
 */
export function setNumber(key: string, value: number): void {
  storage.set(key, value);
}

/**
 * 获取布尔值
 * @param key 存储键
 * @returns 布尔值或 undefined
 */
export function getBoolean(key: string): boolean | undefined {
  return storage.getBoolean(key);
}

/**
 * 设置布尔值
 * @param key 存储键
 * @param value 布尔值
 */
export function setBoolean(key: string, value: boolean): void {
  storage.set(key, value);
}

/**
 * 删除指定键
 * @param key 存储键
 */
export function deleteKey(key: string): void {
  storage.delete(key);
}

/**
 * 清空所有存储数据
 */
export function clearAll(): void {
  storage.clearAll();
}

/**
 * 存储键常量定义
 */
export const STORAGE_KEYS = {
  SERVER_URL: 'server_url',           // 服务器地址
  ACCESS_TOKEN: 'access_token',       // 访问令牌
  REFRESH_TOKEN: 'refresh_token',     // 刷新令牌
  USER: 'user',                       // 用户信息
  LYRICS_SIZE: 'lyrics_size',         // 歌词尺寸设置
  THEME: 'theme',                     // 主题设置
  LYRICS_CACHE: 'lyrics_cache',       // 歌词缓存
  AUDIO_CACHE_ENABLED: 'audio_cache_enabled', // 音乐缓存开关
  AUDIO_CACHE_MAX_MB: 'audio_cache_max_mb',   // 音乐缓存最大占用空间
  AUDIO_CACHE_MANIFEST: 'audio_cache_manifest', // 音乐缓存索引
  PERSISTED_QUEUE: 'persisted_queue', // 持久化队列
  PERSISTED_QUEUE_INDEX: 'persisted_queue_index', // 持久化队列索引
  PLAY_MODE: 'play_mode',             // 播放模式
} as const;

// --- 歌词缓存模块 ---

// 歌词缓存最大条目数
const LYRICS_CACHE_MAX = 200;

/**
 * 歌词缓存条目接口
 */
interface LyricsCacheEntry {
  lyrics: string;    // 歌词内容
  cachedAt: number;  // 缓存时间戳
}

/**
 * 获取缓存的歌词
 * @param trackId 歌曲ID
 * @returns 歌词内容或 null
 */
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

/**
 * 缓存歌词
 * 当缓存超过最大限制时，自动删除最旧的条目
 * @param trackId 歌曲ID
 * @param lyrics 歌词内容
 */
export function setCachedLyrics(trackId: number, lyrics: string): void {
  try {
    const raw = getString(STORAGE_KEYS.LYRICS_CACHE);
    const cache: Record<number, LyricsCacheEntry> = raw ? JSON.parse(raw) : {};
    cache[trackId] = { lyrics, cachedAt: Date.now() };

    // 如果超过缓存上限，删除最旧的条目
    const keys = Object.keys(cache);
    if (keys.length > LYRICS_CACHE_MAX) {
      const sorted = keys.sort((a, b) => cache[Number(a)].cachedAt - cache[Number(b)].cachedAt);
      for (let i = 0; i < sorted.length - LYRICS_CACHE_MAX; i++) {
        delete cache[Number(sorted[i])];
      }
    }

    setString(STORAGE_KEYS.LYRICS_CACHE, JSON.stringify(cache));
  } catch {
    // 静默失败
  }
}

// --- 队列持久化模块 ---

// 队列最大长度
const QUEUE_MAX = 500;

/**
 * 获取持久化的播放队列
 * @returns 队列数据和当前索引，或 null
 */
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

/**
 * 持久化播放队列
 * @param queue 队列数据
 * @param index 当前播放索引
 */
export function setPersistedQueue(queue: any[], index: number): void {
  try {
    // 如果队列超过最大长度，截断
    const capped = queue.length > QUEUE_MAX ? queue.slice(0, QUEUE_MAX) : queue;
    setString(STORAGE_KEYS.PERSISTED_QUEUE, JSON.stringify(capped));
    setNumber(STORAGE_KEYS.PERSISTED_QUEUE_INDEX, Math.min(index, capped.length - 1));
  } catch {
    // 静默失败
  }
}

/**
 * 清除持久化队列
 */
export function clearPersistedQueue(): void {
  deleteKey(STORAGE_KEYS.PERSISTED_QUEUE);
  deleteKey(STORAGE_KEYS.PERSISTED_QUEUE_INDEX);
}
