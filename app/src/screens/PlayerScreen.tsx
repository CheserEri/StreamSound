import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../hooks/usePlayer';
import { useSettingsStore } from '../store';
import { getCoverUrl } from '../services/player';
import api from '../services/api';
import type { TrackDetail } from '../types';
import FastImage from 'react-native-fast-image';
import Slider from '@react-native-community/slider';
import LyricsView from '../components/LyricsView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH * 0.45;

export default function PlayerScreen() {
  const navigation = useNavigation();
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    mode,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleMode,
  } = usePlayer();
  const { lyricsSize } = useSettingsStore();

  const [trackDetail, setTrackDetail] = useState<TrackDetail | null>(null);

  useEffect(() => {
    if (currentTrack) {
      api.get(`/library/tracks/${currentTrack.id}`).then((res) => {
        setTrackDetail(res.data.data);
      });
    }
  }, [currentTrack?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'shuffle':
        return '🔀';
      case 'repeat':
        return '🔁';
      default:
        return '➡️';
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'shuffle':
        return '随机播放';
      case 'repeat':
        return '单曲循环';
      default:
        return '顺序播放';
    }
  };

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.noTrackText}>未在播放</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.closeButton}>▼</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>正在播放</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Queue')}
          style={styles.headerButton}
        >
          <Text style={styles.queueButton}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Main content: Cover + Lyrics */}
      <View style={styles.mainContent}>
        {/* Cover */}
        <View style={styles.coverContainer}>
          {currentTrack.hasCover ? (
            <FastImage
              source={{ uri: getCoverUrl(currentTrack.id) }}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.coverPlaceholderText}>♪</Text>
            </View>
          )}
        </View>

        {/* Lyrics area */}
        <View style={styles.lyricsContainer}>
          <LyricsView
            lyrics={trackDetail?.lyrics || null}
            size={lyricsSize}
            onLinePress={(time) => seekTo(time)}
          />
        </View>
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {currentTrack.artist || '未知艺术家'}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={progress}
          onSlidingComplete={(value) => seekTo(value)}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="#333"
          thumbTintColor="#fff"
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(progress)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMode} style={styles.modeButton}>
          <Text style={styles.modeIcon}>{getModeIcon()}</Text>
          <Text style={styles.modeLabel}>{getModeLabel()}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={skipToPrevious} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isPlaying ? pause : play}
          style={styles.playButton}
        >
          <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={skipToNext} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>⏭</Text>
        </TouchableOpacity>

        <View style={styles.modeButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTrackText: {
    color: '#555',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  closeButton: {
    color: '#fff',
    fontSize: 18,
  },
  headerTitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  queueButton: {
    fontSize: 18,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  coverContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: COVER_SIZE + 20,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  coverPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 48,
    color: '#333',
  },
  lyricsContainer: {
    flex: 1,
  },
  trackInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#888',
    fontSize: 14,
  },
  progressContainer: {
    paddingHorizontal: 24,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    color: '#777',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  controlButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  playButtonText: {
    fontSize: 30,
  },
  modeButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 18,
  },
  modeLabel: {
    color: '#666',
    fontSize: 9,
    marginTop: 2,
  },
});
