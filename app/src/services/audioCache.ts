/**
 * 音频缓存服务
 * 当前播放歌曲会在后台缓存；再次播放时优先使用本地文件。
 */
import RNFS from 'react-native-fs';
import { getBoolean, getNumber, getString, setString, STORAGE_KEYS } from './storage';
import { getServerUrl } from './api';

const DEFAULT_MAX_MB = 1024;
const BYTES_PER_MB = 1024 * 1024;
const CACHE_DIR = `${RNFS.CachesDirectoryPath}/audio`;

interface AudioCacheEntry {
  trackId: number;
  path: string;
  size: number;
  cachedAt: number;
  lastAccessed: number;
}

type AudioCacheManifest = Record<string, AudioCacheEntry>;

const activeDownloads = new Set<number>();

export function isAudioCacheEnabled(): boolean {
  return getBoolean(STORAGE_KEYS.AUDIO_CACHE_ENABLED) ?? false;
}

export function getAudioCacheMaxMb(): number {
  return getNumber(STORAGE_KEYS.AUDIO_CACHE_MAX_MB) ?? DEFAULT_MAX_MB;
}

export function getAudioCacheMaxBytes(): number {
  return Math.max(1, getAudioCacheMaxMb()) * BYTES_PER_MB;
}

function readManifest(): AudioCacheManifest {
  try {
    const raw = getString(STORAGE_KEYS.AUDIO_CACHE_MANIFEST);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeManifest(manifest: AudioCacheManifest): void {
  setString(STORAGE_KEYS.AUDIO_CACHE_MANIFEST, JSON.stringify(manifest));
}

function getTrackCachePath(trackId: number): string {
  return `${CACHE_DIR}/${trackId}.audio`;
}

async function ensureCacheDir(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (!exists) {
    await RNFS.mkdir(CACHE_DIR);
  }
}

async function removeEntry(manifest: AudioCacheManifest, key: string): Promise<void> {
  const entry = manifest[key];
  delete manifest[key];
  if (entry) {
    try {
      if (await RNFS.exists(entry.path)) {
        await RNFS.unlink(entry.path);
      }
    } catch {
      // 缓存清理失败不应影响播放
    }
  }
}

export async function getCachedAudioUrl(trackId: number): Promise<string | null> {
  if (!isAudioCacheEnabled()) return null;

  const manifest = readManifest();
  const entry = manifest[String(trackId)];
  if (!entry) return null;

  try {
    const exists = await RNFS.exists(entry.path);
    if (!exists) {
      delete manifest[String(trackId)];
      writeManifest(manifest);
      return null;
    }

    manifest[String(trackId)] = { ...entry, lastAccessed: Date.now() };
    writeManifest(manifest);
    return `file://${entry.path}`;
  } catch {
    return null;
  }
}

export async function getAudioCacheUsageBytes(): Promise<number> {
  const manifest = readManifest();
  return Object.values(manifest).reduce((total, entry) => total + (entry.size || 0), 0);
}

export async function pruneAudioCache(maxBytes = getAudioCacheMaxBytes()): Promise<void> {
  const manifest = readManifest();
  const entries = Object.entries(manifest).sort(
    ([, a], [, b]) => (a.lastAccessed || a.cachedAt) - (b.lastAccessed || b.cachedAt),
  );

  let total = entries.reduce((sum, [, entry]) => sum + (entry.size || 0), 0);
  for (const [key] of entries) {
    if (total <= maxBytes) break;
    const size = manifest[key]?.size || 0;
    await removeEntry(manifest, key);
    total -= size;
  }

  writeManifest(manifest);
}

export async function cacheTrackAudio(trackId: number): Promise<void> {
  if (!isAudioCacheEnabled() || activeDownloads.has(trackId)) return;

  activeDownloads.add(trackId);
  const key = String(trackId);
  const finalPath = getTrackCachePath(trackId);
  const tempPath = `${finalPath}.download`;

  try {
    await ensureCacheDir();

    const cachedUrl = await getCachedAudioUrl(trackId);
    if (cachedUrl) return;

    const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
    const serverUrl = getServerUrl();
    const response = RNFS.downloadFile({
      fromUrl: `${serverUrl}/stream/${trackId}`,
      toFile: tempPath,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      background: true,
      discretionary: true,
    });

    const result = await response.promise;
    if (result.statusCode < 200 || result.statusCode >= 300) {
      await RNFS.unlink(tempPath).catch(() => undefined);
      return;
    }

    const stat = await RNFS.stat(tempPath);
    const size = Number(stat.size) || 0;
    const maxBytes = getAudioCacheMaxBytes();
    if (size <= 0 || size > maxBytes) {
      await RNFS.unlink(tempPath).catch(() => undefined);
      return;
    }

    if (await RNFS.exists(finalPath)) {
      await RNFS.unlink(finalPath);
    }
    await RNFS.moveFile(tempPath, finalPath);

    const manifest = readManifest();
    manifest[key] = {
      trackId,
      path: finalPath,
      size,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
    };
    writeManifest(manifest);
    await pruneAudioCache(maxBytes);
  } catch {
    await RNFS.unlink(tempPath).catch(() => undefined);
  } finally {
    activeDownloads.delete(trackId);
  }
}
