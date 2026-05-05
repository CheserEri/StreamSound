import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { usePlayerStore, useSettingsStore, useAuthStore } from '../store';
import { getColors } from '../theme/colors';
import { formatDuration, formatRelativeTime } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import TrackItem from '../components/TrackItem';
import type { FavoriteTrack, TrackListItem } from '../types';

export default function FavoritesPage() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/favorites', { params: { limit: 100 } });
      setFavorites(response.data.data ?? []);
    } catch {
      setError('加载收藏失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handlePlay = useCallback(
    (index: number) => {
      const tracks: TrackListItem[] = favorites.map((f) => ({
        id: f.id,
        title: f.title,
        artist: f.artist,
        album: f.album,
        duration: f.duration,
        hasCover: f.hasCover,
        hasLyrics: false,
        folderId: 0,
      }));
      setQueue(tracks, index);
    },
    [favorites, setQueue],
  );

  const handleRemove = useCallback(
    async (e: React.MouseEvent, trackId: number) => {
      e.stopPropagation();
      setRemovingId(trackId);
      try {
        await api.delete(`/favorites/${trackId}`);
        setFavorites((prev) => prev.filter((t) => t.id !== trackId));
      } catch {
        // silently fail or show toast
      } finally {
        setRemovingId(null);
      }
    },
    [],
  );

  const currentTrackId = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex].id : null;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h2 className="section-title">我的收藏</h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={fetchFavorites}
          disabled={loading}
          style={{ gap: 'var(--space-1)' }}
        >
          <span
            style={{
              display: 'inline-block',
              animation: loading ? 'spin 0.8s linear infinite' : 'none',
            }}
          >
            ↻
          </span>
          刷新
        </button>
      </div>

      {/* Content */}
      {loading && favorites.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-12) 0',
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      ) : error && favorites.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.5 }}>
            &#x2764;&#xFE0F;
          </div>
          <p style={{ color: colors.textSecondary, marginBottom: 'var(--space-4)' }}>{error}</p>
          <button className="btn btn-secondary" onClick={fetchFavorites}>
            重试
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState icon="&#x2764;&#xFE0F;" title="暂无收藏" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {favorites.map((track, index) => {
            const trackListItem: TrackListItem = {
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              duration: track.duration,
              hasCover: track.hasCover,
              hasLyrics: false,
              folderId: 0,
            };

            return (
              <div
                key={track.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${index * 30}ms`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TrackItem
                    track={trackListItem}
                    isActive={track.id === currentTrackId}
                    index={index}
                    onPlay={() => handlePlay(index)}
                    showIndex
                  />
                </div>

                {/* Favorited time */}
                <span
                  style={{
                    fontSize: 'var(--text-xs, 12px)',
                    color: colors.textMuted,
                    flexShrink: 0,
                    marginRight: 'var(--space-1)',
                  }}
                >
                  {formatRelativeTime(track.favoritedAt)}
                </span>

                {/* Delete button */}
                <button
                  onClick={(e) => handleRemove(e, track.id)}
                  disabled={removingId === track.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-sm)',
                    color: removingId === track.id ? colors.textMuted : colors.textMuted,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color var(--transition-fast)',
                    opacity: removingId === track.id ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = colors.error;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted;
                  }}
                  title="取消收藏"
                >
                  {removingId === track.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span>&#x2715;</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
