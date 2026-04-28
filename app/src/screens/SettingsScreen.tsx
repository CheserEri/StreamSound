import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuthStore, useSettingsStore } from '../store';
import { getServerUrl } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { serverUrl, lyricsSize, theme, setServerUrl, setLyricsSize, setTheme } = useSettingsStore();
  const [editServerUrl, setEditServerUrl] = useState(serverUrl);
  const navigation = useNavigation();

  const handleSaveServerUrl = () => {
    if (editServerUrl.trim()) {
      setServerUrl(editServerUrl.trim());
      Alert.alert('提示', '服务器地址已更新');
    }
  };

  const handleLogout = () => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账号</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>用户名</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>角色</Text>
            <Text style={styles.infoValue}>
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </Text>
          </View>
        </View>
      </View>

      {/* Admin panel - only visible to admins */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('Admin' as never)}
          >
            <Text style={styles.adminButtonText}>管理员控制台</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Server settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>服务器</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>服务器地址</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={editServerUrl}
              onChangeText={setEditServerUrl}
              placeholder="http://192.168.1.100:3000"
              placeholderTextColor="#666"
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
        <Text style={styles.sectionTitle}>播放</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>歌词大小</Text>
          <View style={styles.optionRow}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionButton,
                  lyricsSize === size && styles.optionButtonActive,
                ]}
                onPress={() => setLyricsSize(size)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    lyricsSize === size && styles.optionButtonTextActive,
                  ]}
                >
                  {size === 'sm' ? '小' : size === 'md' ? '中' : '大'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Theme settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>外观</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>主题</Text>
          <View style={styles.optionRow}>
            {(['dark', 'light'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.optionButton,
                  theme === t && styles.optionButtonActive,
                ]}
                onPress={() => setTheme(t)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    theme === t && styles.optionButtonTextActive,
                  ]}
                >
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
        <Text style={styles.versionText}>StreamSound v0.1.0-alpha.1</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 15,
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
  },
  inputLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#2563eb',
  },
  optionButtonText: {
    color: '#888',
    fontSize: 14,
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  adminButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  adminButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 32,
  },
});
