/**
 * Lyrics display with auto-scroll, tap-to-seek, dynamic styling
 */
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { useLyrics } from '../hooks/useLyrics';
import type { LyricsSize } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LyricsViewProps {
  lyrics: string | null;
  size?: LyricsSize;
  onLinePress?: (time: number) => void;
}

export default function LyricsView({
  lyrics,
  size = 'md',
  onLinePress,
}: LyricsViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { parsedLyrics, currentLineIndex, getLineTime } = useLyrics(lyrics);
  const isScrollingByTap = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineLayouts = useRef<Record<number, { y: number; height: number }>>({});
  const [viewportHeight, setViewportHeight] = useState(0);
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);

  const getLayout = () => {
    switch (size) {
      case 'sm':
        return { activeFontSize: 18, inactiveFontSize: 13, lineHeight: 30, verticalPadding: 8 };
      case 'lg':
        return { activeFontSize: 26, inactiveFontSize: 17, lineHeight: 42, verticalPadding: 10 };
      default:
        return { activeFontSize: 22, inactiveFontSize: 15, lineHeight: 36, verticalPadding: 9 };
    }
  };

  const layout = getLayout();

  const centerCurrentLine = useCallback((animated = true) => {
    if (currentLineIndex < 0 || !scrollViewRef.current || isScrollingByTap.current) return;

    const lineLayout = lineLayouts.current[currentLineIndex];
    if (!lineLayout || viewportHeight <= 0) return;

    const targetY = Math.max(0, lineLayout.y + lineLayout.height / 2 - viewportHeight / 2);
    scrollViewRef.current.scrollTo({ y: targetY, animated });
  }, [currentLineIndex, viewportHeight]);

  useEffect(() => {
    centerCurrentLine(true);
  }, [centerCurrentLine]);

  useEffect(() => {
    lineLayouts.current = {};
  }, [lyrics, size]);

  const handleLinePress = useCallback(
    (index: number) => {
      const time = getLineTime(index);
      if (time >= 0 && onLinePress) {
        isScrollingByTap.current = true;
        onLinePress(time);
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          isScrollingByTap.current = false;
        }, 1000);
      }
    },
    [getLineTime, onLinePress],
  );

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  if (!lyrics || parsedLyrics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyIcon, { color: colors.lyricsEmptyIcon }]}>♪</Text>
        <Text style={[styles.emptyText, { color: colors.lyricsEmptyText }]}>暂无歌词</Text>
        <Text style={[styles.emptyHint, { color: colors.lyricsEmptyHint }]}>请确保音频文件包含歌词或同目录下有 .lrc 文件</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: viewportHeight > 0 ? viewportHeight / 2 : SCREEN_HEIGHT * 0.3,
          paddingBottom: viewportHeight > 0 ? viewportHeight / 2 : SCREEN_HEIGHT * 0.4,
        },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {parsedLyrics.map((line, index) => {
        const isActive = index === currentLineIndex;
        const distance = Math.abs(index - currentLineIndex);
        const isPast = index < currentLineIndex;

        const opacity = isActive ? 1 : Math.max(0.2, 1 - distance * 0.15);
        const fontSize = isActive
          ? layout.activeFontSize
          : Math.max(layout.inactiveFontSize, layout.activeFontSize - distance * 1.5);

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => handleLinePress(index)}
            onLayout={(event) => {
              lineLayouts.current[index] = event.nativeEvent.layout;
              if (index === currentLineIndex) {
                centerCurrentLine(false);
              }
            }}
            style={[
              styles.lineWrapper,
              {
                minHeight: layout.lineHeight + layout.verticalPadding * 2,
                paddingVertical: layout.verticalPadding,
              },
            ]}
          >
            <Text
              style={[
                styles.line,
                {
                  fontSize,
                  lineHeight: layout.lineHeight,
                  fontWeight: isActive ? '700' : '400',
                  color: isActive ? colors.lyricsActive : isPast ? colors.lyricsPast : colors.lyricsFuture,
                  opacity,
                  transform: [{ scale: isActive ? 1.05 : 1 }],
                },
                isActive && styles.activeLineShadow,
              ]}
              numberOfLines={2}
            >
              {line.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  lineWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  activeLineShadow: {
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
