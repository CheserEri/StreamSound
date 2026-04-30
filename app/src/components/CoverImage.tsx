/**
 * 封面图片组件
 * 用于显示音乐封面，支持加载状态和错误处理
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { MusicNoteIcon } from './icons';
import FastImage from 'react-native-fast-image';
import { getCoverUrl } from '../services/player';
import { getString, STORAGE_KEYS } from '../services/storage';

/**
 * 封面图片组件属性接口
 */
interface CoverImageProps {
  /** 歌曲ID */
  trackId: number;
  /** 是否有封面 */
  hasCover: boolean;
  /** 图片尺寸，默认48 */
  size?: number;
  /** 圆角半径，默认6 */
  borderRadius?: number;
  /** 自定义样式 */
  style?: ViewStyle;
}

/**
 * 封面图片组件
 * 使用 React.memo 进行性能优化，避免不必要的重渲染
 */
const CoverImage = React.memo(function CoverImage({
  trackId,
  hasCover,
  size = 48,
  borderRadius = 6,
  style,
}: CoverImageProps) {
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 错误状态
  const [error, setError] = useState(false);

  // 构建带认证头的图片源
  const source = useMemo(() => {
    const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
    return {
      uri: getCoverUrl(trackId),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: FastImage.cacheControl.immutable,
    };
  }, [trackId]);

  // 如果没有封面或加载失败，显示占位符
  if (!hasCover || error) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        <MusicNoteIcon size={size * 0.4} color="#555" />
      </View>
    );
  }

  // 正常显示封面图片
  return (
    <View style={[{ width: size, height: size }, style]}>
      <FastImage
        source={source}
        style={{ width: size, height: size, borderRadius }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {/* 加载指示器 */}
      {loading && (
        <ActivityIndicator
          size="small"
          color="#666"
          style={styles.loader}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: '#666',
  },
  // placeholder icon is now SVG, no text style needed
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CoverImage;
