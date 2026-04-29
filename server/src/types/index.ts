import type { FastifyRequest, FastifyReply } from 'fastify';

// ==================== Database Row Types ====================

export interface UserRow {
  id: number;
  username: string;
  password: string;
  role: 'user' | 'admin';
  approved: number;
  created_at: number;
}

export interface FolderRow {
  id: number;
  name: string;
  path: string;
  parent_id: number | null;
  track_count: number;
}

export interface TrackRow {
  id: number;
  path: string;
  folder_id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  bitrate: number | null;
  sample_rate: number | null;
  cover_path: string | null;
  has_lyrics: number;
  lyrics: string | null;
  file_size: number | null;
  mime_type: string | null;
  scanned_at: number;
}

export interface FavoriteRow {
  user_id: number;
  track_id: number;
  created_at: number;
}

export interface PlayHistoryRow {
  id: number;
  user_id: number;
  track_id: number;
  played_at: number;
}

// ==================== API DTOs ====================

export interface FolderDTO {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  trackCount: number;
}

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

export interface TrackDetailDTO extends TrackListItemDTO {
  bitrate: number | null;
  sampleRate: number | null;
  mimeType: string | null;
  fileSize: number | null;
  lyrics: string | null;
  isFavorited: boolean;
}

export interface FavoriteTrackDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  favoritedAt: number;
}

export interface HistoryTrackDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  playedAt: number;
}

export interface UserDTO {
  id: number;
  username: string;
  role: string;
  approved: boolean;
  createdAt: number;
}

export interface SearchTrackDTO {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  highlight: { title?: string; artist?: string; album?: string };
}

export interface SearchArtistDTO {
  name: string;
  trackCount: number;
  highlight: { name: string };
}

export interface SearchAlbumDTO {
  name: string;
  artist: string | null;
  trackCount: number;
  highlight: { name: string };
}

export interface SearchResultDTO {
  tracks: SearchTrackDTO[];
  artists: SearchArtistDTO[];
  albums: SearchAlbumDTO[];
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

// ==================== JWT ====================

export interface JWTPayload {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

// ==================== Scan State ====================

export type ScanStatus = 'idle' | 'running' | 'finished' | 'error';

export interface ScanProgress {
  scanned: number;
  total: number;
  added: number;
  updated: number;
  removed: number;
}

export interface ScanState {
  status: ScanStatus;
  progress: ScanProgress | null;
  startedAt: number | null;
  finishedAt: number | null;
  musicRoot: string | null;
}

// ==================== Fastify Augmentation ====================

declare module 'fastify' {
  interface FastifyRequest {
    userId: number;
    userRole: 'user' | 'admin';
  }
}

// ==================== Supported Audio Formats ====================

export const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus',
  '.wav', '.aiff', '.ape', '.wma',
]);

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
