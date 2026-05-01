/**
 * Album cover image with FastImage, loading state, and placeholder
 */
import React, { useState, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { MusicNoteIcon } from './icons';
import FastImage from 'react-native-fast-image';
import { getCoverUrl } from '../services/player';
import { getString, STORAGE_KEYS } from '../services/storage';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';

interface CoverImageProps {
  trackId: number;
  hasCover: boolean;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const CoverImage = React.memo(function CoverImage({
  trackId,
  hasCover,
  size = 48,
  borderRadius = 6,
  style,
}: CoverImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);

  const source = useMemo(() => {
    const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
    return {
      uri: getCoverUrl(trackId),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: FastImage.cacheControl.immutable,
    };
  }, [trackId]);

  if (!hasCover || error) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size, borderRadius, backgroundColor: colors.placeholder },
          style,
        ]}
      >
        <MusicNoteIcon size={size * 0.4} color={colors.placeholderIcon} />
      </View>
    );
  }

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
      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.placeholderIcon}
          style={styles.loader}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CoverImage;
