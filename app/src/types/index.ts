// ==================== User ====================

export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

// ==================== Library ====================

export interface Folder {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  trackCount: number;
}

export interface TrackListItem {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  hasLyrics: boolean;
  folderId: number;
}

export interface TrackDetail extends TrackListItem {
  bitrate: number | null;
  sampleRate: number | null;
  mimeType: string | null;
  fileSize: number | null;
  lyrics: string | null;
  isFavorited: boolean;
  coverDominantColor: string | null;
}

// ==================== Favorites ====================

export interface FavoriteTrack {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  favoritedAt: number;
}

// ==================== History ====================

export interface HistoryTrack {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  playedAt: number;
}

// ==================== Search ====================

export interface SearchResult {
  tracks: SearchTrack[];
  artists: SearchArtist[];
  albums: SearchAlbum[];
}

export interface SearchTrack {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  hasCover: boolean;
  highlight: { title?: string; artist?: string; album?: string };
}

export interface SearchArtist {
  name: string;
  trackCount: number;
  highlight: { name: string };
}

export interface SearchAlbum {
  name: string;
  artist: string | null;
  trackCount: number;
  highlight: { name: string };
}

// ==================== Pagination ====================

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

// ==================== API Response ====================

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    detail: string;
  };
}

// ==================== Navigation ====================

export type RootStackParamList = {
  Login: undefined;
  Library: undefined;
  Folder: { folderId: number; folderName: string };
  Player: undefined;
  Queue: undefined;
  Search: undefined;
  Favorites: undefined;
  History: undefined;
  Settings: undefined;
  Admin: undefined;
};

// ==================== Player ====================

export type PlayMode = 'sequential' | 'shuffle' | 'repeat';

// ==================== Settings ====================

export type LyricsSize = 'sm' | 'md' | 'lg';
export type Theme = 'light' | 'dark';
