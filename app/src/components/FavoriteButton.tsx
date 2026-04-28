import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

interface FavoriteButtonProps {
  trackId: number;
  initialFavorited?: boolean;
  onToggle?: (favorited: boolean) => void;
  size?: number;
}

export default function FavoriteButton({
  trackId,
  initialFavorited = false,
  onToggle,
  size = 24,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const handlePress = useCallback(async () => {
    if (isLoading) return;

    // Optimistic update
    const newState = !isFavorited;
    setIsFavorited(newState);
    setIsLoading(true);

    try {
      if (newState) {
        await api.post(`/favorites/${trackId}`);
      } else {
        await api.delete(`/favorites/${trackId}`);
      }
      onToggle?.(newState);
    } catch (error: any) {
      // Rollback on error
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
