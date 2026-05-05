import { useState, useCallback } from 'react';
import api from '../services/api';

interface FavoriteButtonProps {
  trackId: number;
  initialFavorited?: boolean;
  size?: number;
}

export default function FavoriteButton({ trackId, initialFavorited = false, size = 24 }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prev = favorited;
    setFavorited(!prev);

    try {
      if (prev) {
        await api.delete(`/favorites/${trackId}`);
      } else {
        await api.post(`/favorites/${trackId}`);
      }
    } catch {
      // Revert on error
      setFavorited(prev);
    } finally {
      setLoading(false);
    }
  }, [loading, favorited, trackId]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: size * 0.7,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {favorited ? (
        <span style={{ color: 'var(--color-heart-filled)' }}>&#10084;&#65039;</span>
      ) : (
        <span style={{ color: 'var(--color-heart-outline)' }}>&#9825;</span>
      )}
    </button>
  );
}

