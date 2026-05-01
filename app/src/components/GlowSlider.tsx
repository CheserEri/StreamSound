/**
 * Custom progress slider with glow effects
 * - Gesture-based pan for seeking
 * - Glowing track fill and thumb
 * - Smooth reanimated animations
 */
import React, { useState, useCallback } from 'react';
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
const THUMB_SIZE = 14;
const TRACK_HEIGHT = 4;
const HIT_AREA_HEIGHT = 40;

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  const thumbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const resolvedGlowColor = glowColor || activeColor;

  const displayRatio = isDragging
    ? Math.max(0, Math.min(dragX / SLIDER_WIDTH, 1))
    : maximumValue > 0
      ? Math.min(value / maximumValue, 1)
      : 0;
  const fillWidth = displayRatio * SLIDER_WIDTH;

  const handleDragStart = useCallback((x: number) => {
    setIsDragging(true);
    setDragX(Math.max(0, Math.min(x, SLIDER_WIDTH)));
    thumbScale.value = withSpring(1.3, { damping: 12, stiffness: 300 });
    glowOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const handleDragUpdate = useCallback((x: number) => {
    setDragX(Math.max(0, Math.min(x, SLIDER_WIDTH)));
  }, []);

  const handleDragEnd = useCallback(
    (x: number) => {
      setIsDragging(false);
      const clampedX = Math.max(0, Math.min(x, SLIDER_WIDTH));
      const newValue = (clampedX / SLIDER_WIDTH) * maximumValue;
      onSeek(newValue);
      thumbScale.value = withSpring(1, { damping: 12, stiffness: 300 });
      glowOpacity.value = withSpring(0, { damping: 15, stiffness: 200 });
    },
    [maximumValue, onSeek],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin((e) => {
      const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
      const relX = e.absoluteX - sliderLeft;
      runOnJS(handleDragStart)(relX);
    })
    .onUpdate((e) => {
      const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
      const relX = e.absoluteX - sliderLeft;
      runOnJS(handleDragUpdate)(relX);
    })
    .onEnd((e) => {
      const sliderLeft = (SCREEN_WIDTH - SLIDER_WIDTH) / 2;
      const relX = e.absoluteX - sliderLeft;
      runOnJS(handleDragEnd)(relX);
    });

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: thumbScale.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.trackArea}>
          {/* Background track */}
          <View style={[styles.track, { backgroundColor: inactiveColor }]} />

          {/* Glow layer behind active fill */}
          <View
            style={[
              styles.trackGlow,
              {
                width: fillWidth,
                backgroundColor: resolvedGlowColor,
              },
            ]}
          />

          {/* Active fill */}
          <View
            style={[
              styles.track,
              styles.trackActive,
              {
                width: fillWidth,
                backgroundColor: activeColor,
              },
            ]}
          />

          {/* Thumb glow */}
          <Animated.View
            style={[
              styles.thumbGlow,
              {
                left: Math.max(0, fillWidth - THUMB_SIZE * 1.25),
                backgroundColor: resolvedGlowColor,
              },
              glowAnimatedStyle,
            ]}
          />

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                left: Math.max(0, fillWidth - THUMB_SIZE / 2),
                backgroundColor: activeColor,
              },
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
    height: TRACK_HEIGHT + 6,
    top: (HIT_AREA_HEIGHT - TRACK_HEIGHT - 6) / 2,
    borderRadius: (TRACK_HEIGHT + 6) / 2,
    opacity: 0.25,
  },
  trackActive: {
    zIndex: 1,
  },
  thumbGlow: {
    position: 'absolute',
    top: (HIT_AREA_HEIGHT - THUMB_SIZE * 2.5) / 2,
    width: THUMB_SIZE * 2.5,
    height: THUMB_SIZE * 2.5,
    borderRadius: THUMB_SIZE * 1.25,
    zIndex: 0,
  },
  thumb: {
    position: 'absolute',
    top: (HIT_AREA_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
