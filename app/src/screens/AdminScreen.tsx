import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import api from '../services/api';

interface AdminUser { id: number; username: string; role: 'user' | 'admin'; approved: boolean; createdAt: number; }
interface ScanState { status: 'idle' | 'running'; scanned: number; added: number; updated: number; removed: number; startedAt: number | null; finishedAt: number | null; error: string | null; }

export default function AdminScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [musicRoot, setMusicRoot] = useState('');

  const fetchUsers = useCallback(async () => {
    try { const r = await api.get('/admin/users'); setUsers(r.data.data); }
    catch (e: any) { Alert.alert('错误', e?.response?.data?.error?.message || '获取用户列表失败'); }
    finally { setIsLoadingUsers(false); }
  }, []);

  const fetchScanStatus = useCallback(async () => {
    try { const r = await api.get('/admin/scan/status'); setScanState(r.data.data); setIsScanning(r.data.data.status === 'running'); } catch {}
  }, []);

  const fetchMusicRoot = useCallback(async () => {
    try { const r = await api.get('/admin/scan/music-root'); setMusicRoot(r.data.data.musicRoot); } catch {}
  }, []);

  useEffect(() => { fetchUsers(); fetchScanStatus(); fetchMusicRoot(); }, [fetchUsers, fetchScanStatus, fetchMusicRoot]);
  useEffect(() => { if (!isScanning) return; const i = setInterval(fetchScanStatus, 2000); return () => clearInterval(i); }, [isScanning, fetchScanStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchScanStatus(), fetchMusicRoot()]);
    setRefreshing(false);
  }, [fetchUsers, fetchScanStatus, fetchMusicRoot]);

  const handleStartScan = useCallback(async () => {
    const trimmedPath = musicRoot.trim();
    if (!trimmedPath) { Alert.alert('提示', '请先输入音乐文件夹路径'); return; }
    try { await api.post('/admin/scan', { musicRoot: trimmedPath }); setIsScanning(true); fetchScanStatus(); }
    catch (e: any) { Alert.alert('错误', e?.response?.data?.error?.message || '启动扫描失败'); }
  }, [fetchScanStatus, musicRoot]);

  const handleApproveUser = useCallback(async (userId: number, approved: boolean) => {
    try { await api.patch(`/admin/users/${userId}/approve`, { approved }); setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, approved } : u))); }
    catch (e: any) { Alert.alert('错误', e?.response?.data?.error?.message || '操作失败'); }
  }, []);

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '--';
    return new Date(timestamp * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const renderScanSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>音乐库扫描</Text>
      <View style={[styles.scanCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.pathLabel, { color: colors.textSecondary }]}>音乐文件夹路径</Text>
        <TextInput
          style={[styles.pathInput, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
          value={musicRoot} onChangeText={setMusicRoot}
          placeholder="输入服务器上的音乐文件夹路径" placeholderTextColor={colors.textMuted}
          editable={!isScanning} autoCapitalize="none" autoCorrect={false}
        />
        <View style={styles.scanHeader}>
          <Text style={[styles.scanStatus, { color: colors.text }]}>状态: {scanState?.status === 'running' ? '扫描中...' : '空闲'}</Text>
          <TouchableOpacity style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} onPress={handleStartScan} disabled={isScanning}>
            {isScanning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.scanButtonText}>开始扫描</Text>}
          </TouchableOpacity>
        </View>
        {scanState && (
          <View style={styles.scanStats}>
            <View style={styles.scanStat}><Text style={[styles.scanStatValue, { color: colors.text }]}>{scanState.scanned}</Text><Text style={[styles.scanStatLabel, { color: colors.textMuted }]}>已扫描</Text></View>
            <View style={styles.scanStat}><Text style={[styles.scanStatValue, { color: '#22c55e' }]}>+{scanState.added}</Text><Text style={[styles.scanStatLabel, { color: colors.textMuted }]}>新增</Text></View>
            <View style={styles.scanStat}><Text style={[styles.scanStatValue, { color: '#eab308' }]}>~{scanState.updated}</Text><Text style={[styles.scanStatLabel, { color: colors.textMuted }]}>更新</Text></View>
            <View style={styles.scanStat}><Text style={[styles.scanStatValue, { color: '#ef4444' }]}>-{scanState.removed}</Text><Text style={[styles.scanStatLabel, { color: colors.textMuted }]}>删除</Text></View>
          </View>
        )}
        {scanState?.error && <Text style={styles.scanError}>{scanState.error}</Text>}
        {scanState?.finishedAt && <Text style={[styles.scanTime, { color: colors.textMuted }]}>上次完成: {formatTime(scanState.finishedAt)}</Text>}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.userItem, { borderBottomColor: colors.border }]}>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
              <Text style={[styles.userMeta, { color: colors.textSecondary }]}>{item.role === 'admin' ? '管理员' : '用户'} · {item.approved ? '已审核' : '待审核'}</Text>
            </View>
            {item.role !== 'admin' && (
              <TouchableOpacity
                style={[styles.approveButton, item.approved && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                onPress={() => handleApproveUser(item.id, !item.approved)}
              >
                <Text style={[styles.approveButtonText, item.approved && { color: colors.textSecondary }]}>{item.approved ? '撤销' : '通过'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListHeaderComponent={<>{renderScanSection()}<View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>用户管理</Text></View></>}
        ListEmptyComponent={isLoadingUsers ? <View style={styles.center}><ActivityIndicator color={colors.textSecondary} /></View> : <View style={styles.center}><Text style={{ color: colors.textMuted }}>暂无用户</Text></View>}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 16 },
  center: { padding: 40, alignItems: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  scanCard: { borderRadius: 12, padding: 16, marginHorizontal: 16 },
  pathLabel: { fontSize: 13, marginBottom: 6 },
  pathInput: { fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, borderWidth: 1 },
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  scanStatus: { fontSize: 15, fontWeight: '500' },
  scanButton: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  scanButtonDisabled: { backgroundColor: '#333' },
  scanButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  scanStats: { flexDirection: 'row', justifyContent: 'space-around' },
  scanStat: { alignItems: 'center' },
  scanStatValue: { fontSize: 20, fontWeight: '600' },
  scanStatLabel: { fontSize: 12, marginTop: 4 },
  scanError: { color: '#ef4444', fontSize: 13, marginTop: 12 },
  scanTime: { fontSize: 12, marginTop: 12 },
  userItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '500' },
  userMeta: { fontSize: 13, marginTop: 2 },
  approveButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  approveButtonText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
