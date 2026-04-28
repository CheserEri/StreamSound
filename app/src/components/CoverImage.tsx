import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getCoverUrl } from '../services/player';

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

  if (!hasCover || error) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        <Text style={styles.placeholderText}>♪</Text>
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <FastImage
        source={{
          uri: getCoverUrl(trackId),
          cache: FastImage.cacheControl.immutable,
        }}
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
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CoverImage;
