import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';
import CoverImage from '../components/CoverImage';
import type { FavoriteTrack } from '../types';

export default function FavoritesScreen() {
  const { playTracks } = usePlayer();
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await api.get('/favorites', { params: { limit: 100 } });
      setFavorites(response.data.data);
      setError(null);
    } catch (err) {
      setError('无法加载收藏列表');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFavorites();
  };

  const handleTrackPress = (track: FavoriteTrack) => {
    const tracks = favorites.map((f) => ({
      ...f,
      hasLyrics: false,
      folderId: 0,
    }));
    const index = favorites.findIndex((f) => f.id === track.id);
    playTracks(tracks, index >= 0 ? index : 0);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.trackItem}
            onPress={() => handleTrackPress(item)}
          >
            <CoverImage trackId={item.id} hasCover={item.hasCover} size={48} />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.artist || '未知艺术家'}
              </Text>
            </View>
            <View style={styles.trackMeta}>
              <Text style={styles.trackDuration}>
                {formatDuration(item.duration)}
              </Text>
              <Text style={styles.favoritedAt}>{formatTime(item.favoritedAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无收藏</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  trackCoverPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCoverText: {
    fontSize: 20,
    color: '#666',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  trackMeta: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  trackDuration: {
    color: '#666',
    fontSize: 13,
  },
  favoritedAt: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
});
