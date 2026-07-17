import React from 'react';
import { TouchableWithoutFeedback, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../theme/typography';

export const PrimaryButton = React.memo(({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  style, 
  textStyle,
  variant = 'primary', // primary, secondary, outline, danger
  icon,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 12, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBgColor = () => {
    if (disabled) return COLORS.textDisabled;
    if (variant === 'secondary') return COLORS.secondary;
    if (variant === 'danger') return COLORS.danger;
    if (variant === 'outline') return 'transparent';
    return 'transparent'; // Handled by gradient for primary
  };

  const getTextColor = () => {
    if (variant === 'outline') return COLORS.primary;
    if (disabled) return COLORS.textSecondary;
    return COLORS.white;
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1.5, borderColor: COLORS.border };
    return {};
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} style={{ marginRight: SPACING.sm }} />
      ) : icon ? (
        <View style={{ marginRight: SPACING.sm }}>{icon}</View>
      ) : null}
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {loading ? 'Please wait...' : title}
      </Text>
    </>
  );

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.container,
          getBorder(),
          { backgroundColor: getBgColor() },
          variant === 'primary' && !disabled ? SHADOWS.md : {},
          animatedStyle,
          style
        ]}
      >
        {variant === 'primary' && !disabled ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={styles.contentContainer}>
            {content}
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56, // Enforced 56px height
    borderRadius: BORDER_RADIUS.xl, // 18px radius
    overflow: 'hidden', // to keep gradient inside borders
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  text: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    letterSpacing: 0.3,
  }
});
