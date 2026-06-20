// src/screens/customer/BookingDetailScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { socketService } from '../../services/socket.service';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { StatusBadge } from '../../components/ui/StatusBadge';

const STATUS_STEPS = [
  { key: 'pending',             label: 'Booking Placed',     icon: '📋' },
  { key: 'accepted',            label: 'Provider Accepted',  icon: '🤝' },
  { key: 'confirmed',           label: 'Job Confirmed',      icon: '✅' },
  { key: 'provider_on_the_way', label: 'Provider On Way',    icon: '🚗' },
  { key: 'arrived',             label: 'Provider Arrived',   icon: '📍' },
  { key: 'otp_verification',    label: 'OTP Verification',   icon: '🔑' },
  { key: 'in_progress',         label: 'Work In Progress',   icon: '🔧' },
  { key: 'payment_pending',     label: 'Payment Pending',    icon: '💵' },
  { key: 'completed',           label: 'Completed',          icon: '🎉' },
];

const STATUS_ORDER = ['pending', 'accepted', 'confirmed', 'provider_on_the_way', 'arrived', 'otp_verification', 'in_progress', 'payment_pending', 'completed'];

const BookingDetailScreen = ({ navigation, route }) => {
  const bookingId = route?.params?.bookingId;
  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Booking ID missing');
      setLoading(false);
      return;
    }
    try {
      const res = await bookingAPI.getById(bookingId);
      setBooking(res?.data?.data || res?.data || null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not load booking');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { 
    loadBooking(); 

    if (bookingId) {
      socketService.joinBookingRoom(bookingId);
      const handleUpdate = () => loadBooking();
      socketService.on('booking:status_update', handleUpdate);

      return () => {
        socketService.leaveBookingRoom(bookingId);
        socketService.off('booking:status_update', handleUpdate);
      };
    }
  }, [loadBooking, bookingId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooking();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading booking...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loaderBox}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>Booking not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(booking.status);
  const isCancelled  = booking.status === 'cancelled';
  const isCompleted  = booking.status === 'completed';
  const canTrack     = ['accepted', 'confirmed', 'provider_on_the_way', 'arrived', 'otp_verification', 'in_progress', 'payment_pending'].includes(booking.status);
  const canCancel    = ['pending', 'accepted', 'confirmed', 'provider_on_the_way', 'arrived', 'otp_verification'].includes(booking.status);
  const canRate      = isCompleted && !booking.isRated;

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingAPI.cancel(bookingId, 'Cancelled by customer');
            loadBooking();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Could not cancel');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.content}
      >
        {/* Status Header */}
        <View style={[styles.statusHeader, isCancelled && { backgroundColor: COLORS.error }]}>
          <Text style={styles.statusIcon}>
            {isCancelled ? '❌' : isCompleted ? '🎉' : '📋'}
          </Text>
          <Text style={styles.statusTitle}>
            {isCancelled ? 'Booking Cancelled' : isCompleted ? 'Service Completed!' : 'Booking Active'}
          </Text>
          <StatusBadge status={booking.status} style={{ marginTop: SPACING.sm }} />
        </View>

        {/* Progress Tracker */}
        {!isCancelled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Booking Progress</Text>
            {STATUS_STEPS.map((step, index) => {
              const isDone    = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isLast    = index === STATUS_STEPS.length - 1;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepDot,
                      isDone    && styles.stepDotDone,
                      isCurrent && styles.stepDotCurrent,
                    ]}>
                      <Text style={styles.stepDotText}>{isDone ? '✓' : index + 1}</Text>
                    </View>
                    {!isLast && (
                      <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                      {step.icon} {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stepCurrent}>Current status</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Booking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Service Details</Text>
          <InfoRow label="Category"   value={booking.categoryId?.name || 'Service'} />
          <InfoRow label="Sub Service" value={booking.subService?.name || 'General'} />
          <InfoRow label="Date"       value={new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow label="Time"       value={booking.scheduledTime} />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Service Address</Text>
          <Text style={styles.addressText}>
            {booking.address?.addressLine}{'\n'}
            {booking.address?.city} - {booking.address?.pincode}
          </Text>
        </View>

        {/* Provider Info */}
        {booking.providerId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Provider</Text>
            <View style={styles.providerRow}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerAvatarText}>
                  {booking.providerId?.userId?.name?.[0]?.toUpperCase() || 'P'}
                </Text>
              </View>
              <View>
                <Text style={styles.providerName}>{booking.providerId?.userId?.name || 'Provider'}</Text>
                <Text style={styles.providerPhone}>📱 {booking.providerId?.userId?.phone || ''}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Payment</Text>
          <InfoRow label="Base Amount"      value={`₹${booking.pricing?.baseAmount || 0}`} />
          <InfoRow label="Convenience Fee"  value={`₹${booking.pricing?.convenienceFee || 0}`} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{booking.pricing?.totalAmount || 0}</Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: booking.paymentStatus === 'paid' ? COLORS.successLight : COLORS.warningLight }]}>
            <Text style={[styles.paymentBadgeText, { color: booking.paymentStatus === 'paid' ? COLORS.success : '#B7770D' }]}>
              {booking.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {booking.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <Text style={styles.notesText}>{booking.description}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsBox}>
          {canTrack && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('BookingTrack', { bookingId })}
            >
              <Text style={styles.trackBtnText}>🗺️ Track Provider</Text>
            </TouchableOpacity>
          )}
          {canRate && (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => navigation.navigate('Review', { bookingId, providerId: booking.providerId?._id })}
            >
              <Text style={styles.rateBtnText}>⭐ Rate Service</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { paddingBottom: SPACING.xxxl },
  loaderBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  emptyIcon:  { fontSize: 52, marginBottom: SPACING.lg },
  emptyText:  { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, fontWeight: '600' },
  backBtn:    { marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  backBtnText:{ color: COLORS.white, fontWeight: '700' },

  statusHeader: {
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  statusIcon:  { fontSize: 52, marginBottom: SPACING.sm },
  statusTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },

  section:      { backgroundColor: COLORS.white, marginHorizontal: SPACING.xl, marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  stepRow:         { flexDirection: 'row', marginBottom: 0 },
  stepLeft:        { alignItems: 'center', marginRight: SPACING.md },
  stepDot:         { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotDone:     { backgroundColor: COLORS.success },
  stepDotCurrent:  { backgroundColor: COLORS.primary },
  stepDotText:     { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  stepLine:        { width: 2, height: 30, backgroundColor: COLORS.border, marginVertical: 2 },
  stepLineDone:    { backgroundColor: COLORS.success },
  stepContent:     { flex: 1, paddingTop: 4, paddingBottom: 20 },
  stepLabel:       { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, fontWeight: '500' },
  stepLabelDone:   { color: COLORS.textPrimary, fontWeight: '700' },
  stepCurrent:     { fontSize: FONT_SIZES.xs, color: COLORS.primary, marginTop: 2 },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  addressText:  { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, lineHeight: 22 },

  providerRow:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  providerAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  providerAvatarText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.primary },
  providerName:       { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  providerPhone:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },

  divider:       { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  totalLabel:    { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  totalValue:    { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  paymentBadge:  { borderRadius: BORDER_RADIUS.round, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, alignSelf: 'flex-start' },
  paymentBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },

  notesText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },

  actionsBox: { marginHorizontal: SPACING.xl, marginTop: SPACING.lg, gap: SPACING.md },
  trackBtn:   { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  trackBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  rateBtn:    { backgroundColor: '#FFF3CD', paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: '#F39C12' },
  rateBtnText: { color: '#B7770D', fontWeight: '700', fontSize: FONT_SIZES.md },
  cancelBtn:  { paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.error },
  cancelBtnText: { color: COLORS.error, fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default BookingDetailScreen;