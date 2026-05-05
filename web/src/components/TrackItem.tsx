import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TrackListItem } from '../types';
import { formatDuration } from '../utils/format';
import CoverImage from './CoverImage';

interface TrackItemProps {
  track: TrackListItem;
  isActive?: boolean;
  index?: number;
  onPlay: () => void;
  showIndex?: boolean;
}

export default function TrackItem({ track, isActive, index, onPlay, showIndex }: TrackItemProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    onPlay();
  }, [onPlay]);

  const handleInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/player`);
  }, [navigate]);

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'background-color var(--transition-fast)',
        borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
        background: isActive ? 'var(--color-active-bg)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Index or playing indicator */}
      {showIndex && (
        <span
          style={{
            width: 28,
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {isActive ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <span style={{ width: 3, height: 10, background: 'var(--color-accent)', borderRadius: 1, display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ width: 3, height: 14, background: 'var(--color-accent)', borderRadius: 1, display: 'inline-block', animation: 'pulse 1s ease-in-out infinite 0.2s' }} />
              <span style={{ width: 3, height: 8, background: 'var(--color-accent)', borderRadius: 1, display: 'inline-block', animation: 'pulse 1s ease-in-out infinite 0.4s' }} />
            </span>
          ) : (
            index != null ? index + 1 : ''
          )}
        </span>
      )}

      {/* Cover */}
      <CoverImage trackId={track.id} hasCover={track.hasCover} size={40} borderRadius="var(--radius-sm)" />

      {/* Info */}
      <div
        onClick={handleInfoClick}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {track.title}
        </span>
        {track.artist && (
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {track.artist}
          </span>
        )}
      </div>

      {/* Duration */}
      <span
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {formatDuration(track.duration)}
      </span>
    </div>
  );
}

