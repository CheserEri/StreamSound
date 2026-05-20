/**
 * Apple Music style animated play/pause button.
 *
 * Paused state:  rounded-square (borderRadius ~22%) + solid background
 * Playing state: circle (borderRadius 50%) + translucent background
 *
 * Morphs between the two with a spring-animated borderRadius.
 * Icons cross-fade via opacity — no rotation, no glow, no ripple.
 */
import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { PlayIcon, PauseIcon } from './icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  pausedBackgroundColor?: string;
  playingBackgroundColor?: string;
  pausedIconColor?: string;
  playingIconColor?: string;
}

export default function AnimatedPlayButton({
  isPlaying,
  onPress,
  size = 68,
  color = '#fff',
  backgroundColor = '#fff',
  pausedBackgroundColor = backgroundColor,
  playingBackgroundColor = 'rgba(255, 255, 255, 0.18)',
  pausedIconColor = color,
  playingIconColor = color,
}: AnimatedPlayButtonProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isPlaying ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isPlaying ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isPlaying, progress]);

  // Container: borderRadius morphs circle ↔ rounded-square
  const containerStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      progress.value,
      [0, 1],
      [size * 0.22, size / 2],
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [pausedBackgroundColor, playingBackgroundColor],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(0, 0, 0, 0.06)', 'rgba(255, 255, 255, 0.22)'],
    ),
    transform: [{ scale: scale.value }],
  }), [size, pausedBackgroundColor, playingBackgroundColor]);

  // Play icon: visible when paused
  const playIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [1, 0, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0.75]) },
      { translateX: -size * 0.01 },
    ],
  }), [size]);

  // Pause icon: visible when playing
  const pauseIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.75, 1]) },
    ],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 60 }),
      withSpring(1, { damping: 12, stiffness: 350 }),
    );
    onPress();
  }, [onPress]);

  const iconSize = size * 0.38;
  const pauseIconSize = size * 0.32;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        {
          width: size,
          height: size,
          shadowColor: '#000',
        },
        containerStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={10}
    >
      <Animated.View style={[styles.iconLayer, playIconStyle]}>
        <PlayIcon size={iconSize} color={pausedIconColor} />
      </Animated.View>
      <Animated.View style={[styles.iconLayer, pauseIconStyle]}>
        <PauseIcon size={pauseIconSize} color={playingIconColor} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
