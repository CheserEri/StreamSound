import React, { useEffect, useState, useCallback } from 'react';
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
import api from '../services/api';
import type { RootStackParamList, Folder } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
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

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFolders();
  };

  const handleFolderPress = (folder: Folder) => {
    navigation.navigate('Folder', {
      folderId: folder.id,
      folderName: folder.name,
    });
  };

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handleFavoritesPress = () => {
    navigation.navigate('Favorites');
  };

  const handleHistoryPress = () => {
    navigation.navigate('History');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchFolders}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSearchPress}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleFavoritesPress}>
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={styles.actionText}>收藏</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleHistoryPress}>
          <Text style={styles.actionIcon}>🕐</Text>
          <Text style={styles.actionText}>最近</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSettingsPress}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>设置</Text>
        </TouchableOpacity>
      </View>

      {/* Folders list */}
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.folderItem}
            onPress={() => handleFolderPress(item)}
          >
            <View style={styles.folderIcon}>
              <Text style={styles.folderIconText}>📁</Text>
            </View>
            <View style={styles.folderInfo}>
              <Text style={styles.folderName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.folderCount}>{item.trackCount} 首</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    color: '#ccc',
    fontSize: 12,
  },
  list: {
    paddingVertical: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderIconText: {
    fontSize: 20,
  },
  folderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  folderName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  folderCount: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  arrow: {
    color: '#666',
    fontSize: 20,
  },
});
