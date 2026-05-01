/**
 * Animated play/pause button with spring scale effects
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
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
}

export default function AnimatedPlayButton({
  isPlaying,
  onPress,
  size = 68,
  color = '#fff',
  backgroundColor = '#fff',
}: AnimatedPlayButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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

  return (
    <AnimatedPressable
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          shadowColor: backgroundColor,
        },
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={10}
    >
      {isPlaying ? (
        <PauseIcon size={iconSize} color={color} />
      ) : (
        <PlayIcon size={iconSize} color={color} />
      )}
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
  },
});
