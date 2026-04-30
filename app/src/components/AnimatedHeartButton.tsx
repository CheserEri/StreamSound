/**
 * 收藏动画按钮
 * 使用 reanimated 实现弹性缩放 + 旋转动画
 * 参考 Instagram 点赞效果
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Pressable, StyleSheet, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import { HeartOutlineIcon, HeartFilledIcon } from './icons';
import api from '../services/api';

interface AnimatedHeartButtonProps {
  trackId: number;
  initialFavorited?: boolean;
  onToggle?: (favorited: boolean) => void;
  size?: number;
}

export default function AnimatedHeartButton({
  trackId,
  initialFavorited = false,
  onToggle,
  size = 28,
}: AnimatedHeartButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePress = useCallback(async () => {
    if (isLoading) return;

    const newState = !isFavorited;
    setIsFavorited(newState);
    setIsLoading(true);

    // Bouncy heart animation
    if (newState) {
      scale.value = withSequence(
        withTiming(0.5, { duration: 80 }),
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      rotation.value = withSequence(
        withTiming(-15, { duration: 80 }),
        withTiming(15, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    } else {
      scale.value = withSequence(
        withTiming(0.7, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }

    try {
      if (newState) {
        await api.post(`/favorites/${trackId}`);
      } else {
        await api.delete(`/favorites/${trackId}`);
      }
      onToggle?.(newState);
    } catch (error: any) {
      setIsFavorited(!newState);
      const message = error?.response?.data?.error?.message || '操作失败';
      Alert.alert('提示', message);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, isFavorited, isLoading, onToggle]);

  return (
    <Pressable onPress={handlePress} disabled={isLoading} hitSlop={12}>
      <Animated.View style={animatedStyle}>
        {isFavorited ? (
          <HeartFilledIcon size={size} color="#ff4757" />
        ) : (
          <HeartOutlineIcon size={size} color="#aaa" />
        )}
      </Animated.View>
    </Pressable>
  );
}
