import React from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getCoverUrl } from '../services/player';

interface CoverImageProps {
  trackId: number;
  hasCover: boolean;
  size?: number;
  style?: object;
}

export default function CoverImage({
  trackId,
  hasCover,
  size = 48,
  style,
}: CoverImageProps) {
  if (!hasCover) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size },
          style,
        ]}
      >
        <View style={styles.placeholderText}>♪</View>
      </View>
    );
  }

  return (
    <FastImage
      source={{ uri: getCoverUrl(trackId) }}
      style={[
        { width: size, height: size },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  placeholderText: {
    fontSize: 20,
    color: '#666',
  },
});
