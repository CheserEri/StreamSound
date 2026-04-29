/**
 * 元数据服务
 * 提供音频文件元数据提取功能，包括标题、艺术家、专辑、封面、歌词等
 */
import { parseFile } from 'music-metadata';
import { extname } from 'path';
import { MIME_TYPES } from '../types/index.js';
import { syncTextToLRC } from './lyrics.js';

/**
 * 歌曲元数据接口
 */
export interface TrackMetadata {
  title: string;              // 歌曲标题
  artist: string | null;      // 艺术家
  album: string | null;       // 专辑
  duration: number | null;    // 时长（秒）
  bitrate: number | null;     // 比特率（kbps）
  sampleRate: number | null;  // 采样率（Hz）
  mimeType: string | null;    // MIME 类型
  cover: Buffer | null;       // 封面图片
  lyrics: string | null;      // 歌词
}

/**
 * 从音频文件提取元数据
 * @param filePath 音频文件路径
 * @returns 提取的元数据对象
 */
export async function extractMetadata(filePath: string): Promise<TrackMetadata> {
  const ext = extname(filePath).toLowerCase();

  try {
    // 使用 music-metadata 解析文件
    const metadata = await parseFile(filePath, {
      duration: true,
      skipCovers: false,
    });

    const common = metadata.common;
    const format = metadata.format;

    // 提取封面图片
    let cover: Buffer | null = null;
    if (common.picture && common.picture.length > 0) {
      cover = Buffer.from(common.picture[0].data);
    }

    // 提取歌词
    let lyrics: string | null = null;
    if (common.lyrics && common.lyrics.length > 0) {
      const firstLyric = common.lyrics[0];
      if (typeof firstLyric === 'string') {
        lyrics = firstLyric;
      } else if (firstLyric && 'syncText' in firstLyric && Array.isArray((firstLyric as any).syncText)) {
        // 将同步歌词转换为 LRC 格式
        lyrics = syncTextToLRC((firstLyric as any).syncText);
      }
    }

    // 如果标题缺失，从文件名解析
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
    // 如果解析失败，从文件名提取基本信息
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

/**
 * 从文件名解析歌曲标题
 * 支持 "artist - title" 格式
 * @param filePath 文件路径
 * @returns 解析出的标题
 */
function parseTitleFromFilename(filePath: string): string {
  const basename = filePath.split(/[/\\]/).pop() || filePath;
  const name = basename.replace(/\.[^.]+$/, '');

  // 尝试匹配 "artist - title" 格式
  const dashMatch = name.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[2].trim();
  }

  return name;
}

/**
 * 从文件名解析艺术家
 * @param filePath 文件路径
 * @returns 解析出的艺术家名称，如果无法解析返回 null
 */
export function parseArtistFromFilename(filePath: string): string | null {
  const basename = filePath.split(/[/\\]/).pop() || filePath;
  const name = basename.replace(/\.[^.]+$/, '');

  const dashMatch = name.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }

  return null;
}
