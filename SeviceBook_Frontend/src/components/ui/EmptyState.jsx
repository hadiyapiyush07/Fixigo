import { useTheme } from '../../theme/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

export const EmptyState = ({ icon = '📦', title, subtitle, style }) => {
  const { colors: COLORS, shadows: SHADOWS, statusColors: STATUS_COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS, SHADOWS, STATUS_COLORS), [COLORS, SHADOWS, STATUS_COLORS]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Animated.View>
  );
};

const createStyles = (COLORS, SHADOWS, STATUS_COLORS) => StyleSheet.create({
  container: {
    padding: SPACING.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  }
});
