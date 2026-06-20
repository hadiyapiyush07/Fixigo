import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS, FONT_SIZES, BORDER_RADIUS, SPACING } from '../../theme/typography';

const formatStatus = (s) => s.replace(/_/g, ' ').toUpperCase();

export const StatusChip = ({ status, style, textStyle }) => {
  const theme = STATUS_COLORS[status] || STATUS_COLORS.pending;
  
  return (
    <View style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.border }, style]}>
      <Text style={[styles.text, { color: theme.text }, textStyle]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
