/**
 * 类型定义文件
 * 定义数据库行类型、API 数据传输对象和其他类型
 */
import type { FastifyRequest, FastifyReply } from 'fastify';

// ==================== 数据库行类型 ====================

/**
 * 用户表行类型
 */
export interface UserRow {
  id: number;                // 用户 ID
  username: string;          // 用户名
  password: string;          // 加密后的密码
  role: 'user' | 'admin';    // 用户角色
  approved: number;          // 是否通过审核 (0/1)
  created_at: number;        // 创建时间戳
}

/**
 * 文件夹表行类型
 */
export interface FolderRow {
  id: number;                // 文件夹 ID
  name: string;              // 文件夹名称
  path: string;              // 文件系统路径
  parent_id: number | null;  // 父文件夹 ID
  track_count: number;       // 包含的歌曲数量
}

/**
 * 歌曲表行类型
 */
export interface TrackRow {
  id: number;                // 歌曲 ID
  path: string;              // 文件路径
  folder_id: number;         // 所属文件夹 ID
  title: string;             // 歌曲标题
  artist: string | null;     // 艺术家
  album: string | null;      // 专辑
  duration: number | null;   // 时长（秒）
  bitrate: number | null;    // 比特率（kbps）
  sample_rate: number | null;// 采样率（Hz）
  cover_path: string | null; // 封面图片路径
  has_lyrics: number;        // 是否有歌词 (0/1)
  lyrics: string | null;     // 歌词内容
  file_size: number | null;  // 文件大小（字节）
  mime_type: string | null;  // MIME 类型
  scanned_at: number;        // 扫描时间戳
}

/**
 * 收藏表行类型
 */
export interface FavoriteRow {
  user_id: number;           // 用户 ID
  track_id: number;          // 歌曲 ID
  created_at: number;        // 收藏时间戳
}

/**
 * 播放历史表行类型
 */
export interface PlayHistoryRow {
  id: number;                // 记录 ID
  user_id: number;           // 用户 ID
  track_id: number;          // 歌曲 ID
  played_at: number;         // 播放时间戳
}

// ==================== API 数据传输对象 ====================

/**
 * 文件夹响应 DTO
 */
export interface FolderDTO {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  trackCount: number;
}

/**
 * 歌曲列表项 DTO
 */
export interface TrackListItemDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  hasLyrics: boolean;
  folderId: number;
}

/**
 * 歌曲详情 DTO
 */
export interface TrackDetailDTO extends TrackListItemDTO {
  bitrate: number | null;
  sampleRate: number | null;
  mimeType: string | null;
  fileSize: number | null;
  lyrics: string | null;
  isFavorited: boolean;
}

/**
 * 收藏歌曲 DTO
 */
export interface FavoriteTrackDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  favoritedAt: number;
}

/**
 * 播放历史歌曲 DTO
 */
export interface HistoryTrackDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  playedAt: number;
}

/**
 * 用户 DTO
 */
export interface UserDTO {
  id: number;
  username: string;
  role: string;
  approved: boolean;
  createdAt: number;
}

/**
 * 搜索结果歌曲 DTO
 */
export interface SearchTrackDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  highlight: { title?: string; artist?: string; album?: string };
}

/**
 * 搜索结果艺术家 DTO
 */
export interface SearchArtistDTO {
  name: string;
  trackCount: number;
  highlight: { name: string };
}

/**
 * 搜索结果专辑 DTO
 */
export interface SearchAlbumDTO {
  name: string;
  artist: string | null;
  trackCount: number;
  highlight: { name: string };
}

/**
 * 搜索结果 DTO
 */
export interface SearchResultDTO {
  tracks: SearchTrackDTO[];
  artists: SearchArtistDTO[];
  albums: SearchAlbumDTO[];
}

/**
 * 分页信息 DTO
 */
export interface Pagination {
  total: number;   // 总数
  limit: number;   // 每页数量
  offset: number;  // 偏移量
}

// ==================== JWT 相关类型 ====================

/**
 * JWT Payload 类型
 */
export interface JWTPayload {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

// ==================== 扫描状态类型 ====================

/**
 * 扫描状态枚举
 */
export type ScanStatus = 'idle' | 'running' | 'finished' | 'error';

/**
 * 扫描进度接口
 */
export interface ScanProgress {
  scanned: number;  // 已扫描数量
  total: number;    // 总数量
  added: number;    // 新增数量
  updated: number;  // 更新数量
  removed: number;  // 删除数量
}

/**
 * 扫描状态接口
 */
export interface ScanState {
  status: ScanStatus;
  progress: ScanProgress | null;
  startedAt: number | null;
  finishedAt: number | null;
  musicRoot: string | null;
}

// ==================== Fastify 类型扩展 ====================

declare module 'fastify' {
  interface FastifyRequest {
    userId: number;
    userRole: 'user' | 'admin';
  }
}

// ==================== 支持的音频格式 ====================

/**
 * 支持的音频文件扩展名
 */
export const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus',
  '.wav', '.aiff', '.ape', '.wma',
]);

/**
 * 文件扩展名到 MIME 类型的映射
 */
export const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.wav': 'audio/wav',
  '.aiff': 'audio/aiff',
  '.ape': 'audio/ape',
  '.wma': 'audio/x-ms-wma',
};
