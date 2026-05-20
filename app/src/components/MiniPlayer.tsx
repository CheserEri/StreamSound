import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import CoverImage from './CoverImage';
import AnimatedPlayButton from './AnimatedPlayButton';
import { QueueIcon } from './icons';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MiniPlayer() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const currentTrack = usePlayerStore((s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : null));
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.miniPlayerBg, bottom: insets.bottom }]}>
      {/* Progress line at top */}
      <View style={[styles.progressBarBg, { backgroundColor: colors.miniPlayerProgressBg }]}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.miniPlayerProgressFill }]} />
      </View>

      {/* Touchable area: cover + info -> navigates to Player */}
      <TouchableOpacity
        style={styles.touchableArea}
        onPress={() => navigation.navigate('Player')}
        activeOpacity={0.7}
      >
        <View style={styles.coverShadow}>
          <CoverImage
            trackId={currentTrack.id}
            hasCover={currentTrack.hasCover}
            size={48}
            borderRadius={24}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.miniPlayerText }]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.artist, { color: colors.miniPlayerSubtext }]} numberOfLines={1}>
            {currentTrack.artist || '未知艺术家'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.controls}>
        <AnimatedPlayButton
          isPlaying={isPlaying}
          onPress={isPlaying ? pause : play}
          size={40}
          pausedBackgroundColor={colors.accent}
          playingBackgroundColor="rgba(255, 255, 255, 0.12)"
          pausedIconColor={colors.accentText}
          playingIconColor={colors.miniPlayerIcon}
        />
        <TouchableOpacity
          style={styles.queueButton}
          onPress={() => navigation.navigate('Queue')}
          hitSlop={8}
        >
          <QueueIcon size={22} color={colors.miniPlayerIcon} />
        </TouchableOpacity>
      </View>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 76,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  touchableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  progressBarFill: {
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
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
