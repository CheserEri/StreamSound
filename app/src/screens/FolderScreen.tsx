import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../services/api';
import { usePlayerActions } from '../hooks/usePlayer';
import { usePlayerStore } from '../store';
import MiniPlayer from '../components/MiniPlayer';
import { PlayIcon, ShuffleIcon } from '../components/icons';
import type { RootStackParamList, TrackListItem } from '../types';
import CoverImage from '../components/CoverImage';
import { formatDuration } from '../utils/format';

type RouteProps = RouteProp<RootStackParamList, 'Folder'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FolderScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { folderId, folderName } = route.params;
  const { playTracks } = usePlayerActions();
  const currentTrack = usePlayerStore((s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : null));
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [tracks, setTracks] = useState<TrackListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });

  const fetchTracks = useCallback(async (offset = 0, signal?: AbortSignal) => {
    try {
      const response = await api.get(`/library/folders/${folderId}/tracks`, {
        params: { limit: 50, offset, sort: 'title', order: 'asc' },
        signal,
      });
      if (offset === 0) {
        setTracks(response.data.data);
      } else {
        setTracks((prev) => [...prev, ...response.data.data]);
      }
      setPagination(response.data.pagination);
      setError(null);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') {
        setError('无法加载曲目');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [folderId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTracks(0, controller.signal);
    return () => { controller.abort(); };
  }, [fetchTracks]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTracks(0);
  };

  const handleLoadMore = () => {
    if (tracks.length < pagination.total) {
      fetchTracks(tracks.length);
    }
  };

  const handleTrackPress = (track: TrackListItem) => {
    const index = tracks.findIndex((t) => t.id === track.id);
    playTracks(tracks, index);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTracks(tracks, 0);
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTracks(shuffled, 0);
    }
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchTracks()}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePlayAll}>
          <View style={styles.actionButtonInner}>
            <PlayIcon size={16} color="#fff" />
            <Text style={styles.actionButtonText}>全部播放</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShufflePlay}>
          <View style={styles.actionButtonInner}>
            <ShuffleIcon size={16} color="#fff" />
            <Text style={styles.actionButtonText}>随机播放</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tracks list */}
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isCurrentTrack = currentTrack?.id === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.trackItem,
                isCurrentTrack && styles.trackItemActive,
              ]}
              onPress={() => handleTrackPress(item)}
            >
              <CoverImage trackId={item.id} hasCover={item.hasCover} size={48} />
              <View style={styles.trackInfo}>
                <Text
                  style={[
                    styles.trackTitle,
                    isCurrentTrack && styles.trackTitleActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist || '未知艺术家'}
                </Text>
              </View>
              <Text style={styles.trackDuration}>
                {formatDuration(item.duration)}
              </Text>
            </TouchableOpacity>
          );
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={styles.list}
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
    backgroundColor: '#121212',
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
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    paddingVertical: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trackItemActive: {
    backgroundColor: '#1e1e1e',
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
  trackTitleActive: {
    color: '#2563eb',
  },
  trackArtist: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  trackDuration: {
    color: '#666',
    fontSize: 13,
    marginLeft: 8,
  },
});
