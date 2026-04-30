import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import api from '../services/api';
import MiniPlayer from '../components/MiniPlayer';
import {
  SearchIcon,
  HeartFilledIcon,
  ClockIcon,
  SettingsIcon,
  FolderIcon,
} from '../components/icons';
import type { RootStackParamList, Folder } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      const response = await api.get('/library/folders');
      setFolders(response.data.data);
      setError(null);
    } catch (err) {
      setError('无法加载音乐库');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const handleRefresh = () => { setIsRefreshing(true); fetchFolders(); };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: '#ff4444', fontSize: 16, marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFolders}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Quick actions */}
      <View style={[styles.quickActions, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Search')}>
          <View style={[styles.actionIconCircle, { backgroundColor: colors.accent }]}>
            <SearchIcon size={20} color="#fff" />
          </View>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Favorites')}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#e74c3c' }]}>
            <HeartFilledIcon size={20} color="#fff" />
          </View>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>收藏</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('History')}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#3498db' }]}>
            <ClockIcon size={20} color="#fff" />
          </View>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>最近</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#666' }]}>
            <SettingsIcon size={20} color="#fff" />
          </View>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>设置</Text>
        </TouchableOpacity>
      </View>

      {/* Folders list */}
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.folderItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Folder', { folderId: item.id, folderName: item.name })}
          >
            <View style={[styles.folderIcon, { backgroundColor: colors.surface }]}>
              <FolderIcon size={22} color={colors.textSecondary} />
            </View>
            <View style={styles.folderInfo}>
              <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.folderCount, { color: colors.textSecondary }]}>{item.trackCount} 首</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: 76 + insets.bottom }]}
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
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 16, borderBottomWidth: 1 },
  actionButton: { alignItems: 'center', gap: 8 },
  actionIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '500' },
  list: { paddingVertical: 8 },
  folderItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  folderIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  folderInfo: { flex: 1, marginLeft: 12 },
  folderName: { fontSize: 16, fontWeight: '500' },
  folderCount: { fontSize: 13, marginTop: 2 },
  arrow: { fontSize: 20 },
});
