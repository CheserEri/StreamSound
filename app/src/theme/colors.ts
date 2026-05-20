import type { Theme } from '../types';

export function getColors(theme: Theme) {
  const isDark = theme === 'dark';
  return {
    // Background
    background: isDark ? '#121212' : '#f5f5f5',
    surface: isDark ? '#1e1e1e' : '#ffffff',
    surfaceAlt: isDark ? '#2a2a2a' : '#f0f0f0',

    // Text
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#666666',
    textMuted: isDark ? '#666666' : '#999999',

    // Navigation bar
    headerBg: isDark ? '#1a1a1a' : '#ffffff',
    headerText: isDark ? '#ffffff' : '#1a1a1a',
    headerTint: isDark ? '#ffffff' : '#1a1a1a',

    // Divider
    border: isDark ? '#222222' : '#e0e0e0',

    // Accent
    accent: '#1db954',
    accentText: '#ffffff',

    // MiniPlayer
    miniPlayerBg: isDark ? '#1e1e1e' : '#ffffff',
    miniPlayerText: isDark ? '#ffffff' : '#1a1a1a',
    miniPlayerSubtext: isDark ? '#888888' : '#888888',
    miniPlayerIcon: isDark ? '#ffffff' : '#1a1a1a',
    miniPlayerProgressBg: isDark ? '#333333' : '#e0e0e0',
    miniPlayerProgressFill: '#1db954',

    // Placeholder
    placeholder: isDark ? '#2a2a2a' : '#e8e8e8',
    placeholderIcon: isDark ? '#555555' : '#aaaaaa',

    // Input
    inputBg: isDark ? '#2a2a2a' : '#f0f0f0',
    inputText: isDark ? '#ffffff' : '#1a1a1a',

    // Button
    buttonPrimary: '#2563eb',
    buttonDanger: '#dc2626',
    buttonText: '#ffffff',

    // Active state
    activeBg: isDark ? '#1a1a2e' : '#e8f0fe',
    activeText: '#2563eb',

    // Error
    error: '#ff4444',

    // Player screen (always dark)
    playerText: '#ffffff',
    playerTextSecondary: '#888888',
    playerTextMuted: '#777777',
    playerDot: '#555555',
    playerDotActive: '#ffffff',
    playerHeaderSubtitle: '#aaaaaa',

    // Slider
    sliderActive: '#ffffff',
    sliderInactive: '#333333',
    sliderGlow: 'rgba(255, 255, 255, 0.3)',

    // Lyrics (always dark player background)
    lyricsActive: '#ffffff',
    lyricsPast: '#4a4a4a',
    lyricsFuture: '#7a7a7a',
    lyricsEmptyIcon: '#444444',
    lyricsEmptyText: '#666666',
    lyricsEmptyHint: '#444444',

    // Quick actions
    actionSearch: '#1db954',
    actionFavorites: '#e74c3c',
    actionHistory: '#3498db',
    actionSettings: '#666666',
    actionIconText: '#ffffff',

    // Heart
    heartFilled: '#ff4757',
    heartOutline: '#aaaaaa',
  };
}
