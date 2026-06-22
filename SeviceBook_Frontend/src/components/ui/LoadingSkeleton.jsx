// src/components/ui/LoadingSkeleton.jsx
// Pure React Native animated shimmer — no native dependencies required.
// Replaces react-native-skeleton-placeholder to avoid RNCMaskedView crash.

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, COLORS } from '../../theme/typography';

export const LoadingSkeleton = ({
  width = '100%',
  height = 100,
  borderRadius = BORDER_RADIUS.md,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.bone,
          {
            width,
            height,
            borderRadius,
            opacity,
          },
        ]}
      />
    </View>
  );
};

// Multiple skeletons stacked vertically
export const SkeletonGroup = ({ count = 3, height = 80, gap = SPACING.md }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <LoadingSkeleton key={i} height={height} style={{ marginBottom: gap }} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  bone: {
    backgroundColor: COLORS.border || '#E0E0E0',
  },
});
