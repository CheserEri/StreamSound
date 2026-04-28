import { readdir, stat, writeFile, mkdir } from 'fs/promises';
import { join, extname, relative } from 'path';
import { existsSync } from 'fs';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import { extractMetadata } from './metadata.js';
import { findLRCFile, readLRCFile } from './lyrics.js';
import { AUDIO_EXTENSIONS } from '../types/index.js';
import type { ScanState, ScanProgress } from '../types/index.js';

let scanState: ScanState = {
  status: 'idle',
  progress: null,
  startedAt: null,
  finishedAt: null,
};

export function getScanState(): ScanState {
  return scanState;
}

export async function startScan(): Promise<void> {
  if (scanState.status === 'running') {
    return;
  }

  scanState = {
    status: 'running',
    progress: { scanned: 0, total: 0, added: 0, updated: 0, removed: 0 },
    startedAt: Math.floor(Date.now() / 1000),
    finishedAt: null,
  };

  try {
    const db = getDb();
    const musicRoot = config.MUSIC_ROOT;

    // Collect all audio files
    const files: string[] = [];
    await walkDir(musicRoot, files);

    scanState.progress!.total = files.length;

    // Get existing tracks from DB
    const existingTracks = new Map<string, { id: number; scanned_at: number }>();
    const rows = db.prepare('SELECT id, path, scanned_at FROM tracks').all() as { id: number; path: string; scanned_at: number }[];
    for (const row of rows) {
      existingTracks.set(row.path, { id: row.id, scanned_at: row.scanned_at });
    }

    const scannedPaths = new Set<string>();

    // Process each file
    for (const filePath of files) {
      scannedPaths.add(filePath);
      scanState.progress!.scanned++;

      try {
        const fileStat = await stat(filePath);
        const mtime = Math.floor(fileStat.mtimeMs / 1000);

        const existing = existingTracks.get(filePath);

        if (existing && existing.scanned_at >= mtime) {
          // File hasn't changed, skip
          continue;
        }

        // Extract metadata
        const meta = await extractMetadata(filePath);

        // Find lyrics
        let lyrics = meta.lyrics;
        if (!lyrics) {
          const lrcPath = await findLRCFile(filePath);
          if (lrcPath) {
            lyrics = await readLRCFile(lrcPath);
          }
        }

        // Get or create folder
        const folderId = await getOrCreateFolder(db, filePath, musicRoot);

        const hasLyrics = lyrics ? 1 : 0;
        const now = Math.floor(Date.now() / 1000);

        if (existing) {
          // Update existing track
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
          // Insert new track
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

        // Save cover if exists
        if (meta.cover) {
          const trackRow = existing ? { id: existing.id } : db.prepare('SELECT id FROM tracks WHERE path = ?').get(filePath) as { id: number } | undefined;
          const trackId = trackRow?.id;
          if (trackId) {
            const coverDir = join(process.cwd(), 'data', 'covers');
            await mkdir(coverDir, { recursive: true });
            const coverPath = join(coverDir, `${trackId}.jpg`);
            await writeFile(coverPath, meta.cover);
            db.prepare('UPDATE tracks SET cover_path = ? WHERE id = ?').run(coverPath, trackId);
          }
        }
      } catch (err) {
        console.error(`Failed to process ${filePath}:`, err);
      }
    }

    // Remove tracks that no longer exist
    for (const [path, { id }] of existingTracks) {
      if (!scannedPaths.has(path)) {
        db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
        scanState.progress!.removed++;
      }
    }

    // Update folder track counts
    updateFolderCounts(db);

    scanState.status = 'finished';
  } catch (err) {
    console.error('Scan failed:', err);
    scanState.status = 'error';
  } finally {
    scanState.finishedAt = Math.floor(Date.now() / 1000);
  }
}

async function walkDir(dir: string, files: string[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath, files);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (AUDIO_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // Skip inaccessible directories
  }
}

async function getOrCreateFolder(
  db: ReturnType<typeof getDb>,
  filePath: string,
  musicRoot: string,
): Promise<number> {
  const relativePath = relative(musicRoot, filePath);
  const parts = relativePath.split(/[/\\]/);
  parts.pop(); // Remove filename

  let parentId: number | null = null;
  let currentPath = musicRoot;

  // Create "全部音乐" root folder if not exists
  const rootFolder = db.prepare('SELECT id FROM folders WHERE path = ?').get(musicRoot) as { id: number } | undefined;
  if (!rootFolder) {
    const result = db.prepare('INSERT INTO folders (name, path, parent_id, track_count) VALUES (?, ?, ?, 0)').run(
      '全部音乐', musicRoot, null,
    );
    parentId = result.lastInsertRowid as number;
  } else {
    parentId = rootFolder.id;
  }

  // Create subfolders
  for (const part of parts) {
    currentPath = join(currentPath, part);
    const folder = db.prepare('SELECT id FROM folders WHERE path = ?').get(currentPath) as { id: number } | undefined;

    if (!folder) {
      const result = db.prepare('INSERT INTO folders (name, path, parent_id, track_count) VALUES (?, ?, ?, 0)').run(
        part, currentPath, parentId,
      );
      parentId = result.lastInsertRowid as number;
    } else {
      parentId = folder.id;
    }
  }

  return parentId!;
}

function updateFolderCounts(db: ReturnType<typeof getDb>): void {
  const folders = db.prepare('SELECT id FROM folders').all() as { id: number }[];

  for (const folder of folders) {
    if (folder.id === 1) {
      // Root folder: count all tracks
      const count = db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number };
      db.prepare('UPDATE folders SET track_count = ? WHERE id = ?').run(count.count, folder.id);
    } else {
      // Count tracks in this folder and subfolders
      const count = db.prepare(`
        SELECT COUNT(*) as count FROM tracks
        WHERE folder_id = ? OR folder_id IN (
          SELECT id FROM folders WHERE parent_id = ?
        )
      `).get(folder.id, folder.id) as { count: number };
      db.prepare('UPDATE folders SET track_count = ? WHERE id = ?').run(count.count, folder.id);
    }
  }
}
