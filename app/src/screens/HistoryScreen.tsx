import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore, usePlayerStore } from '../store';
import { getColors } from '../theme/colors';
import api from '../services/api';
import { usePlayerActions } from '../hooks/usePlayer';
import MiniPlayer from '../components/MiniPlayer';
import CoverImage from '../components/CoverImage';
import { ClockIcon } from '../components/icons';
import { formatDuration, formatRelativeTime } from '../utils/format';
import type { HistoryTrack } from '../types';

export default function HistoryScreen() {
  const { playTracks } = usePlayerActions();
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const currentTrack = usePlayerStore((s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : null));
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
      <Text style={{ color: colors.error, marginBottom: 16 }}>{error}</Text>
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]} onPress={() => fetchHistory()}><Text style={[styles.retryText, { color: colors.buttonText }]}>重试</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => `${item.id}-${item.playedAt}`}
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
                <Text style={[styles.playedAt, { color: colors.textMuted }]}>{formatRelativeTime(item.playedAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
        contentContainerStyle={[styles.list, { paddingBottom: 76 + insets.bottom }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClockIcon size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无播放记录</Text>
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
  playedAt: { fontSize: 11, marginTop: 2 },
});
