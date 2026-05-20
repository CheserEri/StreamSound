/**
 * Custom progress slider with glow effects
 * - Tap to seek, pan to drag
 * - Glowing track fill and thumb
 * - Smooth reanimated animations
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 48;
const THUMB_SIZE = 16;
const TRACK_HEIGHT = 5;
const HIT_AREA_HEIGHT = 44;

interface GlowSliderProps {
  value: number;
  maximumValue: number;
  onSeek: (value: number) => void;
  activeColor?: string;
  inactiveColor?: string;
  glowColor?: string;
}

export default function GlowSlider({
  value,
  maximumValue,
  onSeek,
  activeColor = '#fff',
  inactiveColor = '#333',
  glowColor,
}: GlowSliderProps) {
  const isDragging = useSharedValue(false);
  const dragProgress = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const resolvedGlowColor = glowColor || activeColor;

  const seekToPosition = useCallback(
    (x: number) => {
      const clampedX = Math.max(0, Math.min(x, SLIDER_WIDTH));
      const newValue = (clampedX / SLIDER_WIDTH) * maximumValue;
      onSeek(newValue);
    },
    [maximumValue, onSeek],
  );

  const handleDragStart = useCallback(
    (x: number) => {
      'worklet';
      isDragging.value = true;
      const clampedX = Math.max(0, Math.min(x, SLIDER_WIDTH));
      dragProgress.value = clampedX / SLIDER_WIDTH;
      thumbScale.value = withSpring(1.3, { damping: 12, stiffness: 300 });
      glowOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
    },
    [],
  );

  const handleDragUpdate = useCallback((x: number) => {
    'worklet';
    const clampedX = Math.max(0, Math.min(x, SLIDER_WIDTH));
    dragProgress.value = clampedX / SLIDER_WIDTH;
  }, []);

  const handleDragEnd = useCallback(
    (x: number) => {
      'worklet';
      isDragging.value = false;
      const clampedX = Math.max(0, Math.min(x, SLIDER_WIDTH));
      dragProgress.value = clampedX / SLIDER_WIDTH;
      thumbScale.value = withSpring(1, { damping: 12, stiffness: 300 });
      glowOpacity.value = withSpring(0, { damping: 15, stiffness: 200 });
      runOnJS(seekToPosition)(clampedX);
    },
    [seekToPosition],
  );

  // Tap gesture: immediately seek to tapped position
  const tapGesture = Gesture.Tap().onEnd((e) => {
    const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
    const relX = e.absoluteX - sliderLeft;
    runOnJS(seekToPosition)(relX);
  });

  // Pan gesture: drag to seek (activeOffsetX(0) so it activates immediately,
  // which wins over the parent ScrollView's horizontal pan)
  const panGesture = Gesture.Pan()
    .activeOffsetX(0)
    .onBegin((e) => {
      const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
      const relX = e.absoluteX - sliderLeft;
      handleDragStart(relX);
    })
    .onUpdate((e) => {
      const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
      const relX = e.absoluteX - sliderLeft;
      handleDragUpdate(relX);
    })
    .onEnd((e) => {
      const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
      const relX = e.absoluteX - sliderLeft;
      handleDragEnd(relX);
    });

  // Pan takes priority over tap
  const composed = Gesture.Exclusive(panGesture, tapGesture);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: thumbScale.value }],
  }));

  // Animated fill width: follow drag position during drag, otherwise follow value
  const fillAnimatedStyle = useAnimatedStyle(() => {
    const ratio = isDragging.value
      ? dragProgress.value
      : maximumValue > 0
        ? Math.min(value / maximumValue, 1)
        : 0;
    return { width: ratio * SLIDER_WIDTH };
  });

  const thumbPositionStyle = useAnimatedStyle(() => {
    const ratio = isDragging.value
      ? dragProgress.value
      : maximumValue > 0
        ? Math.min(value / maximumValue, 1)
        : 0;
    return { left: Math.max(0, ratio * SLIDER_WIDTH - THUMB_SIZE / 2) };
  });

  const thumbGlowPositionStyle = useAnimatedStyle(() => {
    const ratio = isDragging.value
      ? dragProgress.value
      : maximumValue > 0
        ? Math.min(value / maximumValue, 1)
        : 0;
    return { left: Math.max(0, ratio * SLIDER_WIDTH - THUMB_SIZE * 1.4) };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.trackArea}>
          {/* Background track */}
          <View style={[styles.track, { backgroundColor: inactiveColor }]} />

          {/* Glow layer behind active fill */}
          <Animated.View
            style={[
              styles.trackGlow,
              {
                backgroundColor: resolvedGlowColor,
              },
              fillAnimatedStyle,
            ]}
          />

          {/* Active fill */}
          <Animated.View
            style={[
              styles.track,
              styles.trackActive,
              {
                backgroundColor: activeColor,
              },
              fillAnimatedStyle,
            ]}
          />

          {/* Thumb glow */}
          <Animated.View
            style={[
              styles.thumbGlow,
              {
                backgroundColor: resolvedGlowColor,
              },
              thumbGlowPositionStyle,
              glowAnimatedStyle,
            ]}
          />

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: activeColor,
              },
              thumbPositionStyle,
              thumbAnimatedStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  trackArea: {
    width: SLIDER_WIDTH,
    height: HIT_AREA_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  trackGlow: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT + 8,
    top: (HIT_AREA_HEIGHT - TRACK_HEIGHT - 8) / 2,
    borderRadius: (TRACK_HEIGHT + 8) / 2,
    opacity: 0.3,
  },
  trackActive: {
    zIndex: 1,
  },
  thumbGlow: {
    position: 'absolute',
    top: (HIT_AREA_HEIGHT - THUMB_SIZE * 2.8) / 2,
    width: THUMB_SIZE * 2.8,
    height: THUMB_SIZE * 2.8,
    borderRadius: THUMB_SIZE * 1.4,
    zIndex: 0,
  },
  thumb: {
    position: 'absolute',
    top: (HIT_AREA_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    zIndex: 2,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
});
