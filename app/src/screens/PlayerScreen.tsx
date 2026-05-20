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
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { usePlayer } from '../hooks/usePlayer';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { generatePlayerGradient, generateAtmosphereOverlay, DEFAULT_PLAYER_GRADIENT } from '../utils/colorUtils';
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
const COVER_SIZE = Math.min(SCREEN_WIDTH * 0.76, 340);

/** Skip / mode button with spring press bounce */
function AnimatedControlButton({
  onPress,
  children,
  style,
  hitSlop = 8,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  hitSlop?: number;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(
          withTiming(0.8, { duration: 60 }),
          withSpring(1, { damping: 10, stiffness: 400 }),
        );
        onPress();
      }}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, aStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

function NeedleArm({ isPlaying }: { isPlaying: boolean }) {
  const progress = useSharedValue(isPlaying ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(isPlaying ? 1 : 0, {
      damping: 16,
      stiffness: 90,
      mass: 0.7,
    });
  }, [isPlaying, progress]);

  const armStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-24 + progress.value * 18}deg` },
    ],
  }));

  return (
    <View style={styles.needleStage} pointerEvents="none">
      <View style={styles.needlePivotGlow} />
      <Animated.View style={[styles.needleArm, armStyle]}>
        <Svg width={132} height={174} viewBox="0 0 132 174">
          <Circle cx="32" cy="28" r="22" fill="rgba(0,0,0,0.18)" />
          <Circle cx="32" cy="28" r="13" fill="#f6f1ee" />
          <Circle cx="32" cy="28" r="5" fill="rgba(255,255,255,0.95)" />
          <Path
            d="M36 40 C42 76 50 116 92 145"
            stroke="#f6f1ee"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M45 89 C52 116 64 132 91 148"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Rect
            x="88"
            y="136"
            width="34"
            height="22"
            rx="5"
            fill="#f6f1ee"
            transform="rotate(34 105 147)"
          />
          <Rect
            x="98"
            y="142"
            width="22"
            height="4"
            rx="2"
            fill="rgba(0,0,0,0.18)"
            transform="rotate(34 109 144)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

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

  // Dynamic gradient from album cover dominant color
  const gradientColors = useMemo(() => {
    if (!trackDetail?.coverDominantColor) return DEFAULT_PLAYER_GRADIENT;
    return generatePlayerGradient(trackDetail.coverDominantColor);
  }, [trackDetail?.coverDominantColor]);

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
        coverDominantColor: null,
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
      <GradientBackground colors={DEFAULT_PLAYER_GRADIENT}>
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
            <View style={[styles.atmosphereOverlay, { backgroundColor: generateAtmosphereOverlay(trackDetail?.coverDominantColor) }]} />
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
            <Text style={[styles.headerTitle, { color: colors.playerHeaderSubtitle }]}>StreamSound</Text>
            <Text style={[styles.headerSubtitle, { color: colors.playerTextMuted }]} numberOfLines={1}>
              {currentTrack.artist || '未知艺术家'}
            </Text>
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
              <NeedleArm isPlaying={isPlaying} />
              <View style={styles.turntableHalo}>
                <DiscCover
                  trackId={currentTrack.id}
                  hasCover={currentTrack.hasCover}
                  size={COVER_SIZE}
                  isPlaying={isPlaying}
                  dominantColor={trackDetail?.coverDominantColor ?? undefined}
                />
              </View>
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
            <TouchableOpacity
              onPress={() => navigation.navigate('Queue')}
              style={styles.commentButton}
              hitSlop={8}
            >
              <QueueIcon size={25} color={colors.playerTextSecondary} />
            </TouchableOpacity>
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
          <AnimatedControlButton
            onPress={() => { triggerHaptic(); toggleMode(); }}
            style={styles.modeButton}
          >
            {getModeIconComponent()}
          </AnimatedControlButton>

          <AnimatedControlButton
            onPress={handleSkipPrevious}
            style={styles.controlButton}
          >
            <SkipPreviousIcon size={32} color={colors.playerText} />
          </AnimatedControlButton>

          <AnimatedPlayButton
            isPlaying={isPlaying}
            onPress={handlePlayPause}
            size={76}
            pausedBackgroundColor="rgba(255, 255, 255, 0.18)"
            playingBackgroundColor="rgba(255, 255, 255, 0.08)"
            pausedIconColor={colors.playerText}
            playingIconColor={colors.playerText}
          />

          <AnimatedControlButton
            onPress={handleSkipNext}
            style={styles.controlButton}
          >
            <SkipNextIcon size={32} color={colors.playerText} />
          </AnimatedControlButton>

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
    opacity: 0.34,
    transform: [{ scale: 1.35 }],
  },
  atmosphereOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
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
  headerSubtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '500',
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
    justifyContent: 'flex-end',
    flex: 1,
    paddingTop: 18,
    paddingBottom: 26,
  },
  needleStage: {
    position: 'absolute',
    top: -2,
    left: SCREEN_WIDTH / 2 - 36,
    width: 170,
    height: 208,
    zIndex: 4,
  },
  needlePivotGlow: {
    position: 'absolute',
    left: 3,
    top: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  needleArm: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 132,
    height: 174,
    transformOrigin: '32px 28px',
  },
  turntableHalo: {
    width: COVER_SIZE + 34,
    height: COVER_SIZE + 34,
    borderRadius: (COVER_SIZE + 34) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.07)',
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
    gap: 16,
  },
  trackInfoText: {
    flex: 1,
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
  commentButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 26,
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
