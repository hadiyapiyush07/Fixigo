import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

const PAYMENT_METHODS = [
  { id: 'upi',  icon: '📲', label: 'UPI',          sublabel: 'PhonePe, GPay, Paytm' },
  { id: 'card', icon: '💳', label: 'Credit / Debit Card', sublabel: 'Visa, Mastercard, RuPay' },
  { id: 'cod',  icon: '💵', label: 'Cash on Delivery', sublabel: 'Pay after service' },
];

const PaymentScreen = ({ route, navigation }) => {
  const { booking, amount } = route.params || {};
  const [selected, setSelected] = useState('upi');
  const [loading, setLoading]   = useState(false);

  const totalAmount = amount || booking?.pricing?.totalAmount || 0;

  const handlePay = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);

    if (selected === 'cod') {
      Alert.alert('✅ Booking Confirmed!', 'Your booking is confirmed. Pay the provider after the service.', [
        { text: 'OK', onPress: () => navigation.navigate('CustomerTabs', { screen: 'MyBookings' }) },
      ]);
    } else {
      Alert.alert('✅ Payment Successful!', `₹${totalAmount} paid via ${selected.toUpperCase()}. Your booking is confirmed.`, [
        { text: 'View Booking', onPress: () => navigation.navigate('CustomerTabs', { screen: 'MyBookings' }) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{booking?.categoryId?.name || 'Service'}</Text>
            <Text style={styles.summaryVal}>₹{booking?.pricing?.basePrice || totalAmount}</Text>
          </View>
          {booking?.pricing?.platformFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Platform Fee</Text>
              <Text style={styles.summaryVal}>₹{booking.pricing.platformFee}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {PAYMENT_METHODS.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodCard, selected === method.id && styles.methodCardSelected]}
            onPress={() => setSelected(method.id)}
            activeOpacity={0.8}
          >
            <View style={styles.methodIcon}>
              <Text style={{ fontSize: 24 }}>{method.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, selected === method.id && { color: COLORS.primary }]}>
                {method.label}
              </Text>
              <Text style={styles.methodSub}>{method.sublabel}</Text>
            </View>
            <View style={[styles.radio, selected === method.id && styles.radioSelected]}>
              {selected === method.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Safe Payment Note */}
        <View style={styles.safeNote}>
          <Text style={styles.safeNoteText}>🔒  All payments are 100% safe & encrypted</Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomAmount}>
          <Text style={styles.bottomAmountLabel}>Amount to Pay</Text>
          <Text style={styles.bottomAmountValue}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" size="small" />
            : <Text style={styles.payBtnText}>
                {selected === 'cod' ? '✅  Confirm Booking' : `💳  Pay ₹${totalAmount}`}
              </Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xl + SPACING.lg,
    paddingBottom:     SPACING.md,
    backgroundColor:   '#FFFFFF',
    gap:               SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  backIcon:    { padding: 4 },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },

  summaryCard: {
    margin:           SPACING.xl,
    backgroundColor:  '#FFFFFF',
    borderRadius:     16,
    padding:          SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827', marginBottom: SPACING.md },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey:   { fontSize: FONT_SIZES.sm, color: '#6B7280' },
  summaryVal:   { fontSize: FONT_SIZES.sm, color: '#111827', fontWeight: '500' },
  totalRow:     { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: SPACING.md, marginTop: SPACING.sm, marginBottom: 0 },
  totalKey:     { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827' },
  totalVal:     { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },

  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827', paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },

  methodCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  '#FFFFFF',
    marginHorizontal: SPACING.xl,
    marginBottom:     SPACING.md,
    borderRadius:     14,
    padding:          SPACING.lg,
    borderWidth:      1.5,
    borderColor:      '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  methodCardSelected: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  methodIcon:  { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  methodLabel: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#111827' },
  methodSub:   { fontSize: FONT_SIZES.xs, color: '#9CA3AF', marginTop: 2 },
  radio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.primary },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  safeNote: {
    marginHorizontal: SPACING.xl,
    marginTop:        SPACING.sm,
    alignItems:       'center',
    padding:          SPACING.md,
    backgroundColor:  '#ECFDF5',
    borderRadius:     10,
  },
  safeNoteText: { fontSize: FONT_SIZES.xs, color: '#065F46', fontWeight: '500' },

  bottomBar: {
    position:        'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    padding:         SPACING.xl,
    paddingBottom:   SPACING.xl + 4,
    borderTopWidth:  1,
    borderTopColor:  '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.md,
  },
  bottomAmount:      { flex: 1 },
  bottomAmountLabel: { fontSize: FONT_SIZES.xs, color: '#9CA3AF' },
  bottomAmountValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },
  payBtn:     { backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: SPACING.xl, borderRadius: 14 },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default PaymentScreen;