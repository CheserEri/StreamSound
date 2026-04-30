/**
 * 动态渐变背景
 * 根据专辑封面颜色生成渐变背景
 * 如果没有颜色提取，使用默认深色渐变
 */
import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GradientBackgroundProps {
  /** 自定义渐变色 [top, bottom] */
  colors?: string[];
  children?: React.ReactNode;
  style?: object;
}

const DEFAULT_COLORS = ['#1a1a2e', '#0f0f1a', '#0a0a12'];

export default function GradientBackground({
  colors = DEFAULT_COLORS,
  children,
  style,
}: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
