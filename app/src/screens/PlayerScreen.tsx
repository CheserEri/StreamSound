/**
 * 播放器主屏幕 - 网易云音乐风格
 *
 * 布局:
 *  - 顶部: 折叠按钮 + 标题 + 播放列表按钮
 *  - 中间: 水平滑动页面 (左侧=专辑页, 右侧=歌词页)
 *  - 底部: 歌曲信息 + 进度条 + 控制按钮
 *
 * 左右滑动切换专辑/歌词，参考网易云音乐逻辑
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePlayer } from '../hooks/usePlayer';
import { useSettingsStore } from '../store';
import api from '../services/api';
import { getCachedLyrics, setCachedLyrics } from '../services/storage';
import type { RootStackParamList, TrackDetail } from '../types';
import CoverImage from '../components/CoverImage';
import LyricsView from '../components/LyricsView';
import DiscCover from '../components/DiscCover';
import AnimatedPlayButton from '../components/AnimatedPlayButton';
import AnimatedHeartButton from '../components/AnimatedHeartButton';
import GlowSlider from '../components/GlowSlider';
import GradientBackground from '../components/GradientBackground';
import {
  ChevronDownIcon,
  QueueIcon,
  SkipPreviousIcon,
  SkipNextIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
} from '../components/icons';
import { formatProgress } from '../utils/format';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH * 0.68;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

export default function PlayerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
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
  const [currentPage, setCurrentPage] = useState(0); // 0=album, 1=lyrics

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

    // Fetch fresh data from API
    const controller = new AbortController();
    api.get(`/library/tracks/${currentTrack.id}`, { signal: controller.signal })
      .then((res) => {
        setTrackDetail(res.data.data);
        if (res.data.data.lyrics) {
          setCachedLyrics(currentTrack.id, res.data.data.lyrics);
        }
      })
      .catch(() => {});

    return () => { controller.abort(); };
  }, [currentTrack?.id]);

  /**
   * 处理水平滚动，判断当前页面
   */
  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  }, []);

  /**
   * 跳转到指定页面
   */
  const scrollToPage = useCallback((page: number) => {
    scrollViewRef.current?.scrollTo({
      x: page * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPage(page);
  }, []);

  if (!currentTrack) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <Text style={styles.noTrackText}>未在播放</Text>
        </View>
      </GradientBackground>
    );
  }

  const getModeIconComponent = () => {
    switch (mode) {
      case 'shuffle': return <ShuffleIcon size={20} color="#aaa" />;
      case 'repeat': return <RepeatOneIcon size={20} color="#1db954" />;
      default: return <RepeatIcon size={20} color="#aaa" />;
    }
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <GradientBackground colors={['#1a1a2e', '#121218', '#0a0a12']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            hitSlop={12}
          >
            <ChevronDownIcon size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>正在播放</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Queue')}
            style={styles.headerButton}
            hitSlop={12}
          >
            <QueueIcon size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Page indicator dots */}
        <View style={styles.pageIndicator}>
          <TouchableOpacity
            onPress={() => scrollToPage(0)}
            style={[styles.dot, currentPage === 0 && styles.dotActive]}
          />
          <TouchableOpacity
            onPress={() => scrollToPage(1)}
            style={[styles.dot, currentPage === 1 && styles.dotActive]}
          />
        </View>

        {/* Horizontal pager: Album (left) + Lyrics (right) */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.pager}
        >
          {/* Page 1: Album Cover */}
          <View style={styles.page}>
            <View style={styles.coverSection}>
              <DiscCover
                trackId={currentTrack.id}
                hasCover={currentTrack.hasCover}
                size={COVER_SIZE}
                isPlaying={isPlaying}
              />
            </View>
          </View>

          {/* Page 2: Lyrics */}
          <View style={styles.page}>
            <View style={styles.lyricsSection}>
              <LyricsView
                lyrics={trackDetail?.lyrics || null}
                size={lyricsSize}
                onLinePress={(time) => seekTo(time)}
              />
            </View>
          </View>
        </ScrollView>

        {/* Track info + Heart */}
        <View style={styles.trackInfo}>
          <View style={styles.trackInfoRow}>
            <View style={styles.trackInfoText}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {currentTrack.artist || '未知艺术家'}
              </Text>
            </View>
            <AnimatedHeartButton
              trackId={currentTrack.id}
              initialFavorited={trackDetail?.isFavorited ?? false}
              size={26}
            />
          </View>
        </View>

        {/* Progress slider */}
        <View style={styles.progressContainer}>
          <GlowSlider
            value={progress}
            maximumValue={duration || currentTrack.duration || 1}
            onSeek={seekTo}
            activeColor="#fff"
            inactiveColor="#333"
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatProgress(progress)}</Text>
            <Text style={styles.timeText}>{formatProgress(duration || currentTrack.duration || 0)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={toggleMode}
            style={styles.modeButton}
            hitSlop={8}
          >
            {getModeIconComponent()}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={skipToPrevious}
            style={styles.controlButton}
            hitSlop={8}
          >
            <SkipPreviousIcon size={32} color="#fff" />
          </TouchableOpacity>

          <AnimatedPlayButton
            isPlaying={isPlaying}
            onPress={isPlaying ? pause : play}
            size={72}
          />

          <TouchableOpacity
            onPress={skipToNext}
            style={styles.controlButton}
            hitSlop={8}
          >
            <SkipNextIcon size={32} color="#fff" />
          </TouchableOpacity>

          <View style={styles.modeButton} />
        </View>
      </GradientBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
    paddingBottom: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Page indicator dots
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
  // Horizontal pager
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  lyricsSection: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
  },
  // Track info
  trackInfo: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackInfoText: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trackArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  // Progress
  progressContainer: {
    paddingTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  timeText: {
    color: '#777',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
