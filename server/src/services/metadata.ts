import { parseFile } from 'music-metadata';
import { extname } from 'path';
import { MIME_TYPES } from '../types/index.js';
import { syncTextToLRC } from './lyrics.js';

export interface TrackMetadata {
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  bitrate: number | null;
  sampleRate: number | null;
  mimeType: string | null;
  cover: Buffer | null;
  lyrics: string | null;
}

export async function extractMetadata(filePath: string): Promise<TrackMetadata> {
  const ext = extname(filePath).toLowerCase();

  try {
    const metadata = await parseFile(filePath, {
      duration: true,
      skipCovers: false,
    });

    const common = metadata.common;
    const format = metadata.format;

    // Extract cover
    let cover: Buffer | null = null;
    if (common.picture && common.picture.length > 0) {
      cover = Buffer.from(common.picture[0].data);
    }

    // Extract lyrics
    let lyrics: string | null = null;
    if (common.lyrics && common.lyrics.length > 0) {
      const firstLyric = common.lyrics[0];
      if (typeof firstLyric === 'string') {
        lyrics = firstLyric;
      } else if (firstLyric && 'syncText' in firstLyric && Array.isArray((firstLyric as any).syncText)) {
        lyrics = syncTextToLRC((firstLyric as any).syncText);
      }
    }

    // Parse title from filename if missing
    let title = common.title || null;
    if (!title) {
      title = parseTitleFromFilename(filePath);
    }

    return {
      title: title || 'Unknown',
      artist: common.artist || null,
      album: common.album || null,
      duration: format.duration ? Math.round(format.duration) : null,
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      sampleRate: format.sampleRate || null,
      mimeType: MIME_TYPES[ext] || 'audio/mpeg',
      cover,
      lyrics,
    };
  } catch {
    // Fallback: parse from filename
    return {
      title: parseTitleFromFilename(filePath),
      artist: null,
      album: null,
      duration: null,
      bitrate: null,
      sampleRate: null,
      mimeType: MIME_TYPES[ext] || 'audio/mpeg',
      cover: null,
      lyrics: null,
    };
  }
}

function parseTitleFromFilename(filePath: string): string {
  const basename = filePath.split(/[/\\]/).pop() || filePath;
  const name = basename.replace(/\.[^.]+$/, '');

  // Try "artist - title" format
  const dashMatch = name.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[2].trim();
  }

  return name;
}

export function parseArtistFromFilename(filePath: string): string | null {
  const basename = filePath.split(/[/\\]/).pop() || filePath;
  const name = basename.replace(/\.[^.]+$/, '');

  const dashMatch = name.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }

  return null;
}
