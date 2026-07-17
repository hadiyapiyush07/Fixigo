import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, Image, Platform
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { ChevronLeft, Zap, CheckCircle2, TicketPercent, Wallet, MapPin, AlignLeft, Image as ImageIcon } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';

const BookingSummaryScreen = ({ navigation, route }) => {
  const {
    categoryId, categoryName, subService, subServices,
    notes, address, couponCode, images, pricing
  } = route.params;

  const [submitting, setSubmitting] = useState(false);
  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const selectedSubServices = (subServices && subServices.length > 0) ? subServices : (subService ? [subService] : []);
      if (selectedSubServices.length === 0) return Alert.alert('Error', 'No service selected. Please go back.');

      const subServiceSummary = {
        name:     selectedSubServices.map(s => s.name).join(', '),
        price:    selectedSubServices.reduce((acc, s) => acc + (Number(s.price) || 0), 0),
        duration: selectedSubServices.reduce((acc, s) => acc + (Number(s.duration) || 60), 0),
      };

      const payload = {
        categoryId, address, description: notes || '', subService: subServiceSummary,
        subServices: selectedSubServices.map(s => ({ name: s.name, price: Number(s.price) || 0, duration: Number(s.duration) || 60 })),
        pricing: {
          baseAmount: pricing?.baseAmount || 0, convenienceFee: pricing?.convenienceFee || 0,
          discount: pricing?.discount || 0, totalAmount: pricing?.totalAmount || 0,
        },
        images: images || [],
      };

      const res = await bookingAPI.create(payload);
      const bookingId = res?.data?.data?._id || res?.data?._id;
      if (!bookingId) throw new Error('Booking ID missing from server.');

      Alert.alert(
        '🎉 Booking Confirmed!',
        'Your booking has been created successfully. We are now searching for nearby professionals.',
        [{ text: 'Track Booking', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'CustomerTabs', params: { screen: 'MyBookings' } }, { name: 'BookingTrack', params: { bookingId } }] }) }]
      );
    } catch (e) {
      Alert.alert('Booking Failed', e?.response?.data?.message || e?.message || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Instant Booking Banner */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View style={styles.instantBanner}>
            <Zap size={20} color={COLORS.primary} />
            <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
              <Text style={styles.instantTitle}>Instant Booking</Text>
              <Text style={styles.instantSub}>A provider will be assigned immediately</Text>
            </View>
          </View>
        </Animated.View>

        {/* Services Card */}
        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <SectionHeader title="Service Details" />
          <Card style={styles.card} noPadding>
            <View style={styles.serviceHeaderRow}>
              <Text style={styles.catName}>{categoryName}</Text>
            </View>
            <View style={styles.subServicesList}>
              {(subServices && subServices.length > 0) ? (
                subServices.map((item, idx) => (
                  <View key={idx} style={styles.serviceRow}>
                    <View style={styles.serviceRowLeft}>
                      <CheckCircle2 size={16} color={COLORS.success} />
                      <Text style={styles.serviceItemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.serviceItemPrice}>₹{item.price}</Text>
                  </View>
                ))
              ) : subService ? (
                <View style={styles.serviceRow}>
                  <View style={styles.serviceRowLeft}>
                    <CheckCircle2 size={16} color={COLORS.success} />
                    <Text style={styles.serviceItemName}>{subService?.name || '—'}</Text>
                  </View>
                  <Text style={styles.serviceItemPrice}>₹{subService?.price || 0}</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No service selected</Text>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Location & Details Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <SectionHeader title="Location & Notes" />
          <Card style={styles.card}>
            <View style={styles.infoRow}>
              <MapPin size={20} color={COLORS.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Service Address</Text>
                <Text style={styles.infoSub}>{address.addressLine}, {address.city} - {address.pincode}</Text>
              </View>
            </View>

            {notes ? (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <AlignLeft size={20} color={COLORS.textSecondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Instructions</Text>
                    <Text style={styles.infoSub}>{notes}</Text>
                  </View>
                </View>
              </>
            ) : null}

            {images && images.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <ImageIcon size={20} color={COLORS.textSecondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Attached Images ({images.length})</Text>
                    <View style={styles.imageGrid}>
                      {images.map((img, idx) => <Image key={idx} source={{ uri: img }} style={styles.thumbnail} />)}
                    </View>
                  </View>
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Pricing Card */}
        <Animated.View entering={FadeInUp.delay(250).springify()}>
          <SectionHeader title="Payment Details" />
          <Card style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Item Total</Text>
              <Text style={styles.priceValue}>{fmtINR(pricing?.baseAmount)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & Fees</Text>
              <Text style={styles.priceValue}>{fmtINR(pricing?.convenienceFee)}</Text>
            </View>

            {pricing.discount > 0 && (
              <View style={styles.priceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TicketPercent size={16} color={COLORS.success} style={{ marginRight: 6 }} />
                  <Text style={[styles.priceLabel, { color: COLORS.success }]}>Promo Discount ({couponCode})</Text>
                </View>
                <Text style={[styles.priceValue, { color: COLORS.success }]}>-{fmtINR(pricing.discount)}</Text>
              </View>
            )}

            <View style={styles.dividerDashed} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>{fmtINR(pricing.totalAmount)}</Text>
            </View>

            <View style={styles.payNoteBox}>
              <Wallet size={16} color={COLORS.primary} />
              <Text style={styles.payNoteTxt}>Pay cash or online after the service is completed</Text>
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Sticky CTA */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.bottomPanel}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>{fmtINR(pricing.totalAmount)}</Text>
        </View>
        <PrimaryButton 
          title="Confirm Booking" 
          onPress={handleConfirm}
          loading={submitting}
          style={styles.confirmBtn}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xl, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingTop: 0 },

  instantBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, 
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border
  },
  instantTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.primaryDark },
  instantSub: { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 2, fontWeight: '500' },

  card: { padding: SPACING.lg, marginBottom: SPACING.lg },
  serviceHeaderRow: { padding: SPACING.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  catName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  subServicesList: { padding: SPACING.lg },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  serviceRowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: SPACING.md },
  serviceItemName: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginLeft: SPACING.sm, fontWeight: '600' },
  serviceItemPrice: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontStyle: 'italic' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoTextContainer: { flex: 1, marginLeft: SPACING.md },
  infoTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  infoSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },

  imageGrid: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  thumbnail: { width: 60, height: 60, borderRadius: BORDER_RADIUS.md },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  priceLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  priceValue: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  dividerDashed: { height: 1, borderBottomWidth: 1, borderColor: COLORS.divider, borderStyle: 'dashed', marginVertical: SPACING.md },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  totalLabel: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  totalValue: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: COLORS.primary },

  payNoteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm },
  payNoteTxt: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '600', flex: 1 },

  bottomPanel: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, 
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.lg 
  },
  bottomInfo: { flex: 1 },
  bottomTotalLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  bottomTotalValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.textPrimary },
  confirmBtn: { width: 180 }
});

export default BookingSummaryScreen;
