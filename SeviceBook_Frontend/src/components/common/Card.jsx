// src/components/common/Card.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

export const Card = ({ children, style, shadow = 'sm' }) => (
  <View style={[styles.card, SHADOWS[shadow], style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    BORDER_RADIUS.lg,
    padding:         SPACING.lg,
  },
});
