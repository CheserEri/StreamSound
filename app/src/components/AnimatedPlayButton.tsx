/**
 * Animated play/pause button with distinct states and icon morphing.
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
    progress.value = withTiming(isPlaying ? 1 : 0, { duration: 220 });
  }, [isPlaying, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [pausedBackgroundColor, playingBackgroundColor],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.38)'],
    ),
    transform: [
      { scale: scale.value },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
    ],
  }), [pausedBackgroundColor, playingBackgroundColor]);

  const playIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [1, 0, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0.62]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, -45])}deg` },
      { translateX: size * 0.025 },
    ],
  }), [size]);

  const pauseIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.62, 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-45, -45])}deg` },
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
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    onPress();
  }, [onPress]);

  const iconSize = size * 0.42;
  const pauseIconSize = size * 0.38;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: backgroundColor,
        },
        animatedStyle,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
