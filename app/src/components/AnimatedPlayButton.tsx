/**
 * 播放/暂停动画按钮
 * 使用 reanimated 实现缩放 + 透明度过渡动画
 * 参考 Spotify / Apple Music 风格
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { PlayIcon, PauseIcon } from './icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}

export default function AnimatedPlayButton({
  isPlaying,
  onPress,
  size = 68,
  color = '#fff',
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
    // Pulse animation on tap
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    onPress();
  }, [onPress]);

  const iconSize = size * 0.42;

  return (
    <AnimatedPressable
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
});
