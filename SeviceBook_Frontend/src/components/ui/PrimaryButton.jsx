import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Animated, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../theme/typography';

export const PrimaryButton = React.memo(({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  style, 
  textStyle,
  variant = 'primary' // primary, secondary, outline, danger
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const getBgColor = () => {
    if (disabled) return COLORS.textDisabled;
    if (variant === 'secondary') return COLORS.secondary;
    if (variant === 'danger') return COLORS.error;
    if (variant === 'outline') return 'transparent';
    return COLORS.primary;
  };

  const getTextColor = () => {
    if (variant === 'outline') return COLORS.primary;
    return COLORS.white;
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1, borderColor: COLORS.primary };
    return {};
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.btn, 
          { backgroundColor: getBgColor() }, 
          getBorder(),
          style,
          { transform: [{ scale }] }
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <Text style={[styles.txt, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  btn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  txt: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  }
});
