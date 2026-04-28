import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getCoverUrl } from '../services/player';
import type { TrackListItem } from '../types';

interface TrackItemProps {
  track: TrackListItem;
  isActive?: boolean;
  onPress: () => void;
}

export default function TrackItem({ track, isActive, onPress }: TrackItemProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
    >
      {track.hasCover ? (
        <FastImage
          source={{ uri: getCoverUrl(track.id) }}
          style={styles.cover}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverText}>♪</Text>
        </View>
      )}

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

      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
    </TouchableOpacity>
  );
}

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
