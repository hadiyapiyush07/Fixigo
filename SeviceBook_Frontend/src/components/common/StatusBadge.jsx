import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BOOKING_STATUS_COLORS, FONT_SIZES } from '../../theme/typography';

const STATUS_LABELS = {
  pending:              '⏳ Pending',
  accepted:             '🤝 Accepted',
  confirmed:            '✅ Confirmed',
  provider_on_the_way:  '🚗 On The Way',
  arrived:              '📍 Arrived',
  otp_verification:     '🔑 OTP Verifying',
  in_progress:          '🔧 In Progress',
  payment_pending:      '💵 Pay Pending',
  completed:            '✅ Completed',
  cancelled:            '❌ Cancelled',
  rejected:             '⚠️ No Provider',
  expired:              '⏳ Expired',
};

const STATUS_COLORS = {
  pending:              { bg: '#FEF3D7', text: '#B7770D', border: '#FDCB6E' },
  accepted:             { bg: '#E6FBF3', text: '#10B981', border: '#A7F3D0' },
  confirmed:            { bg: '#E8F0FD', text: '#1455C0', border: '#1D6AE5' },
  provider_on_the_way:  { bg: '#F3E8FD', text: '#6C3483', border: '#9B59B6' },
  arrived:              { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  otp_verification:     { bg: '#F5F3FF', text: '#8B5CF6', border: '#DDD6FE' },
  in_progress:          { bg: '#FEF0E0', text: '#9A4E0A', border: '#E67E22' },
  payment_pending:      { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  completed:            { bg: '#E0F7F3', text: '#007A63', border: '#00B894' },
  cancelled:            { bg: '#FDECEA', text: '#C0392B', border: '#E74C3C' },
  rejected:             { bg: '#F5F6FA', text: '#636E72', border: '#95A5A6' },
  expired:              { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

export const StatusBadge = ({ status, style }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.bg, borderColor: colors.border },
      style,
    ]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      50,
    borderWidth:       1,
    alignSelf:         'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});