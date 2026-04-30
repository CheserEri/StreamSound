/**
 * 唱片封面旋转动画
 * 播放时持续旋转，暂停时停止
 * 灵感来自 Apple Music / Spotify 黑胶唱片效果
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import CoverImage from './CoverImage';

interface DiscCoverProps {
  trackId: number;
  hasCover: boolean;
  size?: number;
  isPlaying: boolean;
}

export default function DiscCover({
  trackId,
  hasCover,
  size = 280,
  isPlaying,
}: DiscCoverProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1, // infinite
        false,
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const innerSize = size * 0.75;
  const ringWidth = (size - innerSize) / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer vinyl ring */}
      <View
        style={[
          styles.vinylRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />

      {/* Spinning cover */}
      <Animated.View
        style={[
          styles.coverWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      >
        {/* Cover image */}
        <CoverImage
          trackId={trackId}
          hasCover={hasCover}
          size={innerSize}
          borderRadius={innerSize / 2}
          style={{
            position: 'absolute',
            top: ringWidth,
            left: ringWidth,
          }}
        />
      </Animated.View>

      {/* Center hole */}
      <View
        style={[
          styles.centerHole,
          {
            width: 18,
            height: 18,
            borderRadius: 9,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylRing: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  coverWrapper: {
    overflow: 'hidden',
  },
  centerHole: {
    position: 'absolute',
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#333',
    zIndex: 10,
  },
});
