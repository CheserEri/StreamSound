import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePlayerStore } from '../store';
import { formatProgress, formatDuration, getModeLabel, getCoverUrl } from '../utils/format';
import type { TrackDetail } from '../types';

export default function PlayerPage() {
  const navigate = useNavigate();

  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const mode = usePlayerStore((s) => s.mode);
  const volume = usePlayerStore((s) => s.volume);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const skipToNext = usePlayerStore((s) => s.skipToNext);
  const skipToPrevious = usePlayerStore((s) => s.skipToPrevious);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const toggleMode = usePlayerStore((s) => s.toggleMode);
  const setVolume = usePlayerStore((s) => s.setVolume);

  const [showLyrics, setShowLyrics] = useState(false);
  const [trackDetail, setTrackDetail] = useState<TrackDetail | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;
  const trackId = currentTrack?.id;

  // Fetch track detail for lyrics & favorite status
  useEffect(() => {
    if (!trackId) {
      setTrackDetail(null);
      return;
    }
    let cancelled = false;
    api
      .get<{ data: TrackDetail }>(`/library/tracks/${trackId}`)
      .then((res: any) => {
        if (!cancelled) setTrackDetail(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setTrackDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  // Progress bar click / drag
  const handleProgressInteraction = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = ratio * duration;
      setSeekValue(newTime);
      return newTime;
    },
    [duration]
  );

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsSeeking(true);
    const newTime = handleProgressInteraction(e.clientX);
    if (newTime !== undefined) seekTo(newTime);
  };

  useEffect(() => {
    if (!isSeeking) return;
    const handleMove = (e: MouseEvent) => {
      const newTime = handleProgressInteraction(e.clientX);
      if (newTime !== undefined) seekTo(newTime);
    };
    const handleUp = () => setIsSeeking(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isSeeking, handleProgressInteraction, seekTo]);

  // Volume bar click / drag
  const handleVolumeInteraction = useCallback((clientX: number) => {
    const bar = volumeRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(ratio);
  }, [setVolume]);

  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    handleVolumeInteraction(e.clientX);
    const handleMove = (ev: MouseEvent) => handleVolumeInteraction(ev.clientX);
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const displayProgress = isSeeking ? seekValue : progress;
  const progressPercent = duration > 0 ? (displayProgress / duration) * 100 : 0;
  const volumePercent = volume * 100;

  const lyrics = trackDetail?.lyrics ?? null;

  return (
    <div className="player-overlay">
      {/* Header */}
      <div className="player-header">
        <button
          className="player-btn"
          onClick={() => navigate(-1)}
          aria-label="返回"
          style={{ fontSize: 22 }}
        >
          ‹
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 'var(--text-xs)', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            正在播放
          </div>
        </div>
        <div style={{ width: 44 }} />
      </div>

      {/* Content */}
      <div
        className="player-content"
        style={showLyrics ? { justifyContent: 'flex-start', paddingTop: 'var(--space-4)' } : {}}
      >
        {/* Cover Art */}
        {!showLyrics && (
          <div className="animate-scale-in">
            {currentTrack?.hasCover ? (
              <img
                className="player-cover"
                src={getCoverUrl(currentTrack.id)}
                alt={currentTrack.title}
              />
            ) : (
              <div
                className="player-cover"
                style={{
                  background: '#1c1c1e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                  color: '#48484a',
                }}
              >
                ♫
              </div>
            )}
          </div>
        )}

        {/* Track Info */}
        <div className="player-info">
          <div className="player-title">{currentTrack?.title ?? '未在播放'}</div>
          <div className="player-artist">{currentTrack?.artist ?? '--'}</div>
        </div>

        {/* Progress */}
        <div className="player-controls">
          <div className="player-progress">
            <span className="player-progress-time">{formatProgress(displayProgress)}</span>
            <div
              className="player-progress-bar"
              ref={progressRef}
              onMouseDown={handleProgressMouseDown}
              role="slider"
              aria-label="播放进度"
              aria-valuenow={Math.floor(displayProgress)}
              aria-valuemax={Math.floor(duration) || 0}
            >
              <div
                className="player-progress-fill"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="player-progress-thumb" />
              </div>
            </div>
            <span className="player-progress-time">{formatDuration(duration || null)}</span>
          </div>

          {/* Main Controls */}
          <div className="player-buttons">
            <button
              className={`player-btn ${mode === 'shuffle' ? 'active' : ''}`}
              onClick={toggleMode}
              aria-label={getModeLabel(mode)}
              title={getModeLabel(mode)}
            >
              {mode === 'shuffle' ? '🔀' : '➡️'}
            </button>
            <button className="player-btn" onClick={skipToPrevious} aria-label="上一首">
              ⏮
            </button>
            <button
              className="player-btn player-btn-main"
              onClick={isPlaying ? pause : play}
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="player-btn" onClick={skipToNext} aria-label="下一首">
              ⏭
            </button>
            <button
              className={`player-btn ${mode === 'repeat' ? 'active' : ''}`}
              onClick={toggleMode}
              aria-label={getModeLabel(mode)}
              title={getModeLabel(mode)}
            >
              {mode === 'repeat' ? '🔁' : '➡️'}
            </button>
          </div>

          {/* Extra Controls */}
          <div className="player-extra-controls">
            {/* Volume (desktop only) */}
            <div className="player-volume-control">
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 14, cursor: 'pointer' }}>
                  {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </span>
                <div
                  ref={volumeRef}
                  style={{
                    width: 100,
                    height: 4,
                    background: '#48484a',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseDown={handleVolumeMouseDown}
                  role="slider"
                  aria-label="音量"
                  aria-valuenow={Math.floor(volume * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#fc3c44',
                      borderRadius: 'var(--radius-full)',
                      width: `${volumePercent}%`,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: -6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 12,
                        height: 12,
                        background: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }}
                    />
                  </div>
                </div>
              </span>
            </div>

            {/* Lyrics Toggle */}
            <button
              className={`player-extra-btn ${showLyrics ? 'active' : ''}`}
              onClick={() => setShowLyrics(!showLyrics)}
              aria-label="歌词"
              title="歌词"
              style={{ fontSize: 18 }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Lyrics View */}
        {showLyrics && (
          <div
            className="lyrics-container animate-fade-in"
            style={{ marginTop: 'var(--space-4)', maxHeight: '30vh' }}
          >
            {lyrics ? (
              lyrics.split('\n').map((line, i) => (
                <div key={i} className="lyrics-line">
                  {line || '\u00A0'}
                </div>
              ))
            ) : (
              <div className="lyrics-empty">
                <div className="lyrics-empty-icon">♪</div>
                <div className="lyrics-empty-text">暂无歌词</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scoped styles for volume control responsive behavior */}
      <style>{`
        .player-volume-control {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          width: auto;
          padding: 0 var(--space-2);
        }
        @media (max-width: 768px) {
          .player-volume-control {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
