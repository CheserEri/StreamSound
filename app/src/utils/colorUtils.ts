/**
 * 从专辑封面主色生成网易云风格的暗色渐变
 *
 * 网易云风格特征：
 * - 低饱和度（20-35%），不会太鲜艳
 * - 低明度（15-25%），足够暗以保证白色文字可读
 * - 色调保持一致，从上到下逐渐变暗
 */

/** 默认渐变（无封面时使用） */
export const DEFAULT_PLAYER_GRADIENT = ['#2a2a3a', '#1a1a28', '#0e0e18'] as string[];

/** Hex → RGB */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** RGB → HSL (h: 0-360, s: 0-1, l: 0-1) */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/** HSL → Hex */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 从封面主色生成播放器渐变（3 色）
 * 网易云风格：保持色调，大幅降低饱和度和明度
 */
export function generatePlayerGradient(hexColor?: string | null): string[] {
  if (!hexColor || hexColor.length < 7) return DEFAULT_PLAYER_GRADIENT;

  try {
    const [r, g, b] = hexToRgb(hexColor);
    let [h, s, l] = rgbToHsl(r, g, b);

    // 如果颜色接近灰色（饱和度极低），加入少量蓝色调避免单调
    if (s < 0.08) {
      h = 220;
      s = 0.08;
    }

    // 降低饱和度：目标 20-30%
    const targetSat = 0.15 + s * 0.2;
    s = Math.min(targetSat, 0.32);

    // 生成 3 个渐变色标（从亮到暗）
    const top = hslToHex(h, s, 0.22);
    const mid = hslToHex(h, s, 0.16);
    const bottom = hslToHex(h, s, 0.10);

    return [top, mid, bottom];
  } catch {
    return DEFAULT_PLAYER_GRADIENT;
  }
}

/**
 * 从封面主色生成氛围遮罩颜色（极暗版本，用于模糊封面叠加层）
 * 保留色调但极度压暗，让模糊封面的色彩透出
 */
export function generateAtmosphereOverlay(hexColor?: string | null): string {
  if (!hexColor || hexColor.length < 7) return 'rgba(0, 0, 0, 0.22)';

  try {
    const [r, g, b] = hexToRgb(hexColor);
    let [h, s] = rgbToHsl(r, g, b);

    if (s < 0.08) {
      h = 220;
      s = 0.06;
    }

    // 极低饱和度 + 极低明度
    s = Math.min(s * 0.4, 0.18);
    return hslToHex(h, s, 0.06);
  } catch {
    return 'rgba(0, 0, 0, 0.22)';
  }
}

/**
 * 从封面主色生成唱片环颜色（深色版本）
 */
export function generateDiscColors(hexColor?: string | null): {
  ring: string;
  ringBorder: string;
  center: string;
  centerBorder: string;
} {
  if (!hexColor || hexColor.length < 7) {
    return {
      ring: '#1a1a1a',
      ringBorder: '#333333',
      center: '#0a0a0a',
      centerBorder: '#333333',
    };
  }

  try {
    const [r, g, b] = hexToRgb(hexColor);
    let [h, s] = rgbToHsl(r, g, b);

    if (s < 0.08) {
      h = 220;
      s = 0.08;
    }

    s = Math.min(s * 0.5, 0.2);

    return {
      ring: hslToHex(h, s, 0.10),
      ringBorder: hslToHex(h, s, 0.18),
      center: hslToHex(h, s, 0.04),
      centerBorder: hslToHex(h, s, 0.15),
    };
  } catch {
    return {
      ring: '#1a1a1a',
      ringBorder: '#333333',
      center: '#0a0a0a',
      centerBorder: '#333333',
    };
  }
}
