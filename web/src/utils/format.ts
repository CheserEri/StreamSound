import { getServerUrl } from '../services/api';

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatProgress(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return date.toLocaleDateString('zh-CN');
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getModeLabel(mode: 'sequential' | 'shuffle' | 'repeat'): string {
  switch (mode) {
    case 'shuffle': return '随机播放';
    case 'repeat': return '单曲循环';
    default: return '顺序播放';
  }
}

export function getModeIcon(mode: 'sequential' | 'shuffle' | 'repeat'): string {
  switch (mode) {
    case 'shuffle': return '🔀';
    case 'repeat': return '🔁';
    default: return '➡️';
  }
}

export function getCoverUrl(trackId: number): string {
  return `${getServerUrl()}/covers/${trackId}`;
}

export function getStreamUrl(trackId: number): string {
  return `${getServerUrl()}/stream/${trackId}`;
}