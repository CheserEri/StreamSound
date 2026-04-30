import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import api from '../services/api';
import { usePlayerActions } from '../hooks/usePlayer';
import MiniPlayer from '../components/MiniPlayer';
import CoverImage from '../components/CoverImage';
import { formatDuration, formatRelativeTime } from '../utils/format';
import type { HistoryTrack } from '../types';

export default function HistoryScreen() {
  const { playTracks } = usePlayerActions();
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
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
      if (err?.code !== 'ERR_CANCELED') setError('无法加载播放历史');
    } finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { const c = new AbortController(); fetchHistory(c.signal); return () => c.abort(); }, [fetchHistory]);
  const handleRefresh = () => { setIsRefreshing(true); fetchHistory(); };
  const handleTrackPress = (track: HistoryTrack) => {
    const tracks = history.map((h) => ({ ...h, hasLyrics: false, folderId: 0 }));
    playTracks(tracks, history.findIndex((h) => h.id === track.id));
  };

  if (isLoading) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.textSecondary }}>加载中...</Text></View>;
  if (error) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ color: '#ff4444', marginBottom: 16 }}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchHistory()}><Text style={styles.retryText}>重试</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => `${item.id}-${item.playedAt}`}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.trackItem} onPress={() => handleTrackPress(item)}>
            <CoverImage trackId={item.id} hasCover={item.hasCover} size={48} />
            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist || '未知艺术家'}</Text>
            </View>
            <View style={styles.trackMeta}>
              <Text style={[styles.trackDuration, { color: colors.textMuted }]}>{formatDuration(item.duration)}</Text>
              <Text style={[styles.playedAt, { color: colors.textMuted }]}>{formatRelativeTime(item.playedAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
        contentContainerStyle={[styles.list, { paddingBottom: 76 }]}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={{ color: colors.textMuted }}>暂无播放记录</Text></View>}
      />
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14 },
  list: { paddingVertical: 8 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  trackItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { fontSize: 15, fontWeight: '500' },
  trackArtist: { fontSize: 13, marginTop: 2 },
  trackMeta: { alignItems: 'flex-end', marginLeft: 8 },
  trackDuration: { fontSize: 13 },
  playedAt: { fontSize: 11, marginTop: 2 },
});
