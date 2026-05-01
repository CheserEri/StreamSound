/**
 * Memoized track list item
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import CoverImage from './CoverImage';
import { formatDuration } from '../utils/format';
import type { TrackListItem } from '../types';

interface TrackItemProps {
  track: TrackListItem;
  isActive?: boolean;
  onPress: () => void;
}

export default React.memo(function TrackItem({ track, isActive, onPress }: TrackItemProps) {
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && { backgroundColor: colors.activeBg, borderLeftWidth: 3, borderLeftColor: colors.accent },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <CoverImage trackId={track.id} hasCover={track.hasCover} size={48} />

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: isActive ? colors.activeText : colors.text }]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
          {track.artist || '未知艺术家'}
        </Text>
      </View>

      <Text style={[styles.duration, { color: colors.textMuted }]}>
        {formatDuration(track.duration)}
      </Text>
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
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  artist: {
    fontSize: 13,
    marginTop: 2,
  },
  duration: {
    fontSize: 13,
    marginLeft: 8,
  },
});
