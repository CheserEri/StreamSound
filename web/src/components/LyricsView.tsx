import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getColors } from '../theme/colors';
import { useSettingsStore } from '../store';

interface LrcLine {
  time: number;
  text: string;
}

function parseLRC(lrc: string): LrcLine[] {
  const lines = lrc.split('\n');
  const result: LrcLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

interface LyricsViewProps {
  lyrics: string | null;
  progress: number;
  onSeek: (time: number) => void;
}

export default function LyricsView({ lyrics, progress, onSeek }: LyricsViewProps) {
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>();

  const parsed = useMemo(() => (lyrics ? parseLRC(lyrics) : []), [lyrics]);

  const activeIndex = useMemo(() => {
    if (parsed.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < parsed.length; i++) {
      if (parsed[i].time <= progress) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsed, progress]);

  // Auto-scroll to active line
  useEffect(() => {
    if (isUserScrolling.current || activeIndex < 0 || !containerRef.current) return;

    const container = containerRef.current;
    const lines = container.querySelectorAll('[data-lyric-index]');
    const activeLine = lines[activeIndex] as HTMLElement | undefined;
    if (!activeLine) return;

    const containerHeight = container.clientHeight;
    const lineTop = activeLine.offsetTop;
    const lineHeight = activeLine.offsetHeight;
    const scrollTarget = lineTop - containerHeight / 2 + lineHeight / 2;

    container.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 3000);
  }, []);

  const handleLineClick = useCallback(
    (time: number) => {
      onSeek(time);
      isUserScrolling.current = false;
    },
    [onSeek],
  );

  if (!lyrics || parsed.length === 0) {
    return (
      <div className="lyrics-empty">
        <div className="lyrics-empty-icon">&#9835;</div>
        <div className="lyrics-empty-text">No lyrics available</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="lyrics-container"
      onScroll={handleScroll}
    >
      {parsed.map((line, i) => {
        const distance = Math.abs(i - activeIndex);
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;

        let opacity = colors.lyricsFuture;
        let fontSize: string | undefined;
        let fontWeight: string | undefined;
        let transform: string | undefined;

        if (isActive) {
          opacity = colors.lyricsActive;
          fontSize = 'var(--text-3xl)';
          fontWeight = 'var(--font-bold)';
          transform = 'scale(1.02)';
        } else if (isPast) {
          opacity = colors.lyricsPast;
        } else if (distance <= 3) {
          opacity = colors.lyricsFuture;
        }

        return (
          <div
            key={`${i}-${line.time}`}
            data-lyric-index={i}
            onClick={() => handleLineClick(line.time)}
            className={`lyrics-line ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
            style={{
              color: opacity,
              fontSize,
              fontWeight,
              transform,
            }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
}
