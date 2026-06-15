// src/components/common/Input.jsx
import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType    = 'default',
  autoCapitalize  = 'none',
  multiline       = false,
  numberOfLines   = 1,
  maxLength,
  leftIcon,
  rightIcon,
  editable = true,
  style,
  inputStyle,
}) => {
  const [isFocused,  setIsFocused]  = useState(false);
  const [isSecure,   setIsSecure]   = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputWrapper,
        isFocused && styles.focused,
        error     && styles.errorBorder,
        !editable && styles.disabled,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon  && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && { height: numberOfLines * 44, textAlignVertical: 'top' },
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
          onBlur={()  => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsSecure(!isSecure)}
          >
            <Text style={styles.eyeIcon}>{isSecure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { marginBottom: SPACING.lg },
  label:       { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6 },

  inputWrapper: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
    borderColor:    COLORS.border,
    borderRadius:   BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  focused:     { borderColor: COLORS.primary },
  errorBorder: { borderColor: COLORS.error },
  disabled:    { backgroundColor: COLORS.background },

  input: {
    flex:            1,
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    fontSize:          FONT_SIZES.md,
    color:             COLORS.textPrimary,
  },
  inputWithLeftIcon:  { paddingLeft: SPACING.sm },
  inputWithRightIcon: { paddingRight: SPACING.sm },

  leftIcon:  { paddingLeft: SPACING.lg },
  rightIcon: { paddingRight: SPACING.lg },
  eyeIcon:   { fontSize: 16 },

  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 4 },
});

export default Input;
