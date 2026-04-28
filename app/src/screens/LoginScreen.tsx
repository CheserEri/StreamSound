import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore, useSettingsStore } from '../store';

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState(useSettingsStore.getState().serverUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login, register, isLoading } = useAuthStore();
  const { setServerUrl: saveServerUrl } = useSettingsStore();

  const handleSubmit = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('提示', '请输入服务器地址');
      return;
    }
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }

    saveServerUrl(serverUrl.trim());

    try {
      if (isRegisterMode) {
        const result = await register(username.trim(), password);
        Alert.alert('提示', result.message);
        if (result.approved) {
          setIsRegisterMode(false);
        }
      } else {
        await login(username.trim(), password);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || '操作失败，请重试';
      Alert.alert('提示', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>StreamSound</Text>
        <Text style={styles.subtitle}>私有流媒体音乐</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="服务器地址 (如: 192.168.1.100:3000)"
            placeholderTextColor="#666"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegisterMode ? '注册' : '登录'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsRegisterMode(!isRegisterMode)}
          >
            <Text style={styles.switchText}>
              {isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    color: '#2563eb',
    fontSize: 14,
  },
});
