import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store';
import { formatProgress } from '../utils/format';
import { getCoverUrl } from '../utils/format';
import { getString, STORAGE_KEYS } from '../services/api';
import { useState } from 'react';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const skipToNext = usePlayerStore((s) => s.skipToNext);

  const [coverError, setCoverError] = useState(false);

  const currentTrack = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < queue.length) {
      return queue[currentIndex];
    }
    return null;
  }, [queue, currentIndex]);

  const hasTrack = queue.length > 0 && currentIndex >= 0;

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min((progress / duration) * 100, 100);
  }, [progress, duration]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleInfoClick = useCallback(() => {
    navigate('/player');
  }, [navigate]);

  if (!hasTrack || !currentTrack) return null;

  const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
  const coverSrc = currentTrack.hasCover && !coverError
    ? `${getCoverUrl(currentTrack.id)}?token=${encodeURIComponent(token || '')}`
    : null;

  return (
    <div className="mini-player-bar">
      {/* Progress bar at top */}
      <div className="mini-player-progress">
        <div
          className="mini-player-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Track info - clickable */}
      <div className="mini-player-info" onClick={handleInfoClick} style={{ cursor: 'pointer' }}>
        {coverSrc ? (
          <img
            className="mini-player-cover"
            src={coverSrc}
            alt=""
            onError={() => setCoverError(true)}
          />
        ) : (
          <div
            className="mini-player-cover"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-placeholder-icon)',
              fontSize: 20,
            }}
          >
            &#9835;
          </div>
        )}
        <div className="mini-player-meta">
          <div className="mini-player-title">{currentTrack.title}</div>
          <div className="mini-player-artist">{currentTrack.artist || 'Unknown Artist'}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mini-player-controls">
        <button className="mini-player-btn play-pause" onClick={handlePlayPause}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button className="mini-player-btn" onClick={skipToNext}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4z" />
            <rect x="17" y="4" width="2" height="16" rx="1" />
          </svg>
        </button>
      </div>

      {/* Time display */}
      <div className="mini-player-time">
        {formatProgress(progress)} / {formatProgress(duration)}
      </div>
    </div>
  );
}
