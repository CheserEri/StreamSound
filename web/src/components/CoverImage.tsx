import { useState } from 'react';
import { getCoverUrl } from '../utils/format';
import { getString, STORAGE_KEYS } from '../services/api';

interface CoverImageProps {
  trackId: number;
  hasCover: boolean;
  size?: number;
  borderRadius?: string;
}

export default function CoverImage({ trackId, hasCover, size = 48, borderRadius = '8px' }: CoverImageProps) {
  const [error, setError] = useState(false);

  if (!hasCover || error) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          background: 'var(--color-placeholder)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--color-placeholder-icon)',
          fontSize: size * 0.4,
        }}
      >
        <span>&#9835;</span>
      </div>
    );
  }

  const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
  const src = `${getCoverUrl(trackId)}?token=${encodeURIComponent(token || '')}`;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setError(true)}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        flexShrink: 0,
        background: 'var(--color-placeholder)',
      }}
    />
  );
}
