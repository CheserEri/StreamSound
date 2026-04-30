/**
 * 自定义进度条组件
 * 功能:
 *  - 实时显示播放进度和总时长
 *  - 可拖动 seek，松手后精确跳转
 *  - 拖动时实时更新进度条填充
 *  - 拖动时暂停进度更新，松手后恢复
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side
const THUMB_SIZE = 14;
const TRACK_HEIGHT = 4;
const HIT_AREA_HEIGHT = 40; // 扩大触摸区域

interface GlowSliderProps {
  value: number;
  maximumValue: number;
  onSeek: (value: number) => void;
  activeColor?: string;
  inactiveColor?: string;
}

export default function GlowSlider({
  value,
  maximumValue,
  onSeek,
  activeColor = '#fff',
  inactiveColor = '#333',
}: GlowSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  // 计算显示的进度
  const displayRatio = isDragging
    ? Math.max(0, Math.min(dragX / SLIDER_WIDTH, 1))
    : maximumValue > 0
      ? Math.min(value / maximumValue, 1)
      : 0;
  const fillWidth = displayRatio * SLIDER_WIDTH;

  const handleDragStart = useCallback((x: number) => {
    setIsDragging(true);
    setDragX(Math.max(0, Math.min(x, SLIDER_WIDTH)));
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
    },
    [maximumValue, onSeek],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // 需要水平移动 10px 才激活，避免误触
    .onBegin((e) => {
      // 使用 absoluteX 减去 slider 左边界得到相对位置
      // slider 左边界 = (SCREEN_WIDTH - SLIDER_WIDTH) / 2
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

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.trackArea}>
          {/* Background track */}
          <View
            style={[
              styles.track,
              { backgroundColor: inactiveColor },
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

          {/* Thumb */}
          <View
            style={[
              styles.thumb,
              {
                left: Math.max(0, fillWidth - THUMB_SIZE / 2),
                backgroundColor: activeColor,
                transform: [{ scale: isDragging ? 1.3 : 1 }],
              },
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
  trackActive: {
    zIndex: 1,
  },
  thumb: {
    position: 'absolute',
    top: (HIT_AREA_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
