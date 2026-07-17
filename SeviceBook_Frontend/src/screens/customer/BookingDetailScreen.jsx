import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { bookingAPI } from '../../api/booking.api';
import { socketService } from '../../services/socket.service';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Avatar } from '../../components/ui/Avatar';
import { 
  FileText, Handshake, CheckCircle2, Car, MapPin, Key, Wrench, 
  Receipt, Star, XCircle, Phone, MessageCircle, Navigation, ChevronLeft, ChevronRight, Clock, Calendar
} from 'lucide-react-native';

const STATUS_STEPS = [
  { key: 'pending',             label: 'Booking Placed',     icon: <FileText size={20} color={COLORS.white} /> },
  { key: 'accepted',            label: 'Provider Accepted',  icon: <Handshake size={20} color={COLORS.white} /> },
  { key: 'confirmed',           label: 'Job Confirmed',      icon: <CheckCircle2 size={20} color={COLORS.white} /> },
  { key: 'provider_on_the_way', label: 'Provider On Way',    icon: <Car size={20} color={COLORS.white} /> },
  { key: 'arrived',             label: 'Provider Arrived',   icon: <MapPin size={20} color={COLORS.white} /> },
  { key: 'otp_verification',    label: 'OTP Verification',   icon: <Key size={20} color={COLORS.white} /> },
  { key: 'in_progress',         label: 'Work In Progress',   icon: <Wrench size={20} color={COLORS.white} /> },
  { key: 'payment_pending',     label: 'Payment Pending',    icon: <Receipt size={20} color={COLORS.white} /> },
  { key: 'completed',           label: 'Completed',          icon: <Star size={20} color={COLORS.white} /> },
];

const STATUS_ORDER = ['pending', 'accepted', 'confirmed', 'provider_on_the_way', 'arrived', 'otp_verification', 'in_progress', 'payment_pending', 'completed'];

const BookingDetailScreen = ({ navigation, route }) => {
  const bookingId = route?.params?.bookingId;
  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    try {
      const res = await bookingAPI.getById(bookingId);
      setBooking(res?.data?.data || res?.data || null);
    } catch (e) {
      console.log('Error', e?.response?.data?.message || 'Could not load booking');
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
        <XCircle size={64} color={COLORS.textTertiary} style={{ marginBottom: SPACING.md }} />
        <Text style={styles.emptyText}>Booking not found</Text>
        <PrimaryButton title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.lg, minWidth: 160 }} />
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
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            await bookingAPI.cancel(bookingId, 'Cancelled by customer');
            loadBooking();
          } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Could not cancel'); }
        }
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking #{bookingId?.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.content}
      >
        {/* Status Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Card style={[styles.statusCard, isCancelled && { backgroundColor: COLORS.errorLight }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.statusIconBox, isCancelled && { backgroundColor: COLORS.error }]}>
                {isCancelled ? <XCircle size={32} color={COLORS.white} /> : isCompleted ? <Star size={32} color={COLORS.white} /> : <FileText size={32} color={COLORS.white} />}
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={[styles.statusTitle, isCancelled && { color: COLORS.danger }]}>
                  {isCancelled ? 'Cancelled' : isCompleted ? 'Service Completed!' : 'Active Booking'}
                </Text>
                <StatusBadge status={booking.status} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Progress Timeline */}
        {!isCancelled && (
          <Animated.View entering={FadeInUp.delay(150).springify()}>
            <SectionHeader title="Timeline" />
            <Card style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md }}>
              {STATUS_STEPS.map((step, index) => {
                const isDone    = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isLast    = index === STATUS_STEPS.length - 1;
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={[styles.stepDot, isDone && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                        {isDone ? <CheckCircle2 size={16} color={COLORS.white} /> : <Text style={styles.stepDotText}>{index + 1}</Text>}
                      </View>
                      {!isLast && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, isDone && styles.stepLabelDone, isCurrent && styles.stepLabelCurrent]}>
                        {step.label}
                      </Text>
                      {isCurrent && <Text style={styles.stepCurrent}>Current status</Text>}
                    </View>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        )}

        {/* Service Details */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <SectionHeader title="Service Details" />
          <Card style={{ padding: SPACING.lg }}>
            <Text style={styles.catName}>{booking.categoryId?.name || 'Service'}</Text>
            <Text style={styles.subCatName}>{booking.subService?.name || 'General'}</Text>
            <View style={styles.divider} />
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Calendar size={18} color={COLORS.textSecondary} />
                <Text style={styles.dateText}>{new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.dateItem}>
                <Clock size={18} color={COLORS.textSecondary} />
                <Text style={styles.dateText}>{booking.scheduledTime}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Provider Details */}
        {booking.providerId && (
          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <SectionHeader title="Provider" />
            <Card style={styles.providerCard}>
              <View style={styles.providerRow}>
                <Avatar name={booking.providerId?.userId?.name || 'Provider'} size={56} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.providerName}>{booking.providerId?.userId?.name || 'Provider'}</Text>
                  <Text style={styles.providerPhone}>📱 {booking.providerId?.userId?.phone || ''}</Text>
                </View>
              </View>
              {canTrack && (
                <View style={styles.providerActions}>
                  <TouchableOpacity style={styles.provBtn}>
                    <Phone size={18} color={COLORS.primary} />
                    <Text style={styles.provBtnText}>Call</Text>
                  </TouchableOpacity>
                  <View style={{ width: SPACING.sm }} />
                  <TouchableOpacity style={styles.provBtn}>
                    <MessageCircle size={18} color={COLORS.primary} />
                    <Text style={styles.provBtnText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Payment */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <SectionHeader title="Payment Breakdown" />
          <Card style={{ padding: SPACING.lg }}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Amount</Text>
              <Text style={styles.priceValue}>₹{booking.pricing?.baseAmount || 0}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Convenience Fee</Text>
              <Text style={styles.priceValue}>₹{booking.pricing?.convenienceFee || 0}</Text>
            </View>
            <View style={styles.dividerDashed} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>₹{booking.pricing?.totalAmount || 0}</Text>
            </View>
            <View style={[styles.paymentBadge, { backgroundColor: (booking.paymentStatus === 'paid' || booking.status === 'completed') ? COLORS.successLight : COLORS.warningLight }]}>
              <CheckCircle2 size={16} color={(booking.paymentStatus === 'paid' || booking.status === 'completed') ? COLORS.success : '#B7770D'} style={{ marginRight: 6 }} />
              <Text style={[styles.paymentBadgeText, { color: (booking.paymentStatus === 'paid' || booking.status === 'completed') ? COLORS.success : '#B7770D' }]}>
                {(booking.paymentStatus === 'paid' || booking.status === 'completed') ? 'Paid' : 'Payment Pending'}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.bottomPanel}>
        {canTrack && (
          <PrimaryButton 
            title="Track Provider" 
            icon={<Navigation size={18} color={COLORS.white} />}
            onPress={() => navigation.navigate('BookingTrack', { bookingId })} 
            style={{ flex: 1, marginBottom: canCancel ? SPACING.sm : 0 }} 
          />
        )}
        {canRate && (
          <PrimaryButton 
            title="Rate Service" 
            icon={<Star size={18} color={COLORS.white} />}
            onPress={() => navigation.navigate('Review', { bookingId, providerId: booking.providerId?._id })} 
            style={{ flex: 1 }} 
          />
        )}
        {canCancel && (
          <PrimaryButton 
            title="Cancel Booking" 
            variant="outline" 
            onPress={handleCancel} 
            style={{ flex: 1 }}
            textStyle={{ color: COLORS.danger }}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: SPACING.lg, paddingTop: 0 },
  loaderBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  emptyText:  { fontSize: FONT_SIZES.xl, color: COLORS.textPrimary, fontWeight: '800' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  statusCard: { backgroundColor: COLORS.primaryDark, padding: SPACING.lg, marginBottom: SPACING.lg },
  statusIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepLeft: { alignItems: 'center', marginRight: SPACING.md },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepDotCurrent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '700' },
  stepLine: { width: 2, flex: 1, minHeight: 30, backgroundColor: COLORS.border, marginVertical: 4 },
  stepLineDone: { backgroundColor: COLORS.success },
  stepContent: { flex: 1, paddingBottom: SPACING.lg },
  stepLabel: { fontSize: FONT_SIZES.md, color: COLORS.textTertiary, fontWeight: '500' },
  stepLabelDone: { color: COLORS.textPrimary, fontWeight: '700' },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: '800' },
  stepCurrent: { fontSize: FONT_SIZES.xs, color: COLORS.primary, marginTop: 4, fontWeight: '600' },

  catName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  subCatName: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  dateRow: { flexDirection: 'row', gap: SPACING.xl },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },

  providerCard: { padding: SPACING.lg },
  providerRow: { flexDirection: 'row', alignItems: 'center' },
  providerName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  providerPhone: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 2 },
  providerActions: { flexDirection: 'row', marginTop: SPACING.lg },
  provBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primaryLight, gap: 8 },
  provBtnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT_SIZES.md },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  priceLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  priceValue: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  dividerDashed: { height: 1, borderBottomWidth: 1, borderColor: COLORS.divider, borderStyle: 'dashed', marginVertical: SPACING.md },
  totalLabel: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  totalValue: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: COLORS.textPrimary },
  paymentBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: SPACING.md, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.round },
  paymentBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },

  bottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: SPACING.lg, paddingBottom: 32, ...SHADOWS.lg },
});

export default BookingDetailScreen;