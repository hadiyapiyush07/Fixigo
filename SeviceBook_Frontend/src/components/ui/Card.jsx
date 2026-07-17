import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

export const Card = React.memo(({ children, style, onPress, noPadding = false, elevation = 'md' }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardContent = (
    <View style={[
      styles.card,
      noPadding ? { padding: 0 } : { padding: SPACING.lg },
      SHADOWS[elevation] || SHADOWS.md,
      style
    ]}>
      {children}
    </View>
  );

  if (!onPress) {
    return cardContent;
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        {cardContent}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl, // 24px strict requirement
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)', // Extremely subtle border for glass effect
    marginBottom: SPACING.md,
  },
});
