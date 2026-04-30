/**
 * 歌词显示组件
 * 支持自动滚动、点击跳转、动态样式效果
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLyrics } from '../hooks/useLyrics';
import type { LyricsSize } from '../types';

// 获取屏幕高度用于计算滚动区域
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 歌词组件属性接口
 */
interface LyricsViewProps {
  /** 歌词文本 */
  lyrics: string | null;
  /** 歌词尺寸大小 */
  size?: LyricsSize;
  /** 点击歌词行的回调 */
  onLinePress?: (time: number) => void;
}

/**
 * 歌词显示组件
 */
export default function LyricsView({
  lyrics,
  size = 'md',
  onLinePress,
}: LyricsViewProps) {
  // ScrollView 引用
  const scrollViewRef = useRef<ScrollView>(null);
  // 使用歌词 hook
  const { parsedLyrics, currentLineIndex, getLineTime } = useLyrics(lyrics);
  // 是否正在通过点击滚动
  const isScrollingByTap = useRef(false);
  // 滚动超时定时器
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 根据尺寸获取布局配置
   */
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

  /**
   * 自动滚动到当前播放行
   */
  useEffect(() => {
    if (currentLineIndex >= 0 && scrollViewRef.current && !isScrollingByTap.current) {
      const targetY = currentLineIndex * layout.lineHeight;
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: true,
      });
    }
  }, [currentLineIndex, layout.lineHeight]);

  /**
   * 处理歌词行点击
   */
  const handleLinePress = useCallback(
    (index: number) => {
      const time = getLineTime(index);
      if (time >= 0 && onLinePress) {
        isScrollingByTap.current = true;
        onLinePress(time);

        // 滚动动画完成后重置标志
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

  /**
   * 清理定时器
   */
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // 如果没有歌词，显示占位符
  if (!lyrics || parsedLyrics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>♪</Text>
        <Text style={styles.emptyText}>暂无歌词</Text>
        <Text style={styles.emptyHint}>请确保音频文件包含歌词或同目录下有 .lrc 文件</Text>
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

        // 根据与当前行的距离动态调整透明度
        const opacity = isActive ? 1 : Math.max(0.2, 1 - distance * 0.15);

        // 根据与当前行的距离动态调整字体大小
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#444',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyHint: {
    color: '#444',
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
});
