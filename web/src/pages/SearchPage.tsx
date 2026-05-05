import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePlayerStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { formatDuration } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CoverImage from '../components/CoverImage';
import SearchHighlight from '../components/SearchHighlight';
import type { SearchResult, TrackListItem, SearchTrack, SearchArtist, SearchAlbum } from '../types';

export default function SearchPage() {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (!q.trim()) {
      setResults(null);
      setSearched(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await api.get('/search', {
        params: { q: q.trim(), limit: 20 },
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setResults(res.data);
        setSearched(true);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        setResults(null);
        setSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        doSearch(value);
      }, 300);
    },
    [doSearch],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults(null);
    setSearched(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
    inputRef.current?.focus();
  }, []);

  const playTrack = useCallback(
    (track: SearchTrack, index: number) => {
      if (!results) return;
      const queueItems: TrackListItem[] = results.tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        hasCover: t.hasCover,
        hasLyrics: false,
        folderId: 0,
      }));
      setQueue(queueItems, index);
    },
    [results, setQueue],
  );

  const playArtistTracks = useCallback(
    (artist: SearchArtist) => {
      if (!results) return;
      const artistTracks = results.tracks.filter(
        (t) => t.artist?.toLowerCase() === artist.name.toLowerCase(),
      );
      if (artistTracks.length === 0) return;
      const queueItems: TrackListItem[] = artistTracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        hasCover: t.hasCover,
        hasLyrics: false,
        folderId: 0,
      }));
      setQueue(queueItems, 0);
    },
    [results, setQueue],
  );

  const playAlbumTracks = useCallback(
    (album: SearchAlbum) => {
      if (!results) return;
      const albumTracks = results.tracks.filter(
        (t) => t.album?.toLowerCase() === album.name.toLowerCase(),
      );
      if (albumTracks.length === 0) return;
      const queueItems: TrackListItem[] = albumTracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        hasCover: t.hasCover,
        hasLyrics: false,
        folderId: 0,
      }));
      setQueue(queueItems, 0);
    },
    [results, setQueue],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const hasResults =
    results &&
    (results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0);

  return (
    <div>
      {/* Search Input */}
      <section className="section">
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 'var(--space-4)',
              color: colors.textMuted,
              fontSize: 18,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            &#128269;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="搜索歌曲、艺术家、专辑..."
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-10) var(--space-3) var(--space-10)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-base)',
              color: colors.text,
              backgroundColor: colors.surfaceAlt,
              transition: 'background-color var(--transition-fast)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceHover;
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceAlt;
            }}
          />
          {query && (
            <button
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: 'var(--space-4)',
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                fontSize: 18,
                cursor: 'pointer',
                padding: 'var(--space-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              &#10005;
            </button>
          )}
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--space-12) 0',
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty States */}
      {!loading && !searched && (
        <EmptyState icon="&#128269;" title="输入关键词开始搜索" />
      )}

      {!loading && searched && !hasResults && (
        <EmptyState icon="&#128533;" title="未找到相关结果" description="试试其他关键词" />
      )}

      {/* Results */}
      {!loading && hasResults && results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Songs */}
          {results.tracks.length > 0 && (
            <section className="section">
              <h2
                className="section-title"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: colors.text,
                  marginBottom: 'var(--space-3)',
                }}
              >
                歌曲
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {results.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="animate-slide-up"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                      background: 'transparent',
                    }}
                    onClick={() => playTrack(track, index)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') playTrack(track, index);
                    }}
                  >
                    <CoverImage
                      trackId={track.id}
                      hasCover={track.hasCover}
                      size={40}
                      borderRadius="var(--radius-sm)"
                    />
                    <div
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
                          fontWeight: 'var(--font-medium)',
                          color: colors.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <SearchHighlight text={track.highlight?.title ?? track.title} />
                      </span>
                      {track.artist && (
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: colors.textSecondary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <SearchHighlight text={track.highlight?.artist ?? track.artist} />
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: colors.textMuted,
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <section className="section">
              <h2
                className="section-title"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: colors.text,
                  marginBottom: 'var(--space-3)',
                }}
              >
                艺术家
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {results.artists.map((artist, index) => (
                  <div
                    key={artist.name}
                    className="animate-slide-up"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                      background: 'transparent',
                    }}
                    onClick={() => playArtistTracks(artist)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') playArtistTracks(artist);
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-lg)',
                        fontWeight: 'var(--font-semibold)',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {artist.name.charAt(0).toUpperCase()}
                    </div>
                    <div
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
                          fontWeight: 'var(--font-medium)',
                          color: colors.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <SearchHighlight text={artist.highlight?.name ?? artist.name} />
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: colors.textSecondary,
                        }}
                      >
                        {artist.trackCount} 首歌曲
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {results.albums.length > 0 && (
            <section className="section">
              <h2
                className="section-title"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: colors.text,
                  marginBottom: 'var(--space-3)',
                }}
              >
                专辑
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {results.albums.map((album, index) => (
                  <div
                    key={album.name}
                    className="animate-slide-up"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                      background: 'transparent',
                    }}
                    onClick={() => playAlbumTracks(album)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') playAlbumTracks(album);
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-sm)',
                        background: colors.surfaceAlt,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      &#127925;
                    </div>
                    <div
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
                          fontWeight: 'var(--font-medium)',
                          color: colors.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <SearchHighlight text={album.highlight?.name ?? album.name} />
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: colors.textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {album.artist && <>{album.artist} · </>}
                        {album.trackCount} 首歌曲
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
