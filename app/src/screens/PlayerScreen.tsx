/**
 * Player screen - Spotify-inspired immersive design
 *
 * Layout:
 *  - Top: collapse button + title + queue button
 *  - Middle: horizontal pager (album cover / lyrics)
 *  - Bottom: track info + progress + controls
 *
 * Dynamic gradient + blurred album art atmosphere
 */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { usePlayer } from '../hooks/usePlayer';
import { useSettingsStore } from '../store';
import { getColors, getPlayerGradient } from '../theme/colors';
import api from '../services/api';
import { getCoverUrl } from '../services/player';
import { getCachedLyrics, setCachedLyrics } from '../services/storage';
import type { RootStackParamList, TrackDetail } from '../types';
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
  MusicNoteIcon,
} from '../components/icons';
import { formatProgress } from '../utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH * 0.68;

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

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
  const { lyricsSize, theme } = useSettingsStore();
  const colors = useMemo(() => getColors(theme), [theme]);

  const [trackDetail, setTrackDetail] = useState<TrackDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [coverLoaded, setCoverLoaded] = useState(false);

  // Dynamic gradient based on track
  const gradientColors = useMemo(() => {
    if (!currentTrack) return colors.playerGradientDefault;
    return getPlayerGradient(currentTrack.id);
  }, [currentTrack?.id]);

  // Fetch track details + lyrics
  useEffect(() => {
    if (!currentTrack) {
      setTrackDetail(null);
      setCoverLoaded(false);
      return;
    }

    setCoverLoaded(false);

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

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCurrentPage(Math.round(offsetX / SCREEN_WIDTH));
  }, []);

  const scrollToPage = useCallback((page: number) => {
    scrollViewRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
    setCurrentPage(page);
  }, []);

  const triggerHaptic = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }, []);

  const handlePlayPause = useCallback(() => {
    triggerHaptic();
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play, triggerHaptic]);

  const handleSkipNext = useCallback(() => {
    triggerHaptic();
    skipToNext();
  }, [skipToNext, triggerHaptic]);

  const handleSkipPrevious = useCallback(() => {
    triggerHaptic();
    skipToPrevious();
  }, [skipToPrevious, triggerHaptic]);

  if (!currentTrack) {
    return (
      <GradientBackground colors={colors.playerGradientDefault}>
        <View style={styles.center}>
          <MusicNoteIcon size={48} color={colors.textMuted} />
          <Text style={[styles.noTrackText, { color: colors.textMuted }]}>未在播放</Text>
        </View>
      </GradientBackground>
    );
  }

  const getModeIconComponent = () => {
    switch (mode) {
      case 'shuffle': return <ShuffleIcon size={20} color={colors.textMuted} />;
      case 'repeat': return <RepeatOneIcon size={20} color={colors.accent} />;
      default: return <RepeatIcon size={20} color={colors.textMuted} />;
    }
  };

  const coverUrl = getCoverUrl(currentTrack.id);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <GradientBackground colors={gradientColors}>
        {/* Blurred album art atmosphere */}
        {currentTrack.hasCover && (
          <View style={styles.atmosphereLayer} pointerEvents="none">
            <Image
              source={{ uri: coverUrl }}
              style={styles.atmosphereImage}
              blurRadius={30}
              resizeMode="cover"
            />
            <View style={styles.atmosphereOverlay} />
          </View>
        )}

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            hitSlop={12}
          >
            <ChevronDownIcon size={28} color={colors.playerText} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.playerHeaderSubtitle }]}>正在播放</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Queue')}
            style={styles.headerButton}
            hitSlop={12}
          >
            <QueueIcon size={22} color={colors.playerText} />
          </TouchableOpacity>
        </View>

        {/* Page indicator dots */}
        <View style={styles.pageIndicator}>
          <TouchableOpacity
            onPress={() => scrollToPage(0)}
            style={[
              styles.dot,
              { backgroundColor: colors.playerDot },
              currentPage === 0 && [styles.dotActive, { backgroundColor: colors.playerDotActive }],
            ]}
          />
          <TouchableOpacity
            onPress={() => scrollToPage(1)}
            style={[
              styles.dot,
              { backgroundColor: colors.playerDot },
              currentPage === 1 && [styles.dotActive, { backgroundColor: colors.playerDotActive }],
            ]}
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
              <Text style={[styles.trackTitle, { color: colors.playerText }]} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={[styles.trackArtist, { color: colors.playerTextSecondary }]} numberOfLines={1}>
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
            activeColor={colors.sliderActive}
            inactiveColor={colors.sliderInactive}
            glowColor={colors.sliderGlow}
          />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.playerTextMuted }]}>
              {formatProgress(progress)}
            </Text>
            <Text style={[styles.timeText, { color: colors.playerTextMuted }]}>
              {formatProgress(duration || currentTrack.duration || 0)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={() => { triggerHaptic(); toggleMode(); }}
            style={styles.modeButton}
            hitSlop={8}
          >
            {getModeIconComponent()}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkipPrevious}
            style={styles.controlButton}
            hitSlop={8}
          >
            <SkipPreviousIcon size={32} color={colors.playerText} />
          </TouchableOpacity>

          <AnimatedPlayButton
            isPlaying={isPlaying}
            onPress={handlePlayPause}
            size={72}
            pausedBackgroundColor={colors.playerText}
            playingBackgroundColor="rgba(255, 255, 255, 0.16)"
            pausedIconColor="#111111"
            playingIconColor={colors.playerText}
          />

          <TouchableOpacity
            onPress={handleSkipNext}
            style={styles.controlButton}
            hitSlop={8}
          >
            <SkipNextIcon size={32} color={colors.playerText} />
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
    gap: 12,
  },
  noTrackText: {
    fontSize: 16,
  },
  // Atmosphere
  atmosphereLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  atmosphereImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
    transform: [{ scale: 1.3 }],
  },
  atmosphereOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 1,
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
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Page indicator
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    zIndex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
  },
  // Pager
  pager: {
    flex: 1,
    zIndex: 1,
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
    zIndex: 1,
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trackArtist: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  // Progress
  progressContainer: {
    paddingTop: 4,
    zIndex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  timeText: {
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
    zIndex: 1,
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
