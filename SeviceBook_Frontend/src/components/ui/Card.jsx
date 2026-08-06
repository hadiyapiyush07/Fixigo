import { useTheme } from '../../theme/ThemeContext';
import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPACING, BORDER_RADIUS } from '../../theme/typography';

export const Card = React.memo(({ children, style, onPress, noPadding = false, elevation = 'md' }) => {
  const { colors: COLORS, shadows: SHADOWS } = useTheme();

  const scale = useSharedValue(1);

  const handlePressIn  = () => { if (!onPress) return; scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }); };
  const handlePressOut = () => { if (!onPress) return; scale.value = withSpring(1,    { damping: 12, stiffness: 200 }); };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = [
    {
      backgroundColor: COLORS.surface,
      borderRadius:    BORDER_RADIUS.xxl,
      borderWidth:     1,
      borderColor:     COLORS.border,
      marginBottom:    SPACING.md,
    },
    noPadding ? { padding: 0 } : { padding: SPACING.lg },
    SHADOWS[elevation] || SHADOWS.md,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        <View style={cardStyle}>{children}</View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});
