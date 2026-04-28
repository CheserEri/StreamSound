import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineIndex >= 0 && scrollViewRef.current && !isScrollingByTap.current) {
      const targetY = currentLineIndex * layout.lineHeight;
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: true,
      });
    }
  }, [currentLineIndex, layout.lineHeight]);

  // Handle tap on lyrics line
  const handleLinePress = useCallback(
    (index: number) => {
      const time = getLineTime(index);
      if (time >= 0 && onLinePress) {
        isScrollingByTap.current = true;
        onLinePress(time);

        // Reset flag after scroll animation completes
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
          isScrollingByTap.current = false;
        }, 1000);
      }
    },
    [getLineTime, onLinePress],
  );

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  if (!lyrics || parsedLyrics.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>暂无歌词</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: SCREEN_HEIGHT * 0.3, paddingBottom: SCREEN_HEIGHT * 0.4 },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {parsedLyrics.map((line, index) => {
        const isActive = index === currentLineIndex;
        const distance = Math.abs(index - currentLineIndex);
        const isPast = index < currentLineIndex;

        // Dynamic opacity based on distance from active line
        const opacity = isActive ? 1 : Math.max(0.2, 1 - distance * 0.15);

        // Dynamic font size with smooth transition
        const fontSize = isActive
          ? layout.activeFontSize
          : Math.max(layout.inactiveFontSize, layout.activeFontSize - distance * 1.5);

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => handleLinePress(index)}
            style={[
              styles.lineWrapper,
              { paddingVertical: layout.verticalPadding },
            ]}
          >
            <Text
              style={[
                styles.line,
                {
                  fontSize,
                  fontWeight: isActive ? '700' : '400',
                  color: isActive ? '#ffffff' : isPast ? '#4a4a4a' : '#7a7a7a',
                  opacity,
                  transform: [{ scale: isActive ? 1.05 : 1 }],
                },
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
  emptyText: {
    color: '#555',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 60,
    fontStyle: 'italic',
  },
  lineWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
