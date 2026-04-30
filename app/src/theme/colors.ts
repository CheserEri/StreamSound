import type { Theme } from '../types';

export function getColors(theme: Theme) {
  const isDark = theme === 'dark';
  return {
    // 背景
    background: isDark ? '#121212' : '#f5f5f5',
    surface: isDark ? '#1e1e1e' : '#ffffff',
    surfaceAlt: isDark ? '#2a2a2a' : '#f0f0f0',

    // 文字
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#666666',
    textMuted: isDark ? '#666666' : '#999999',

    // 导航栏
    headerBg: isDark ? '#1a1a1a' : '#ffffff',
    headerText: isDark ? '#ffffff' : '#1a1a1a',
    headerTint: isDark ? '#ffffff' : '#1a1a1a',

    // 分隔线
    border: isDark ? '#222222' : '#e0e0e0',

    // 强调色
    accent: '#1db954',
    accentText: '#ffffff',

    // MiniPlayer (始终使用卡片风格)
    miniPlayerBg: isDark ? '#1e1e1e' : '#ffffff',
    miniPlayerText: isDark ? '#ffffff' : '#1a1a1a',
    miniPlayerSubtext: isDark ? '#888888' : '#888888',
    miniPlayerIcon: isDark ? '#ffffff' : '#1a1a1a',
    miniPlayerProgressBg: isDark ? '#333333' : '#e0e0e0',

    // 占位符
    placeholder: isDark ? '#2a2a2a' : '#e8e8e8',
    placeholderIcon: isDark ? '#555555' : '#aaaaaa',

    // 输入框
    inputBg: isDark ? '#2a2a2a' : '#f0f0f0',
    inputText: isDark ? '#ffffff' : '#1a1a1a',

    // 按钮
    buttonPrimary: '#2563eb',
    buttonDanger: '#dc2626',
    buttonText: '#ffffff',

    // 激活状态
    activeBg: isDark ? '#1a1a2e' : '#e8f0fe',
    activeText: '#2563eb',
  };
}
