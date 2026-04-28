import { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store';

interface LyricLine {
  time: number;
  text: string;
}

export function useLyrics(lyrics: string | null) {
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const { progress } = usePlayerStore();

  useEffect(() => {
    if (!lyrics) {
      setParsedLyrics([]);
      return;
    }

    const lines: LyricLine[] = [];
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

    for (const line of lyrics.split('\n')) {
      const match = line.match(regex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        const time = minutes * 60 + seconds + ms / 1000;
        const text = match[4].trim();
        if (text) {
          lines.push({ time, text });
        }
      }
    }

    setParsedLyrics(lines);
  }, [lyrics]);

  useEffect(() => {
    if (parsedLyrics.length === 0) {
      setCurrentLineIndex(-1);
      return;
    }

    // Find current line based on progress
    let index = -1;
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (progress >= parsedLyrics[i].time) {
        index = i;
        break;
      }
    }
    setCurrentLineIndex(index);
  }, [progress, parsedLyrics]);

  const getLineTime = useCallback(
    (index: number) => {
      if (index >= 0 && index < parsedLyrics.length) {
        return parsedLyrics[index].time;
      }
      return 0;
    },
    [parsedLyrics],
  );

  return {
    parsedLyrics,
    currentLineIndex,
    getLineTime,
  };
}
