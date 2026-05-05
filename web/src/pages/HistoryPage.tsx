import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { usePlayerStore, useSettingsStore, useAuthStore } from '../store';
import { getColors } from '../theme/colors';
import { formatDuration, formatRelativeTime } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import TrackItem from '../components/TrackItem';
import type { HistoryTrack, TrackListItem } from '../types';

export default function HistoryPage() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const [history, setHistory] = useState<HistoryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/history', { params: { limit: 50 } });
      setHistory(response.data.data ?? []);
    } catch {
      setError('加载播放记录失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePlay = useCallback(
    (index: number) => {
      const tracks: TrackListItem[] = history.map((h) => ({
        id: h.id,
        title: h.title,
        artist: h.artist,
        album: h.album,
        duration: h.duration,
        hasCover: h.hasCover,
        hasLyrics: false,
        folderId: 0,
      }));
      setQueue(tracks, index);
    },
    [history, setQueue],
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
        <h2 className="section-title">最近播放</h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={fetchHistory}
          disabled={loading}
          style={{ gap: 'var(--space-1)' }}
        >
          <span
            style={{
              display: 'inline-block',
              animation: loading ? 'spin 0.8s linear infinite' : 'none',
            }}
          >
            &#x21BB;
          </span>
          刷新
        </button>
      </div>

      {/* Content */}
      {loading && history.length === 0 ? (
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
      ) : error && history.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.5 }}>
            &#x1F550;
          </div>
          <p style={{ color: colors.textSecondary, marginBottom: 'var(--space-4)' }}>{error}</p>
          <button className="btn btn-secondary" onClick={fetchHistory}>
            重试
          </button>
        </div>
      ) : history.length === 0 ? (
        <EmptyState icon="&#x1F550;" title="暂无播放记录" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {history.map((track, index) => {
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
                key={`${track.id}-${track.playedAt}`}
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

                {/* Played time */}
                <span
                  style={{
                    fontSize: 'var(--text-xs, 12px)',
                    color: colors.textMuted,
                    flexShrink: 0,
                  }}
                >
                  {formatRelativeTime(track.playedAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
