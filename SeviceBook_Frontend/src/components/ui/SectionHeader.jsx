import { useTheme } from '../../theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

export const SectionHeader = ({ title, subtitle, actionText, onAction }) => {
  const { colors: COLORS, shadows: SHADOWS, statusColors: STATUS_COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS, SHADOWS, STATUS_COLORS), [COLORS, SHADOWS, STATUS_COLORS]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (COLORS, SHADOWS, STATUS_COLORS) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  action: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  }
});
