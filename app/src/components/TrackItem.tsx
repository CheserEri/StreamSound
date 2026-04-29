/**
 * 歌曲列表项组件
 * 用于在列表中显示单首歌曲信息
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CoverImage from './CoverImage';
import { formatDuration } from '../utils/format';
import type { TrackListItem } from '../types';

/**
 * 歌曲列表项属性接口
 */
interface TrackItemProps {
  /** 歌曲信息 */
  track: TrackListItem;
  /** 是否为当前播放歌曲 */
  isActive?: boolean;
  /** 点击回调 */
  onPress: () => void;
}

/**
 * 歌曲列表项组件
 */
export default React.memo(function TrackItem({ track, isActive, onPress }: TrackItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
    >
      {/* 封面图片 */}
      <CoverImage trackId={track.id} hasCover={track.hasCover} size={48} />

      {/* 歌曲信息 */}
      <View style={styles.info}>
        <Text
          style={[styles.title, isActive && styles.titleActive]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist || '未知艺术家'}
        </Text>
      </View>

      {/* 时长 */}
      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  containerActive: {
    backgroundColor: '#1e1e1e',
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  coverPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: {
    fontSize: 20,
    color: '#666',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  titleActive: {
    color: '#2563eb',
  },
  artist: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  duration: {
    color: '#666',
    fontSize: 13,
    marginLeft: 8,
  },
});
