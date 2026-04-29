/**
 * 收藏按钮组件
 * 用于切换歌曲的收藏状态
 */
import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

/**
 * 收藏按钮属性接口
 */
interface FavoriteButtonProps {
  /** 歌曲ID */
  trackId: number;
  /** 初始收藏状态 */
  initialFavorited?: boolean;
  /** 状态切换回调 */
  onToggle?: (favorited: boolean) => void;
  /** 图标尺寸 */
  size?: number;
}

/**
 * 收藏按钮组件
 * 采用乐观更新策略，先更新UI再同步服务端
 */
export default function FavoriteButton({
  trackId,
  initialFavorited = false,
  onToggle,
  size = 24,
}: FavoriteButtonProps) {
  // 当前收藏状态
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 监听初始状态变化
   */
  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  /**
   * 处理点击事件
   */
  const handlePress = useCallback(async () => {
    if (isLoading) return;

    // 乐观更新：先更新UI
    const newState = !isFavorited;
    setIsFavorited(newState);
    setIsLoading(true);

    try {
      // 发送请求到服务端
      if (newState) {
        await api.post(`/favorites/${trackId}`);
      } else {
        await api.delete(`/favorites/${trackId}`);
      }
      // 通知父组件状态变化
      onToggle?.(newState);
    } catch (error: any) {
      // 失败回滚：恢复原来的状态
      setIsFavorited(!newState);
      const message = error?.response?.data?.error?.message || '操作失败';
      Alert.alert('提示', message);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, isFavorited, isLoading, onToggle]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, { fontSize: size }]}>
        {isFavorited ? '❤️' : '🤍'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  icon: {
    fontSize: 24,
  },
});
