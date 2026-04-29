/**
 * 迷你播放器组件
 * 类似网易云音乐的底部播放控制栏
 * 位置：固定在屏幕底部，横向铺满
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerStore } from '../store';
import CoverImage from './CoverImage';
import type { RootStackParamList } from '../types';

// 导航类型定义
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 迷你播放器组件
 */
export default function MiniPlayer() {
  const navigation = useNavigation<NavigationProp>();
  // 获取播放器状态和操作方法
  const currentTrack = usePlayerStore((s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : null));
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);

  // 如果没有当前播放歌曲，不显示
  if (!currentTrack) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.95}
    >
      {/* 左侧圆形专辑封面 */}
      <CoverImage
        trackId={currentTrack.id}
        hasCover={currentTrack.hasCover}
        size={52}
        borderRadius={26}
      />

      {/* 中间歌曲信息 */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist || '未知艺术家'}
        </Text>
      </View>

      {/* 右侧控制按钮 */}
      <View style={styles.controls}>
        {/* 播放/暂停按钮 */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? pause : play}
        >
          <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* 播放列表按钮 */}
        <TouchableOpacity
          style={styles.queueButton}
          onPress={() => navigation.navigate('Queue')}
        >
          <Text style={styles.queueButtonText}>☰</Text>
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
    paddingVertical: 14,
    height: 80,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    color: '#666',
    fontSize: 13,
    marginTop: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 22,
  },
  queueButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueButtonText: {
    fontSize: 20,
    color: '#333',
  },
});
