import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { BORDER_RADIUS, SPACING } from '../../theme/typography';

export const LoadingSkeleton = ({ width = '100%', height = 100, borderRadius = BORDER_RADIUS.md, style }) => {
  return (
    <View style={[styles.container, style]}>
      <SkeletonPlaceholder borderRadius={4}>
        <SkeletonPlaceholder.Item width={width} height={height} borderRadius={borderRadius} />
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  }
});
