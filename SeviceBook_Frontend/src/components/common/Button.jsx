// src/components/common/Button.jsx
import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, View,
} from 'react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SPACING } from '../../theme/typography';

/*
USAGE:
  <Button title="Login" onPress={handleLogin} />
  <Button title="Cancel" variant="outline" onPress={handleCancel} />
  <Button title="Loading..." loading={true} />
  <Button title="Disabled" disabled={true} />
*/

const Button = ({
  title,
  onPress,
  variant  = 'primary',   // primary | outline | ghost | danger
  size     = 'md',         // sm | md | lg
  loading  = false,
  disabled = false,
  fullWidth= true,
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger'
            ? COLORS.white
            : COLORS.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  content:  { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 0,
  },
  danger: {
    backgroundColor: COLORS.error,
    borderWidth: 0,
  },

  // Sizes
  size_sm: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  size_md: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md + 2 },
  size_lg: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.lg },

  // Text
  text:         { fontWeight: '600', textAlign: 'center' },
  text_primary: { color: COLORS.white },
  text_outline: { color: COLORS.primary },
  text_ghost:   { color: COLORS.primary },
  text_danger:  { color: COLORS.white },

  textSize_sm: { fontSize: FONT_SIZES.sm },
  textSize_md: { fontSize: FONT_SIZES.md },
  textSize_lg: { fontSize: FONT_SIZES.lg },

  disabled: { opacity: 0.5 },
});

export default Button;
