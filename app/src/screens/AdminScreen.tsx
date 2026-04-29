import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import api from '../services/api';

interface AdminUser {
  id: number;
  username: string;
  role: 'user' | 'admin';
  approved: boolean;
  createdAt: number;
}

interface ScanState {
  status: 'idle' | 'running';
  scanned: number;
  added: number;
  updated: number;
  removed: number;
  startedAt: number | null;
  finishedAt: number | null;
  error: string | null;
}

export default function AdminScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [musicRoot, setMusicRoot] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || '获取用户列表失败';
      Alert.alert('错误', message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchScanStatus = useCallback(async () => {
    try {
      const response = await api.get('/admin/scan/status');
      setScanState(response.data.data);
      setIsScanning(response.data.data.status === 'running');
    } catch {
      // Silent fail
    }
  }, []);

  const fetchMusicRoot = useCallback(async () => {
    try {
      const response = await api.get('/admin/scan/music-root');
      setMusicRoot(response.data.data.musicRoot);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchScanStatus();
    fetchMusicRoot();
  }, [fetchUsers, fetchScanStatus, fetchMusicRoot]);

  // Poll scan status while running
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(fetchScanStatus, 2000);
    return () => clearInterval(interval);
  }, [isScanning, fetchScanStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchScanStatus(), fetchMusicRoot()]);
    setRefreshing(false);
  }, [fetchUsers, fetchScanStatus, fetchMusicRoot]);

  const handleStartScan = useCallback(async () => {
    const trimmedPath = musicRoot.trim();
    if (!trimmedPath) {
      Alert.alert('提示', '请先输入音乐文件夹路径');
      return;
    }
    try {
      await api.post('/admin/scan', { musicRoot: trimmedPath });
      setIsScanning(true);
      fetchScanStatus();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || '启动扫描失败';
      Alert.alert('错误', message);
    }
  }, [fetchScanStatus, musicRoot]);

  const handleApproveUser = useCallback(
    async (userId: number, approved: boolean) => {
      try {
        await api.patch(`/admin/users/${userId}/approve`, { approved });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, approved } : u)),
        );
      } catch (error: any) {
        const message = error?.response?.data?.error?.message || '操作失败';
        Alert.alert('错误', message);
      }
    },
    [],
  );

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScanSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>音乐库扫描</Text>
      <View style={styles.scanCard}>
        <Text style={styles.pathLabel}>音乐文件夹路径</Text>
        <TextInput
          style={styles.pathInput}
          value={musicRoot}
          onChangeText={setMusicRoot}
          placeholder="输入服务器上的音乐文件夹路径"
          placeholderTextColor="#666"
          editable={!isScanning}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.scanHeader}>
          <Text style={styles.scanStatus}>
            状态: {scanState?.status === 'running' ? '扫描中...' : '空闲'}
          </Text>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={handleStartScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>开始扫描</Text>
            )}
          </TouchableOpacity>
        </View>

        {scanState && (
          <View style={styles.scanStats}>
            <View style={styles.scanStat}>
              <Text style={styles.scanStatValue}>{scanState.scanned}</Text>
              <Text style={styles.scanStatLabel}>已扫描</Text>
            </View>
            <View style={styles.scanStat}>
              <Text style={[styles.scanStatValue, { color: '#22c55e' }]}>
                +{scanState.added}
              </Text>
              <Text style={styles.scanStatLabel}>新增</Text>
            </View>
            <View style={styles.scanStat}>
              <Text style={[styles.scanStatValue, { color: '#eab308' }]}>
                ~{scanState.updated}
              </Text>
              <Text style={styles.scanStatLabel}>更新</Text>
            </View>
            <View style={styles.scanStat}>
              <Text style={[styles.scanStatValue, { color: '#ef4444' }]}>
                -{scanState.removed}
              </Text>
              <Text style={styles.scanStatLabel}>删除</Text>
            </View>
          </View>
        )}

        {scanState?.error && (
          <Text style={styles.scanError}>{scanState.error}</Text>
        )}

        {scanState?.finishedAt && (
          <Text style={styles.scanTime}>
            上次完成: {formatTime(scanState.finishedAt)}
          </Text>
        )}
      </View>
    </View>
  );

  const renderUserItem = ({ item }: { item: AdminUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userMeta}>
          {item.role === 'admin' ? '管理员' : '用户'} ·{' '}
          {item.approved ? '已审核' : '待审核'}
        </Text>
      </View>
      {item.role !== 'admin' && (
        <TouchableOpacity
          style={[
            styles.approveButton,
            item.approved && styles.approveButtonRevoke,
          ]}
          onPress={() => handleApproveUser(item.id, !item.approved)}
        >
          <Text
            style={[
              styles.approveButtonText,
              item.approved && styles.approveButtonTextRevoke,
            ]}
          >
            {item.approved ? '撤销' : '通过'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        ListHeaderComponent={
          <>
            {renderScanSection()}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>用户管理</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoadingUsers ? (
            <View style={styles.center}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>暂无用户</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
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
  list: {
    paddingBottom: 16,
  },
  center: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scanCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  pathLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
  },
  pathInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 14,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanStatus: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#333',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scanStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scanStat: {
    alignItems: 'center',
  },
  scanStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  scanStatLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  scanError: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 12,
  },
  scanTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  userMeta: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  approveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveButtonRevoke: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  approveButtonTextRevoke: {
    color: '#888',
  },
});
