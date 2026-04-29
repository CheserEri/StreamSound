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
import { usePlayerActions } from '../hooks/usePlayer';
import MiniPlayer from '../components/MiniPlayer';
import CoverImage from '../components/CoverImage';
import { formatDuration, formatRelativeTime } from '../utils/format';
import type { HistoryTrack } from '../types';

export default function HistoryScreen() {
  const { playTracks } = usePlayerActions();
  const [history, setHistory] = useState<HistoryTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await api.get('/history', { params: { limit: 50 }, signal });
      setHistory(response.data.data);
      setError(null);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') {
        setError('无法加载播放历史');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
    return () => { controller.abort(); };
  }, [fetchHistory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHistory();
  };

  const handleTrackPress = (track: HistoryTrack) => {
    const tracks = history.map((h) => ({
      ...h,
      hasLyrics: false,
      folderId: 0,
    }));
    const index = history.findIndex((h) => h.id === track.id);
    playTracks(tracks, index >= 0 ? index : 0);
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchHistory()}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => `${item.id}-${item.playedAt}`}
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
              <Text style={styles.playedAt}>{formatRelativeTime(item.playedAt)}</Text>
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
            <Text style={styles.emptyText}>暂无播放记录</Text>
          </View>
        }
      />

      {/* Mini Player */}
      <MiniPlayer />
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
  playedAt: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
});
