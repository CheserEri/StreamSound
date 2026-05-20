/**
 * Animated play/pause button with ripple, glow, and icon morphing.
 *
 * Animations:
 *  - Icon cross-fade with rotation morph (play ↔ pause)
 *  - Background color transition between paused/playing states
 *  - Ripple pulse on each toggle
 *  - Soft pulsing glow aura while playing
 *  - Spring-based press bounce
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
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
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
  const ripple = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  // Drive icon/background transition
  useEffect(() => {
    progress.value = withTiming(isPlaying ? 1 : 0, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isPlaying, progress]);

  // Pulsing glow while playing
  useEffect(() => {
    if (isPlaying) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(glowPulse);
      glowPulse.value = withTiming(0, { duration: 400 });
    }
  }, [isPlaying, glowPulse]);

  // Button container: scale + gentle rotation
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

  // Pulsing glow aura behind button
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0, 0.5]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.35]) }],
  }));

  // Ripple pulse ring on toggle
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ripple.value, [0, 0.3, 1], [0, 0.6, 0]),
    transform: [{ scale: interpolate(ripple.value, [0, 1], [0.8, 2.2]) }],
  }));

  // Play icon: visible when paused, fades out when playing
  const playIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [1, 0, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0.62]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, -45])}deg` },
      { translateX: size * 0.025 },
    ],
  }), [size]);

  // Pause icon: hidden when paused, fades in when playing
  const pauseIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.62, 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-45, -45])}deg` },
    ],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.86, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(() => {
    // Quick squish bounce
    scale.value = withSequence(
      withTiming(0.9, { duration: 60 }),
      withSpring(1, { damping: 10, stiffness: 350 }),
    );
    // Trigger ripple pulse
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    onPress();
  }, [onPress]);

  const iconSize = size * 0.42;
  const pauseIconSize = size * 0.38;
  const accentColor = pausedBackgroundColor;

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
      {/* Pulsing glow aura */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: accentColor,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />

      {/* Ripple pulse ring */}
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: accentColor,
          },
          rippleStyle,
        ]}
        pointerEvents="none"
      />

      {/* Play icon layer */}
      <Animated.View style={[styles.iconLayer, playIconStyle]}>
        <PlayIcon size={iconSize} color={pausedIconColor} />
      </Animated.View>

      {/* Pause icon layer */}
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
  glow: {
    position: 'absolute',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
