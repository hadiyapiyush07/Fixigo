import { useTheme } from '../../theme/ThemeContext';
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  rightIcon,
  editable = true,
  style,
  inputStyle,
}) => {
  const { colors: COLORS } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[{ marginBottom: SPACING.lg }, style]}>
      {label && (
        <Text style={{ 
          fontSize: FONT_SIZES.sm, 
          fontWeight: '600', 
          color: COLORS.textSecondary, 
          marginBottom: SPACING.xs,
          letterSpacing: 0.2
        }}>
          {label}
        </Text>
      )}

      <View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: COLORS.border,
          borderRadius: BORDER_RADIUS.lg, // Modern 16px radius
          backgroundColor: COLORS.surface,
          minHeight: 56, // Modern tap target
        },
        isFocused && { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
        error && { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
        !editable && { backgroundColor: COLORS.background },
      ]}>
        {leftIcon && <View style={{ paddingLeft: SPACING.lg }}>{leftIcon}</View>}

        <TextInput
          style={[
            {
              flex: 1,
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              fontSize: FONT_SIZES.md,
              color: COLORS.textPrimary,
              height: multiline ? undefined : '100%',
            },
            leftIcon && { paddingLeft: SPACING.sm },
            rightIcon && { paddingRight: SPACING.sm },
            multiline && { minHeight: numberOfLines * 24, textAlignVertical: 'top', paddingTop: SPACING.md },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity style={{ paddingHorizontal: SPACING.lg }} onPress={() => setIsSecure(!isSecure)}>
            {isSecure
              ? <EyeOff size={20} color={COLORS.textTertiary} />
              : <Eye size={20} color={COLORS.primary} />}
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={{ paddingRight: SPACING.lg }}>{rightIcon}</View>
        )}
      </View>

      {error && (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: SPACING.xs, fontWeight: '500' }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
