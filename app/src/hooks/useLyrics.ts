/**
 * 歌词处理 Hook
 * 用于解析歌词文本并根据播放进度定位当前歌词行
 */
import { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store';

/**
 * 单句歌词接口
 */
interface LyricLine {
  /** 时间戳（秒） */
  time: number;
  /** 歌词文本 */
  text: string;
}

/**
 * 歌词处理 Hook
 * @param lyrics 歌词文本（LRC格式）
 */
export function useLyrics(lyrics: string | null) {
  // 解析后的歌词数组
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  // 当前播放的歌词行索引
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  // 获取播放进度
  const { progress } = usePlayerStore();

  /**
   * 解析歌词文本
   * 支持标准 LRC 格式：[mm:ss.xx]歌词内容
   */
  useEffect(() => {
    if (!lyrics) {
      setParsedLyrics([]);
      return;
    }

    const lines: LyricLine[] = [];
    // 匹配 LRC 格式的正则表达式
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

    for (const line of lyrics.split('\n')) {
      const match = line.match(regex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        // 转换为秒数
        const time = minutes * 60 + seconds + ms / 1000;
        const text = match[4].trim();
        if (text) {
          lines.push({ time, text });
        }
      }
    }

    setParsedLyrics(lines);
  }, [lyrics]);

  /**
   * 根据播放进度更新当前歌词行
   */
  useEffect(() => {
    if (parsedLyrics.length === 0) {
      setCurrentLineIndex(-1);
      return;
    }

    // 从后向前查找当前进度对应的歌词行
    let index = -1;
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (progress >= parsedLyrics[i].time) {
        index = i;
        break;
      }
    }
    setCurrentLineIndex(index);
  }, [progress, parsedLyrics]);

  /**
   * 获取指定索引歌词行的时间戳
   */
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
