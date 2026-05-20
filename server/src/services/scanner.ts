/**
 * 音乐扫描服务
 * 扫描音乐目录，提取元数据并更新数据库
 */
import { readdir, stat, writeFile, mkdir } from 'fs/promises';
import { join, extname, relative } from 'path';
import { existsSync } from 'fs';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import { extractMetadata } from './metadata.js';
import { extractDominantColor } from './colorExtractor.js';
import { findLRCFile, readLRCFile } from './lyrics.js';
import { AUDIO_EXTENSIONS } from '../types/index.js';
import type { ScanState, ScanProgress } from '../types/index.js';

// 当前扫描状态
let scanState: ScanState = {
  status: 'idle',
  progress: null,
  startedAt: null,
  finishedAt: null,
  musicRoot: null,
};

/**
 * 获取当前扫描状态
 * @returns 扫描状态对象
 */
export function getScanState(): ScanState {
  return scanState;
}

/**
 * 开始扫描音乐目录
 * @param musicRoot 音乐目录路径（可选，默认为配置中的 MUSIC_ROOT）
 */
export async function startScan(musicRoot?: string): Promise<void> {
  // 如果正在扫描，直接返回
  if (scanState.status === 'running') {
    return;
  }

  const resolvedRoot = musicRoot || config.MUSIC_ROOT;

  // 初始化扫描状态
  scanState = {
    status: 'running',
    progress: { scanned: 0, total: 0, added: 0, updated: 0, removed: 0 },
    startedAt: Math.floor(Date.now() / 1000),
    finishedAt: null,
    musicRoot: resolvedRoot,
  };

  try {
    const db = getDb();

    // 清除文件夹缓存
    folderCache.clear();

    // 收集所有音频文件
    const files: string[] = [];
    await walkDir(resolvedRoot, files);

    scanState.progress!.total = files.length;

    // 获取数据库中已存在的歌曲
    const existingTracks = new Map<string, { id: number; scanned_at: number }>();
    const rows = db.prepare('SELECT id, path, scanned_at FROM tracks').all() as { id: number; path: string; scanned_at: number }[];
    for (const row of rows) {
      existingTracks.set(row.path, { id: row.id, scanned_at: row.scanned_at });
    }

    const scannedPaths = new Set<string>();

    // 处理每个文件
    for (const filePath of files) {
      scannedPaths.add(filePath);
      scanState.progress!.scanned++;

      try {
        const fileStat = await stat(filePath);
        const mtime = Math.floor(fileStat.mtimeMs / 1000);

        const existing = existingTracks.get(filePath);

        // 如果文件没有变化，跳过
        if (existing && existing.scanned_at >= mtime) {
          continue;
        }

        // 提取元数据
        const meta = await extractMetadata(filePath);

        // 查找歌词文件
        let lyrics = meta.lyrics;
        if (!lyrics) {
          const lrcPath = await findLRCFile(filePath);
          if (lrcPath) {
            lyrics = await readLRCFile(lrcPath);
          }
        }

        // 获取或创建文件夹记录
        const folderId = await getOrCreateFolder(db, filePath, resolvedRoot);

        const hasLyrics = lyrics ? 1 : 0;
        const now = Math.floor(Date.now() / 1000);

        if (existing) {
          // 更新已存在的歌曲
          db.prepare(`
            UPDATE tracks SET
              title = ?, artist = ?, album = ?, duration = ?,
              bitrate = ?, sample_rate = ?, has_lyrics = ?, lyrics = ?,
              file_size = ?, mime_type = ?, scanned_at = ?
            WHERE id = ?
          `).run(
            meta.title, meta.artist, meta.album, meta.duration,
            meta.bitrate, meta.sampleRate, hasLyrics, lyrics,
            fileStat.size, meta.mimeType, now,
            existing.id,
          );
          scanState.progress!.updated++;
        } else {
          // 插入新歌曲
          db.prepare(`
            INSERT INTO tracks (path, folder_id, title, artist, album, duration,
              bitrate, sample_rate, has_lyrics, lyrics, file_size, mime_type, scanned_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            filePath, folderId, meta.title, meta.artist, meta.album, meta.duration,
            meta.bitrate, meta.sampleRate, hasLyrics, lyrics,
            fileStat.size, meta.mimeType, now,
          );
          scanState.progress!.added++;
        }

        // 如果有封面，保存封面图片并提取主色调
        if (meta.cover) {
          const trackRow = existing ? { id: existing.id } : db.prepare('SELECT id FROM tracks WHERE path = ?').get(filePath) as { id: number } | undefined;
          const trackId = trackRow?.id;
          if (trackId) {
            const coverDir = join(process.cwd(), 'data', 'covers');
            await mkdir(coverDir, { recursive: true });
            const coverPath = join(coverDir, `${trackId}.jpg`);
            await writeFile(coverPath, meta.cover);
            const dominantColor = await extractDominantColor(meta.cover);
            db.prepare('UPDATE tracks SET cover_path = ?, cover_dominant_color = ? WHERE id = ?').run(coverPath, dominantColor, trackId);
          }
        }
      } catch (err) {
        console.error(`Failed to process ${filePath}:`, err);
      }
    }

    // 删除不再存在的歌曲
    for (const [path, { id }] of existingTracks) {
      if (!scannedPaths.has(path)) {
        db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
        scanState.progress!.removed++;
      }
    }

    // 更新文件夹歌曲计数
    updateFolderCounts(db);

    scanState.status = 'finished';
  } catch (err) {
    console.error('Scan failed:', err);
    scanState.status = 'error';
  } finally {
    scanState.finishedAt = Math.floor(Date.now() / 1000);
  }
}

/**
 * 递归遍历目录，收集音频文件
 * @param dir 目录路径
 * @param files 收集到的文件列表
 */
async function walkDir(dir: string, files: string[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过隐藏文件和目录
      if (entry.name.startsWith('.')) continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath, files);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        // 只收集支持的音频文件
        if (AUDIO_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // 跳过无法访问的目录
  }
}

/**
 * 获取或创建文件夹记录
 * @param db 数据库连接
 * @param filePath 文件路径
 * @param musicRoot 音乐根目录
 * @returns 文件夹 ID
 */
// 文件夹路径 -> ID 缓存，避免重复查询
const folderCache = new Map<string, number>();

async function getOrCreateFolder(
  db: ReturnType<typeof getDb>,
  filePath: string,
  musicRoot: string,
): Promise<number> {
  const relativePath = relative(musicRoot, filePath);
  const parts = relativePath.split(/[/\\]/);
  parts.pop(); // 移除文件名

  let parentId: number | null = null;
  let currentPath = musicRoot;

  // 检查缓存
  const cached = folderCache.get(currentPath);
  if (cached !== undefined) {
    parentId = cached;
  } else {
    // 如果根文件夹不存在，创建 "全部音乐"
    const rootFolder = db.prepare('SELECT id FROM folders WHERE path = ?').get(musicRoot) as { id: number } | undefined;
    if (!rootFolder) {
      const result = db.prepare('INSERT INTO folders (name, path, parent_id, track_count) VALUES (?, ?, ?, 0)').run(
        '全部音乐', musicRoot, null,
      );
      parentId = result.lastInsertRowid as number;
    } else {
      parentId = rootFolder.id;
    }
    folderCache.set(currentPath, parentId);
  }

  // 创建子文件夹
  for (const part of parts) {
    currentPath = join(currentPath, part);

    const cachedId = folderCache.get(currentPath);
    if (cachedId !== undefined) {
      parentId = cachedId;
      continue;
    }

    const folder = db.prepare('SELECT id FROM folders WHERE path = ?').get(currentPath) as { id: number } | undefined;

    if (!folder) {
      const result = db.prepare('INSERT INTO folders (name, path, parent_id, track_count) VALUES (?, ?, ?, 0)').run(
        part, currentPath, parentId,
      );
      parentId = result.lastInsertRowid as number;
    } else {
      parentId = folder.id;
    }
    folderCache.set(currentPath, parentId!);
  }

  return parentId!;
}

/**
 * 更新所有文件夹的歌曲计数
 * @param db 数据库连接
 */
function updateFolderCounts(db: ReturnType<typeof getDb>): void {
  // 批量统计每个文件夹的歌曲数（包括一级子文件夹），单条查询替代 N+1
  const counts = db.prepare(`
    SELECT f.id, COUNT(t.id) as count
    FROM folders f
    LEFT JOIN tracks t ON t.folder_id = f.id OR t.folder_id IN (
      SELECT id FROM folders WHERE parent_id = f.id
    )
    GROUP BY f.id
  `).all() as { id: number; count: number }[];

  const stmt = db.prepare('UPDATE folders SET track_count = ? WHERE id = ?');
  for (const row of counts) {
    stmt.run(row.count, row.id);
  }

  // 根文件夹特殊处理：统计所有歌曲
  const totalCount = (db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number }).count;
  db.prepare('UPDATE folders SET track_count = ? WHERE id = 1').run(totalCount);
}
