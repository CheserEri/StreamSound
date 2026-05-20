/**
 * 网易云风格胶片转盘
 * - 唱片环 + 封面 + 中心孔
 * - 封面占比大，唱片纹理简洁
 * - 播放时平滑旋转，暂停时停在当前角度
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import CoverImage from './CoverImage';
import { generateDiscColors } from '../utils/colorUtils';

interface DiscCoverProps {
  trackId: number;
  hasCover: boolean;
  size?: number;
  isPlaying: boolean;
  dominantColor?: string;
}

export default function DiscCover({
  trackId,
  hasCover,
  size = 280,
  isPlaying,
  dominantColor,
}: DiscCoverProps) {
  const rotation = useSharedValue(0);

  const discColors = useMemo(
    () => generateDiscColors(dominantColor),
    [dominantColor],
  );

  React.useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 25000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const innerSize = size * 0.80;
  const ringWidth = (size - innerSize) / 2;

  // 两圈简洁的唱片纹理
  const grooveRadii = [
    size / 2 - ringWidth * 0.3,
    size / 2 - ringWidth * 0.7,
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 外层唱片环 */}
      <View
        style={[
          styles.vinylRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: discColors.ring,
            borderColor: discColors.ringBorder,
          },
        ]}
      />

      {/* 唱片纹理 */}
      {grooveRadii.map((radius, i) => (
        <View
          key={i}
          style={[
            styles.groove,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderColor: discColors.ringBorder,
            },
          ]}
        />
      ))}

      {/* 旋转的封面 */}
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

      {/* 中心孔 */}
      <View
        style={[
          styles.centerHole,
          {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: discColors.center,
            borderColor: discColors.centerBorder,
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
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  groove: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.2,
  },
  coverWrapper: {
    overflow: 'hidden',
  },
  centerHole: {
    position: 'absolute',
    borderWidth: 1.5,
    zIndex: 10,
  },
});
