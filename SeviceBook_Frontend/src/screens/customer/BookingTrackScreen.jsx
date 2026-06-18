// src/screens/customer/BookingTrackScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const BookingTrackScreen = ({ route, navigation }) => {
  const bookingId = route?.params?.bookingId;
  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const loadBooking = async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    try {
      const res = await bookingAPI.getById(bookingId);
      setBooking(res?.data?.data || res?.data || null);
    } catch (e) {
      console.log('Track error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
    // Auto-refresh every 15 seconds for live tracking
    timerRef.current = setInterval(() => {
      loadBooking();
    }, 15000);
    return () => clearInterval(timerRef.current);
  }, [bookingId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooking();
    setRefreshing(false);
  };

  const STATUS_INFO = {
    pending: {
      icon:    '🔍',
      title:   'Finding Provider',
      message: 'We are searching for the best provider near you...',
      color:   '#B7770D',
      bg:      '#FEF3D7',
    },
    confirmed: {
      icon:    '✅',
      title:   'Provider Confirmed!',
      message: 'Your provider has accepted the booking and will arrive soon.',
      color:   COLORS.primary,
      bg:      COLORS.primaryLight,
    },
    provider_on_the_way: {
      icon:    '🚗',
      title:   'Provider is Coming!',
      message: 'Your provider is on the way to your location.',
      color:   '#6C3483',
      bg:      '#F3E8FD',
    },
    in_progress: {
      icon:    '🔧',
      title:   'Work in Progress',
      message: 'Your provider is currently working on the service.',
      color:   '#9A4E0A',
      bg:      '#FEF0E0',
    },
    completed: {
      icon:    '🎉',
      title:   'Service Completed!',
      message: 'Your service is complete. Please rate your experience.',
      color:   COLORS.success,
      bg:      COLORS.successLight,
    },
    cancelled: {
      icon:    '❌',
      title:   'Booking Cancelled',
      message: 'This booking has been cancelled.',
      color:   COLORS.error,
      bg:      COLORS.errorLight,
    },
    rejected: {
      icon:    '⚠️',
      title:   'No Provider Available',
      message: 'Sorry, no providers are available right now. Please try again later.',
      color:   COLORS.textSecondary,
      bg:      COLORS.background,
    },
  };

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading tracking info...</Text>
      </View>
    );
  }

  const status   = booking?.status || 'pending';
  const info     = STATUS_INFO[status] || STATUS_INFO.pending;
  const provider = booking?.providerId;
  const isCompleted = status === 'completed';
  const canRate     = isCompleted && !booking?.isRated;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Live Status Card */}
        <View style={[styles.statusCard, { backgroundColor: info.bg, borderColor: info.color }]}>
          <Text style={styles.statusIcon}>{info.icon}</Text>
          <Text style={[styles.statusTitle, { color: info.color }]}>{info.title}</Text>
          <Text style={styles.statusMessage}>{info.message}</Text>
          {status === 'pending' && (
            <View style={styles.searchingRow}>
              <ActivityIndicator color={info.color} size="small" />
              <Text style={[styles.searchingText, { color: info.color }]}>Searching...</Text>
            </View>
          )}
        </View>

        {/* Booking ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Booking Info</Text>
          <InfoRow label="Booking ID"  value={`#${bookingId?.slice(-8).toUpperCase()}`} />
          <InfoRow label="Service"     value={booking?.categoryId?.name || 'Service'} />
          <InfoRow label="Date"        value={booking?.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('en-IN') : '-'} />
          <InfoRow label="Time"        value={booking?.scheduledTime || '-'} />
          <InfoRow label="Address"     value={`${booking?.address?.addressLine || ''}, ${booking?.address?.city || ''}`} />
        </View>

        {/* Provider Info — shown after confirmed */}
        {provider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Your Provider</Text>
            <View style={styles.providerCard}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerAvatarText}>
                  {provider?.userId?.name?.[0]?.toUpperCase() || 'P'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.providerName}>{provider?.userId?.name || 'Provider'}</Text>
                <Text style={styles.providerPhone}>📱 {provider?.userId?.phone || ''}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>{Number(provider?.rating?.average || 0).toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Status History */}
        {booking?.statusHistory && booking.statusHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Activity Log</Text>
            {[...booking.statusHistory].reverse().map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyStatus}>{h.status?.replace(/_/g, ' ').toUpperCase()}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(h.changedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' • '}
                    {new Date(h.changedAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>🔄 Refresh Status</Text>
        </TouchableOpacity>

        {canRate && (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => navigation.navigate('Review', {
              bookingId,
              providerId: booking?.providerId?._id,
            })}
          >
            <Text style={styles.rateBtnText}>⭐ Rate Service</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  loaderBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary },

  statusCard: {
    borderRadius:  BORDER_RADIUS.xl,
    borderWidth:   2,
    padding:       SPACING.xl,
    alignItems:    'center',
    marginBottom:  SPACING.lg,
  },
  statusIcon:    { fontSize: 60, marginBottom: SPACING.md },
  statusTitle:   { fontSize: FONT_SIZES.xl, fontWeight: '800', textAlign: 'center' },
  statusMessage: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  searchingRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  searchingText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },

  section:      { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600', flex: 1.5, textAlign: 'right' },

  providerCard:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  providerAvatar:     { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  providerAvatarText: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.primary },
  providerName:       { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  providerPhone:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow:          { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star:               { color: '#F39C12', fontSize: FONT_SIZES.md },
  ratingText:         { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 3 },

  historyRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  historyDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginTop: 4 },
  historyStatus:{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  historyTime:  { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },

  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.md, ...SHADOWS.lg },
  refreshBtn:  { backgroundColor: COLORS.background, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  refreshBtnText: { color: COLORS.textPrimary, fontWeight: '600' },
  rateBtn:     { backgroundColor: '#FFF3CD', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: '#F39C12' },
  rateBtnText: { color: '#B7770D', fontWeight: '700' },
});

export default BookingTrackScreen;