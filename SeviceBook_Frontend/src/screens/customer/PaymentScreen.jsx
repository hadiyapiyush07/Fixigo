import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { ChevronLeft, CreditCard, Smartphone, Banknote, ShieldCheck } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const PAYMENT_METHODS = [
  { id: 'upi',  icon: <Smartphone size={24} color={COLORS.primary} />, label: 'UPI', sublabel: 'PhonePe, GPay, Paytm' },
  { id: 'card', icon: <CreditCard size={24} color={COLORS.primary} />, label: 'Credit / Debit Card', sublabel: 'Visa, Mastercard, RuPay' },
  { id: 'cod',  icon: <Banknote size={24} color={COLORS.primary} />, label: 'Cash on Delivery', sublabel: 'Pay after service' },
];

const PaymentScreen = ({ route, navigation }) => {
  const { booking, amount } = route.params || {};
  const [selected, setSelected] = useState('upi');
  const [loading, setLoading]   = useState(false);

  const totalAmount = amount || booking?.pricing?.totalAmount || 0;

  const handlePay = async () => {
    setLoading(true);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Card style={styles.summaryCard}>
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
            <View style={styles.dividerDashed} />
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Total</Text>
              <Text style={styles.totalVal}>₹{totalAmount}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Payment Methods */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodsContainer}>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, selected === method.id && styles.methodCardSelected]}
                onPress={() => setSelected(method.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.methodIconBox, selected === method.id && styles.methodIconBoxSelected]}>
                  {method.icon}
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={[styles.methodLabel, selected === method.id && { color: COLORS.primaryDark }]}>
                    {method.label}
                  </Text>
                  <Text style={styles.methodSub}>{method.sublabel}</Text>
                </View>
                <View style={[styles.radio, selected === method.id && styles.radioSelected]}>
                  {selected === method.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Safe Payment Note */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.safeNote}>
          <ShieldCheck size={20} color={COLORS.success} />
          <Text style={styles.safeNoteText}>All payments are 100% safe & encrypted</Text>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pay Button */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.bottomBar}>
        <View style={styles.bottomAmount}>
          <Text style={styles.bottomAmountLabel}>Amount to Pay</Text>
          <Text style={styles.bottomAmountValue}>₹{totalAmount}</Text>
        </View>
        <PrimaryButton 
          title={selected === 'cod' ? 'Confirm Booking' : `Pay ₹${totalAmount}`} 
          onPress={handlePay} 
          loading={loading}
          style={{ minWidth: 160 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  
  content: { padding: SPACING.xl },

  summaryCard: { padding: SPACING.xl, marginBottom: SPACING.xl },
  summaryLabel: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryKey:   { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  summaryVal:   { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '700' },
  dividerDashed: { height: 1, borderBottomWidth: 1, borderColor: COLORS.divider, borderStyle: 'dashed', marginVertical: SPACING.md },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalKey:     { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  totalVal:     { fontSize: FONT_SIZES.xl, fontWeight: '900', color: COLORS.primary },

  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md, marginLeft: SPACING.xs },
  
  methodsContainer: { gap: SPACING.md },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  methodCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  methodIconBox:  { width: 48, height: 48, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  methodIconBoxSelected: { backgroundColor: COLORS.white },
  methodLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  methodSub:   { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.white },

  safeNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.successLight, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.xl, gap: SPACING.sm },
  safeNoteText: { fontSize: FONT_SIZES.sm, color: COLORS.success, fontWeight: '700' },

  bottomBar: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, 
    padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg, 
    flexDirection: 'row', alignItems: 'center', ...SHADOWS.lg 
  },
  bottomAmount: { flex: 1 },
  bottomAmountLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  bottomAmountValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.textPrimary },
});

export default PaymentScreen;