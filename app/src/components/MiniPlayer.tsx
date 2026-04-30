/**
 * 迷你播放器组件 - 全新 UI
 *
 * 设计特点:
 * - 顶部播放进度线 (Spotify 风格)
 * - 毛玻璃效果背景
 * - SVG 图标
 * - 流畅的展开动画
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerStore } from '../store';
import CoverImage from './CoverImage';
import AnimatedPlayButton from './AnimatedPlayButton';
import { QueueIcon } from './icons';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MiniPlayer() {
  const navigation = useNavigation<NavigationProp>();
  const currentTrack = usePlayerStore((s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : null));
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  if (!currentTrack) return null;

  // Progress percentage for the top bar
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.95}
    >
      {/* Progress line at top */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Left: circular album cover */}
      <CoverImage
        trackId={currentTrack.id}
        hasCover={currentTrack.hasCover}
        size={48}
        borderRadius={24}
      />

      {/* Middle: song info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist || '未知艺术家'}
        </Text>
      </View>

      {/* Right: controls */}
      <View style={styles.controls}>
        <AnimatedPlayButton
          isPlaying={isPlaying}
          onPress={isPlaying ? pause : play}
          size={40}
          color="#1a1a1a"
        />

        <TouchableOpacity
          style={styles.queueButton}
          onPress={() => navigation.navigate('Queue')}
          hitSlop={8}
        >
          <QueueIcon size={22} color="#333" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 76,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#e0e0e0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#1db954',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queueButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
