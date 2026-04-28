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
import { usePlayer } from '../hooks/usePlayer';
import type { RootStackParamList, TrackListItem } from '../types';
import { getCoverUrl } from '../services/player';
import FastImage from 'react-native-fast-image';

type RouteProps = RouteProp<RootStackParamList, 'Folder'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FolderScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { folderId, folderName } = route.params;
  const { playTracks, currentTrack, isPlaying } = usePlayer();

  const [tracks, setTracks] = useState<TrackListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });

  const fetchTracks = useCallback(async (offset = 0) => {
    try {
      const response = await api.get(`/library/folders/${folderId}/tracks`, {
        params: { limit: 50, offset, sort: 'title', order: 'asc' },
      });
      if (offset === 0) {
        setTracks(response.data.data);
      } else {
        setTracks((prev) => [...prev, ...response.data.data]);
      }
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('无法加载曲目');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchTracks();
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Text style={styles.actionButtonText}>▶ 全部播放</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShufflePlay}>
          <Text style={styles.actionButtonText}>🔀 随机播放</Text>
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
              {item.hasCover ? (
                <FastImage
                  source={{ uri: getCoverUrl(item.id) }}
                  style={styles.trackCover}
                />
              ) : (
                <View style={[styles.trackCover, styles.trackCoverPlaceholder]}>
                  <Text style={styles.trackCoverText}>♪</Text>
                </View>
              )}
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
