/**
 * Spinning vinyl disc with album cover
 * Background: blurred album cover image for visual connection
 * Plays continuously when playing, stops on pause
 */
import React, { useMemo, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { getCoverUrl } from '../services/player';
import { getString, STORAGE_KEYS } from '../services/storage';
import CoverImage from './CoverImage';

interface DiscCoverProps {
  trackId: number;
  hasCover: boolean;
  size?: number;
  isPlaying: boolean;
}

export default function DiscCover({
  trackId,
  hasCover,
  size = 280,
  isPlaying,
}: DiscCoverProps) {
  const rotation = useSharedValue(0);
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const [bgError, setBgError] = useState(false);

  const coverUrl = useMemo(() => getCoverUrl(trackId), [trackId]);
  const token = useMemo(() => getString(STORAGE_KEYS.ACCESS_TOKEN), []);

  React.useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const innerSize = size * 0.75;
  const ringWidth = (size - innerSize) / 2;
  const bgSize = size * 1.6;

  // Vinyl groove radii (concentric circles between ring edge and cover)
  const grooveRadii = [
    size / 2 - ringWidth * 0.2,
    size / 2 - ringWidth * 0.5,
    size / 2 - ringWidth * 0.8,
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Blurred album cover background */}
      {hasCover && !bgError && (
        <View style={[styles.bgLayer, { width: bgSize, height: bgSize }]} pointerEvents="none">
          <Image
            source={{ uri: coverUrl, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
            style={styles.bgImage}
            blurRadius={40}
            resizeMode="cover"
            onError={() => setBgError(true)}
          />
          <View style={styles.bgOverlay} />
        </View>
      )}

      {/* Outer vinyl ring */}
      <View
        style={[
          styles.vinylRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.discRing,
            borderColor: colors.discRingBorder,
          },
        ]}
      />

      {/* Vinyl grooves */}
      {grooveRadii.map((radius, i) => (
        <View
          key={i}
          style={[
            styles.groove,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderColor: colors.discRingBorder,
            },
          ]}
        />
      ))}

      {/* Spinning cover */}
      <Animated.View
        style={[
          styles.coverWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      >
        <CoverImage
          trackId={trackId}
          hasCover={hasCover}
          size={innerSize}
          borderRadius={innerSize / 2}
          style={{
            position: 'absolute',
            top: ringWidth,
            left: ringWidth,
          }}
        />
      </Animated.View>

      {/* Center hole */}
      <View
        style={[
          styles.centerHole,
          {
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.discCenter,
            borderColor: colors.discCenterBorder,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgLayer: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  vinylRing: {
    position: 'absolute',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  groove: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.3,
  },
  coverWrapper: {
    overflow: 'hidden',
  },
  centerHole: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: 10,
  },
});
