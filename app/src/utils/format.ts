/**
 * 格式化工具函数
 */

/**
 * 格式化时长（秒 -> m:ss）
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化播放进度时长（秒 -> m:ss，用于进度条显示）
 */
export function formatProgress(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化相对时间（时间戳 -> 今天/昨天/N天前/日期）
 */
export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return date.toLocaleDateString();
}

/**
 * 获取播放模式图标
 */
export function getModeIcon(mode: 'sequential' | 'shuffle' | 'repeat'): string {
  switch (mode) {
    case 'shuffle':
      return '🔀';
    case 'repeat':
      return '🔁';
    default:
      return '➡️';
  }
}

/**
 * 获取播放模式标签
 */
export function getModeLabel(mode: 'sequential' | 'shuffle' | 'repeat'): string {
  switch (mode) {
    case 'shuffle':
      return '随机播放';
    case 'repeat':
      return '单曲循环';
    default:
      return '顺序播放';
  }
}
