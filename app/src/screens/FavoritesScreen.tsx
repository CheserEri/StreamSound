import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore, usePlayerStore } from '../store';
import { getColors } from '../theme/colors';
import api from '../services/api';
import { usePlayerActions } from '../hooks/usePlayer';
import MiniPlayer from '../components/MiniPlayer';
import CoverImage from '../components/CoverImage';
import { HeartFilledIcon } from '../components/icons';
import { formatDuration, formatRelativeTime } from '../utils/format';
import type { FavoriteTrack } from '../types';

export default function FavoritesScreen() {
  const { playTracks } = usePlayerActions();
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const currentTrack = usePlayerStore((s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : null));
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await api.get('/favorites', { params: { limit: 100 }, signal });
      setFavorites(response.data.data);
      setError(null);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') setError('无法加载收藏列表');
    } finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { const c = new AbortController(); fetchFavorites(c.signal); return () => c.abort(); }, [fetchFavorites]);
  const handleRefresh = () => { setIsRefreshing(true); fetchFavorites(); };
  const handleTrackPress = (track: FavoriteTrack) => {
    const tracks = favorites.map((f) => ({ ...f, hasLyrics: false, folderId: 0 }));
    playTracks(tracks, favorites.findIndex((f) => f.id === track.id));
  };

  if (isLoading) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.textSecondary }}>加载中...</Text></View>;
  if (error) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.error, marginBottom: 16 }}>{error}</Text>
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]} onPress={() => fetchFavorites()}><Text style={[styles.retryText, { color: colors.buttonText }]}>重试</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isCurrentTrack = currentTrack?.id === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.trackItem,
                isCurrentTrack && { backgroundColor: colors.activeBg, borderLeftWidth: 3, borderLeftColor: colors.accent },
              ]}
              onPress={() => handleTrackPress(item)}
            >
              <CoverImage trackId={item.id} hasCover={item.hasCover} size={48} />
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: isCurrentTrack ? colors.activeText : colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist || '未知艺术家'}</Text>
              </View>
              <View style={styles.trackMeta}>
                <Text style={[styles.trackDuration, { color: colors.textMuted }]}>{formatDuration(item.duration)}</Text>
                <Text style={[styles.favoritedAt, { color: colors.textMuted }]}>{formatRelativeTime(item.favoritedAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
        contentContainerStyle={[styles.list, { paddingBottom: 76 + insets.bottom }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <HeartFilledIcon size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无收藏</Text>
          </View>
        }
      />
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { fontSize: 14 },
  list: { paddingVertical: 8 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14 },
  trackItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { fontSize: 15, fontWeight: '500' },
  trackArtist: { fontSize: 13, marginTop: 2 },
  trackMeta: { alignItems: 'flex-end', marginLeft: 8 },
  trackDuration: { fontSize: 13 },
  favoritedAt: { fontSize: 11, marginTop: 2 },
});
