import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../theme/typography';

export const PrimaryButton = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  style, 
  textStyle,
  variant = 'primary' // primary, secondary, outline, danger
}) => {
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
    <TouchableOpacity
      style={[
        styles.btn, 
        { backgroundColor: getBgColor() }, 
        getBorder(),
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.txt, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

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
