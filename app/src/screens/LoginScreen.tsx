import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState(useSettingsStore.getState().serverUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login, register, isLoading } = useAuthStore();
  const { setServerUrl: saveServerUrl, theme } = useSettingsStore();
  const colors = useMemo(() => getColors(theme), [theme]);

  const handleSubmit = async () => {
    if (!serverUrl.trim()) { Alert.alert('提示', '请输入服务器地址'); return; }
    if (!username.trim() || !password.trim()) { Alert.alert('提示', '请输入用户名和密码'); return; }
    saveServerUrl(serverUrl.trim());
    try {
      if (isRegisterMode) {
        const result = await register(username.trim(), password);
        Alert.alert('提示', result.message);
        if (result.approved) setIsRegisterMode(false);
      } else {
        await login(username.trim(), password);
      }
    } catch (error: any) {
      Alert.alert('提示', error?.response?.data?.error?.message || '操作失败，请重试');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>StreamSound</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>私有流媒体音乐</Text>
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
            placeholder="服务器地址 (如: 192.168.31.184:3000)"
            placeholderTextColor={colors.textMuted}
            value={serverUrl} onChangeText={setServerUrl} autoCapitalize="none" autoCorrect={false}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
            placeholder="用户名" placeholderTextColor={colors.textMuted}
            value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
            placeholder="密码" placeholderTextColor={colors.textMuted}
            value={password} onChangeText={setPassword} secureTextEntry
          />
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegisterMode ? '注册' : '登录'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchButton} onPress={() => setIsRegisterMode(!isRegisterMode)}>
            <Text style={styles.switchText}>{isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 36, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 48 },
  form: { gap: 16 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1 },
  button: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchButton: { alignItems: 'center', paddingVertical: 12 },
  switchText: { color: '#2563eb', fontSize: 14 },
});
