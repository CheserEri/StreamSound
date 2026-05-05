import type { Theme } from '../types';

export function getColors(theme: Theme) {
  const isDark = theme === 'dark';
  return {
    // Background
    background: isDark ? '#1c1c1e' : '#f5f5f7',
    surface: isDark ? '#2c2c2e' : '#ffffff',
    surfaceHover: isDark ? '#3a3a3c' : '#f0f0f2',
    surfaceAlt: isDark ? '#232326' : '#e8e8ed',

    // Text
    text: isDark ? '#f5f5f7' : '#1d1d1f',
    textSecondary: isDark ? '#98989d' : '#6e6e73',
    textMuted: isDark ? '#636366' : '#aeaeb2',

    // Border
    border: isDark ? '#38383a' : '#d2d2d7',

    // Accent (Apple Music red/pink)
    accent: '#fc3c44',
    accentHover: '#ff5a5f',
    accentText: '#ffffff',

    // Navigation
    sidebarBg: isDark ? '#1c1c1e' : '#fbfbfd',
    sidebarActive: isDark ? '#2c2c2e' : '#e8e8ed',
    headerBg: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)',
    headerBorder: isDark ? '#38383a' : '#d2d2d7',

    // MiniPlayer
    miniPlayerBg: isDark ? '#2c2c2e' : '#ffffff',
    miniPlayerBorder: isDark ? '#38383a' : '#d2d2d7',

    // Input
    inputBg: isDark ? '#2c2c2e' : '#ffffff',
    inputBorder: isDark ? '#48484a' : '#d2d2d7',
    inputText: isDark ? '#f5f5f7' : '#1d1d1f',
    inputPlaceholder: isDark ? '#636366' : '#aeaeb2',

    // Button
    buttonPrimary: '#fc3c44',
    buttonPrimaryHover: '#ff5a5f',
    buttonSecondary: isDark ? '#3a3a3c' : '#e8e8ed',
    buttonSecondaryText: isDark ? '#f5f5f7' : '#1d1d1f',
    buttonDanger: '#ff453a',
    buttonText: '#ffffff',

    // Active state
    activeBg: isDark ? 'rgba(252,60,68,0.12)' : 'rgba(252,60,68,0.08)',
    activeText: '#fc3c44',

    // Error
    error: '#ff453a',
    errorBg: isDark ? 'rgba(255,69,58,0.12)' : 'rgba(255,69,58,0.08)',

    // Success
    success: '#30d158',

    // Player (always dark)
    playerBg: '#000000',
    playerText: '#f5f5f7',
    playerTextSecondary: '#98989d',
    playerTextMuted: '#636366',

    // Lyrics
    lyricsActive: '#f5f5f7',
    lyricsPast: '#48484a',
    lyricsFuture: '#636366',
    lyricsEmptyIcon: '#48484a',
    lyricsEmptyText: '#636366',

    // Slider
    sliderActive: '#fc3c44',
    sliderInactive: isDark ? '#48484a' : '#d2d2d7',
    sliderThumb: '#ffffff',

    // Scrollbar
    scrollbar: isDark ? '#48484a' : '#c7c7cc',
    scrollbarHover: isDark ? '#636366' : '#aeaeb2',

    // Quick actions
    actionSearch: '#fc3c44',
    actionFavorites: '#ff9f0a',
    actionHistory: '#0a84ff',
    actionSettings: '#636366',
    actionIconText: '#ffffff',

    // Heart
    heartFilled: '#fc3c44',
    heartOutline: '#636366',

    // Placeholder
    placeholder: isDark ? '#2c2c2e' : '#e8e8ed',
    placeholderIcon: isDark ? '#48484a' : '#aeaeb2',
  };
}

export type Colors = ReturnType<typeof getColors>;
