import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayer } from '../hooks/usePlayer';
import { useSettingsStore } from '../store';
import api from '../services/api';
import { getCachedLyrics, setCachedLyrics } from '../services/storage';
import type { RootStackParamList, TrackDetail } from '../types';
import Slider from '@react-native-community/slider';
import CoverImage from '../components/CoverImage';
import LyricsView from '../components/LyricsView';
import { formatProgress, getModeIcon, getModeLabel } from '../utils/format';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH * 0.45;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

export default function PlayerScreen() {
  const navigation = useNavigation<NavigationProp>();
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
    if (!currentTrack) {
      setTrackDetail(null);
      return;
    }

    // Show cached lyrics immediately
    const cached = getCachedLyrics(currentTrack.id);
    if (cached) {
      setTrackDetail({
        ...currentTrack,
        bitrate: null,
        sampleRate: null,
        mimeType: null,
        fileSize: null,
        lyrics: cached,
        isFavorited: false,
      });
    } else {
      setTrackDetail(null);
    }

    // Fetch fresh data from API with AbortController to prevent race conditions
    const controller = new AbortController();
    api.get(`/library/tracks/${currentTrack.id}`, { signal: controller.signal })
      .then((res) => {
        setTrackDetail(res.data.data);
        if (res.data.data.lyrics) {
          setCachedLyrics(currentTrack.id, res.data.data.lyrics);
        }
      })
      .catch(() => {
        // Network error or cancelled — keep cached lyrics if available
      });

    return () => { controller.abort(); };
  }, [currentTrack?.id]);


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
          <CoverImage
            trackId={currentTrack.id}
            hasCover={currentTrack.hasCover}
            size={COVER_SIZE}
            borderRadius={12}
            style={styles.cover}
          />
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
          <Text style={styles.timeText}>{formatProgress(progress)}</Text>
          <Text style={styles.timeText}>{formatProgress(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMode} style={styles.modeButton}>
          <Text style={styles.modeIcon}>{getModeIcon(mode)}</Text>
          <Text style={styles.modeLabel}>{getModeLabel(mode)}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
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
