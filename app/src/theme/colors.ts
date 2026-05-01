import type { Theme } from '../types';

// Curated dark atmospheric gradients for player background
// Each palette: [top, mid, bottom] -- always dark enough for white text
const PLAYER_GRADIENTS: string[][] = [
  ['#1a1a2e', '#121218', '#0a0a12'], // deep navy (default)
  ['#1e1428', '#140e1c', '#0a0810'], // dark purple
  ['#1a2420', '#101a16', '#080e0a'], // forest green
  ['#241a1a', '#1a1010', '#0e0808'], // dark burgundy
  ['#1a1e28', '#10141e', '#080a10'], // steel blue
  ['#221a14', '#18100e', '#0c0806'], // dark amber
  ['#1a2020', '#101616', '#080a0a'], // teal
  ['#201820', '#161016', '#0a080a'], // plum
];

export function getPlayerGradient(colorIndex: number): string[] {
  return PLAYER_GRADIENTS[Math.abs(colorIndex) % PLAYER_GRADIENTS.length];
}

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
    playerGradientDefault: ['#1a1a2e', '#121218', '#0a0a12'] as string[],

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

    // Disc cover
    discRing: '#1a1a1a',
    discRingBorder: '#333333',
    discCenter: '#0a0a0a',
    discCenterBorder: '#333333',

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
