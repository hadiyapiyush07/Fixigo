// src/screens/customer/BookingSummaryScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, Image
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const BookingSummaryScreen = ({ navigation, route }) => {
  const {
    categoryId,
    categoryName,
    subService,
    subServices,
    // scheduledDate and scheduledTime are NOT passed — instant booking, backend auto-sets them
    notes,
    address,
    couponCode,
    images,
    pricing
  } = route.params;

  const [submitting, setSubmitting] = useState(false);
  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);

      // ── Build sub-services array from whatever was selected ─────────────────
      // subServices array takes priority (multi-select flow)
      // subService (legacy single) is a fallback for old flows
      const selectedSubServices = (subServices && subServices.length > 0)
        ? subServices
        : (subService ? [subService] : []);

      if (selectedSubServices.length === 0) {
        Alert.alert('Error', 'No service selected. Please go back and select at least one service.');
        return;
      }

      // Build the legacy subService summary (needed by backend for backward compat)
      const subServiceSummary = {
        name:     selectedSubServices.map(s => s.name).join(', '),
        price:    selectedSubServices.reduce((acc, s) => acc + (Number(s.price) || 0), 0),
        duration: selectedSubServices.reduce((acc, s) => acc + (Number(s.duration) || 60), 0),
      };

      const payload = {
        categoryId,
        // Instant booking — no scheduledDate/scheduledTime from frontend
        // backend auto-fills them
        address,
        description: notes || '',
        subService:  subServiceSummary,
        subServices: selectedSubServices.map(s => ({
          name:     s.name,
          price:    Number(s.price) || 0,
          duration: Number(s.duration) || 60,
        })),
        pricing: {
          baseAmount:    pricing?.baseAmount    || 0,
          convenienceFee: pricing?.convenienceFee || 0,
          discount:      pricing?.discount      || 0,
          totalAmount:   pricing?.totalAmount   || 0,
        },
        images: images || [],
      };

      console.log('[BookingSummaryScreen] Sending booking payload:', JSON.stringify(payload, null, 2));

      const res = await bookingAPI.create(payload);
      const booking = res?.data?.data || res?.data;
      const bookingId = booking?._id;

      console.log('[BookingSummaryScreen] Booking response:', JSON.stringify(res?.data, null, 2));

      if (!bookingId) {
        throw new Error('Booking ID was not returned from the server. Response: ' + JSON.stringify(res?.data));
      }

      Alert.alert(
        '🎉 Booking Confirmed!',
        'Your booking has been created successfully. We are now searching for nearby professionals.',
        [{
          text: 'Track Booking',
          onPress: () => navigation.navigate('BookingTrack', { bookingId }),
        }]
      );
    } catch (e) {
      console.error('[BookingSummaryScreen] Booking creation FAILED!');
      console.error('  error name   :', e?.name);
      console.error('  error message:', e?.message);
      console.error('  error stack  :', e?.stack);
      console.error('  response data:', JSON.stringify(e?.response?.data));

      // Show human-readable message — never show minified bundle stack
      const apiMsg   = e?.response?.data?.message;
      const userMsg  = apiMsg || e?.message || 'Failed to create booking. Please check your connection and try again.';
      Alert.alert('Booking Failed', userMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Summary</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🛠️ Service Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{categoryName}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md }} />
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 }}>SELECTED SERVICES:</Text>
          {(subServices && subServices.length > 0) ? (
            subServices.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textPrimary }}>• {item.name}</Text>
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' }}>₹{item.price}</Text>
              </View>
            ))
          ) : subService ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textPrimary }}>• {subService?.name || '—'}</Text>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' }}>₹{subService?.price || 0}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary }}>No service selected</Text>
          )}
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md }} />
          <View style={styles.detailRow}>
            <Text style={styles.label}>Total Duration</Text>
            <Text style={styles.value}>
              ⏱ {
                (subServices && subServices.length > 0)
                  ? subServices.reduce((acc, s) => acc + (Number(s.duration) || 60), 0)
                  : (subService?.duration || 60)
              } mins
            </Text>
          </View>
        </View>

        {/* Instant Booking Notice */}
        <View style={{ backgroundColor: '#EFF6FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}>
          <Text style={{ fontSize: 18, marginRight: SPACING.sm }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#1D4ED8' }}>Instant Booking</Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: '#3B82F6', marginTop: 2 }}>Your request is sent immediately. A provider will be assigned in real-time.</Text>
          </View>
        </View>


        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Service Address</Text>
          <Text style={styles.addressText}>{address.addressLine}</Text>
          <Text style={styles.addressText}>{address.city} - {address.pincode}</Text>
        </View>

        {/* Optional Notes Card */}
        {notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📝 Special Instructions</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* Optional Images Card */}
        {images && images.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📸 Attached Images ({images.length})</Text>
            <View style={styles.imageGrid}>
              {images.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.thumbnail} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Coupon Applied Card */}
        {couponCode ? (
          <View style={[styles.card, styles.couponCard]}>
            <Text style={styles.couponTitle}>🏷 Coupon Applied</Text>
            <View style={styles.couponRow}>
              <Text style={styles.couponCode}>{couponCode}</Text>
              <Text style={styles.couponDiscount}>-₹{pricing.discount}</Text>
            </View>
          </View>
        ) : null}

        {/* Pricing Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Price Breakdown</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Amount</Text>
            <Text style={styles.priceValue}>{fmtINR(pricing?.baseAmount)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Convenience Fee</Text>
            <Text style={styles.priceValue}>{fmtINR(pricing?.convenienceFee)}</Text>
          </View>

          {pricing.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: COLORS.success }]}>Promo Discount</Text>
              <Text style={[styles.priceValue, { color: COLORS.success }]}>-₹{pricing.discount}</Text>
            </View>
          )}

          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Payable Amount</Text>
            <Text style={styles.totalValue}>₹{pricing.totalAmount}</Text>
          </View>
          
          <Text style={styles.payNote}>💵 Pay cash or online after the service is completed</Text>
        </View>

        {/* Space */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total Payable</Text>
          <Text style={styles.bottomPrice}>₹{pricing.totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm
  },
  backIcon: { fontSize: 26, color: COLORS.textPrimary, fontWeight: '300', lineHeight: 28, textAlign: 'center' },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },

  addressText: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, lineHeight: 20 },
  notesText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },

  imageGrid: { flexDirection: 'row', gap: SPACING.md, marginTop: 4 },
  thumbnail: { width: 60, height: 60, borderRadius: BORDER_RADIUS.sm },

  couponCard: { borderColor: COLORS.success, borderWidth: 1, backgroundColor: COLORS.successLight },
  couponTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.success, marginBottom: 6 },
  couponRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  couponCode: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.success },
  couponDiscount: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.success },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  totalLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.primary },
  payNote: { fontSize: FONT_SIZES.xs, color: COLORS.success, textAlign: 'center', marginTop: SPACING.md, fontWeight: '500' },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.lg
  },
  bottomInfo: { flex: 1 },
  bottomLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  bottomPrice: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md
  },
  confirmBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
});

export default BookingSummaryScreen;
