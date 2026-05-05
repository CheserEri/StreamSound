import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePlayerStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { formatDuration, getCoverUrl } from '../utils/format';
import type { TrackListItem, PaginatedResponse } from '../types';

type SortKey = 'title' | 'artist' | 'duration';

export default function FolderPage() {
  const { folderId, folderName } = useParams<{ folderId: string; folderName: string }>();
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => {
    const idx = s.currentIndex;
    return idx >= 0 && idx < s.queue.length ? s.queue[idx].id : -1;
  });

  const [tracks, setTracks] = useState<TrackListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const limit = 50;
  const scrollRef = useRef<HTMLDivElement>(null);

  const decodedName = folderName ? decodeURIComponent(folderName) : '文件夹';

  const fetchTracks = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      setError('');
      try {
        const res = await api.get<PaginatedResponse<TrackListItem>>(
          `/library/folders/${folderId}/tracks`,
          { params: { limit, offset: offsetRef.current, sort: sortKey } }
        );
        const newTracks = res.data.data ?? [];
        const pagination = res.data.pagination;
        if (reset) {
          setTracks(newTracks);
        } else {
          setTracks((prev) => [...prev, ...newTracks]);
        }
        offsetRef.current = pagination.offset + newTracks.length;
        setHasMore(offsetRef.current < pagination.total);
      } catch {
        if (reset) setError('加载失败，请重试');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [folderId, sortKey]
  );

  useEffect(() => {
    fetchTracks(true);
  }, [fetchTracks]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (
        !loadingMore &&
        hasMore &&
        el.scrollHeight - el.scrollTop - el.clientHeight < 200
      ) {
        fetchTracks(false);
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, fetchTracks]);

  const handleSortChange = (key: SortKey) => {
    setSortKey(key);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks, 0);
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
    }
  };

  const handleTrackClick = (index: number) => {
    setQueue(tracks, index);
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'title', label: '标题' },
    { key: 'artist', label: '艺术家' },
    { key: 'duration', label: '时长' },
  ];

  return (
    <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {decodedName}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: colors.textSecondary }}>
            {tracks.length > 0 || loading ? `${tracks.length} 首歌曲` : ''}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {!loading && !error && tracks.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <button className="btn btn-primary" onClick={handlePlayAll}>
            ▶ 全部播放
          </button>
          <button className="btn btn-secondary" onClick={handleShufflePlay}>
            🔀 随机播放
          </button>
        </div>
      )}

      {/* Sort Options */}
      {!loading && !error && tracks.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              className={`btn btn-sm ${sortKey === opt.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleSortChange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
              }}
            >
              <div
                className="skeleton"
                style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
              <div
                className="skeleton"
                style={{ width: 40, height: 14, borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.5 }}>🎵</div>
          <p style={{ color: colors.textSecondary, marginBottom: 'var(--space-4)' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => fetchTracks(true)}>
            重试
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tracks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.5 }}>🎵</div>
          <p style={{ color: colors.textSecondary }}>此文件夹暂无歌曲</p>
        </div>
      )}

      {/* Track List */}
      {!loading && tracks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tracks.map((track, index) => {
            const isPlaying = track.id === currentTrackId;
            return (
              <div
                key={track.id}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                  background: isPlaying ? colors.activeBg : 'transparent',
                }}
                onClick={() => handleTrackClick(index)}
                onMouseEnter={(e) => {
                  if (!isPlaying)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  if (!isPlaying)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTrackClick(index);
                }}
              >
                {/* Cover */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: colors.placeholder,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: colors.placeholderIcon,
                  }}
                >
                  {track.hasCover ? (
                    <img
                      src={getCoverUrl(track.id)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    '♫'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: isPlaying ? 600 : 500,
                      color: isPlaying ? colors.activeText : colors.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: colors.textSecondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 1,
                    }}
                  >
                    {track.artist || '未知艺术家'}
                  </div>
                </div>

                {/* Duration */}
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: colors.textMuted,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {formatDuration(track.duration)}
                </div>
              </div>
            );
          })}

          {/* Load More Indicator */}
          {loadingMore && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-4)',
                color: colors.textMuted,
                fontSize: 'var(--text-sm)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                  marginRight: 'var(--space-2)',
                }}
              >
                ↻
              </span>
              加载更多...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
