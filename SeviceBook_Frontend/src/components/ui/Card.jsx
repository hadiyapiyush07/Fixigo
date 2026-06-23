import React, { useRef } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

export const Card = React.memo(({ children, style, onPress, noPadding = false }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  if (!onPress) {
    return (
      <View style={[styles.card, noPadding ? { padding: 0 } : { padding: SPACING.md }, style]}>
        {children}
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.card,
          noPadding ? { padding: 0 } : { padding: SPACING.md },
          style,
          { transform: [{ scale }] }
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  }
});
