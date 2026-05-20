import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { getAudioCacheUsageBytes } from '../services/audioCache';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const {
    serverUrl,
    lyricsSize,
    theme,
    audioCacheEnabled,
    audioCacheMaxMb,
    setServerUrl,
    setLyricsSize,
    setTheme,
    setAudioCacheEnabled,
    setAudioCacheMaxMb,
  } = useSettingsStore();
  const colors = useMemo(() => getColors(theme), [theme]);
  const [editServerUrl, setEditServerUrl] = useState(serverUrl);
  const [editCacheMaxMb, setEditCacheMaxMb] = useState(String(audioCacheMaxMb));
  const [cacheUsageMb, setCacheUsageMb] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    setEditCacheMaxMb(String(audioCacheMaxMb));
  }, [audioCacheMaxMb]);

  useEffect(() => {
    let mounted = true;
    getAudioCacheUsageBytes().then((bytes) => {
      if (mounted) setCacheUsageMb(bytes / 1024 / 1024);
    });
    return () => {
      mounted = false;
    };
  }, [audioCacheEnabled, audioCacheMaxMb]);

  const handleSaveServerUrl = () => {
    if (editServerUrl.trim()) { setServerUrl(editServerUrl.trim()); Alert.alert('提示', '服务器地址已更新'); }
  };

  const handleLogout = () => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSaveCacheMaxMb = () => {
    const value = Number(editCacheMaxMb);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('提示', '请输入有效的缓存空间大小');
      return;
    }
    setAudioCacheMaxMb(value);
    Alert.alert('提示', '音乐缓存空间已更新');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>账号</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>用户名</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>角色</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.role === 'admin' ? '管理员' : '普通用户'}</Text>
          </View>
        </View>
      </View>

      {user?.role === 'admin' && (
        <View style={styles.section}>
          <TouchableOpacity style={[styles.adminButton, { borderColor: colors.buttonPrimary }]} onPress={() => navigation.navigate('Admin' as never)}>
            <Text style={[styles.adminButtonText, { color: colors.buttonPrimary }]}>管理员控制台</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Server settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>服务器</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>服务器地址</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText }]}
              value={editServerUrl}
              onChangeText={setEditServerUrl}
              placeholder="http://192.168.31.184:3000"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveServerUrl}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Player settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>播放</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>歌词大小</Text>
          <View style={styles.optionRow}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.optionButton, { backgroundColor: colors.inputBg }, lyricsSize === size && styles.optionButtonActive]}
                onPress={() => setLyricsSize(size)}
              >
                <Text style={[styles.optionButtonText, { color: colors.textSecondary }, lyricsSize === size && styles.optionButtonTextActive]}>
                  {size === 'sm' ? '小' : size === 'md' ? '中' : '大'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>缓存音乐</Text>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                播放过的歌曲会在后台保存，超过容量后自动删除最久未使用的歌曲
              </Text>
            </View>
            <Switch
              value={audioCacheEnabled}
              onValueChange={setAudioCacheEnabled}
              trackColor={{ false: colors.inputBg, true: colors.accent }}
              thumbColor="#ffffff"
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>缓存空间上限</Text>
          <View style={styles.optionRow}>
            {[256, 512, 1024].map((maxMb) => (
              <TouchableOpacity
                key={maxMb}
                style={[styles.optionButton, { backgroundColor: colors.inputBg }, audioCacheMaxMb === maxMb && styles.optionButtonActive]}
                onPress={() => setAudioCacheMaxMb(maxMb)}
              >
                <Text style={[styles.optionButtonText, { color: colors.textSecondary }, audioCacheMaxMb === maxMb && styles.optionButtonTextActive]}>
                  {maxMb >= 1024 ? `${maxMb / 1024}GB` : `${maxMb}MB`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.inputRow, styles.cacheInputRow]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText }]}
              value={editCacheMaxMb}
              onChangeText={setEditCacheMaxMb}
              keyboardType="number-pad"
              placeholder="1024"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveCacheMaxMb}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.settingHint, { color: colors.textMuted }]}>
            当前约 {cacheUsageMb.toFixed(1)} MB / {audioCacheMaxMb} MB
          </Text>
        </View>
      </View>

      {/* Theme settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>外观</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>主题</Text>
          <View style={styles.optionRow}>
            {(['dark', 'light'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.optionButton, { backgroundColor: colors.inputBg }, theme === t && styles.optionButtonActive]}
                onPress={() => setTheme(t)}
              >
                <Text style={[styles.optionButtonText, { color: colors.textSecondary }, theme === t && styles.optionButtonTextActive]}>
                  {t === 'dark' ? '深色' : '浅色'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>退出登录</Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={[styles.versionText, { color: colors.textMuted }]}>StreamSound v0.2.0-alpha.8</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  card: { borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15 },
  inputLabel: { fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  saveButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionButton: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  optionButtonActive: { backgroundColor: '#2563eb' },
  optionButtonText: { fontSize: 14 },
  optionButtonTextActive: { color: '#fff' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  switchText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  settingHint: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  cacheInputRow: { marginTop: 10 },
  logoutButton: { backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  adminButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  adminButtonText: { fontSize: 16, fontWeight: '500' },
  versionText: { fontSize: 12, textAlign: 'center', paddingBottom: 32 },
});
