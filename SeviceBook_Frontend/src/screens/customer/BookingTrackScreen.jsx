import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Animated, Linking, Clipboard, BackHandler
} from 'react-native';
import Reanimated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Search, CheckCircle2, Navigation2, MapPin, ShieldCheck, Wrench, CreditCard, 
  Star, XCircle, AlertCircle, Phone, MessageCircle, Copy, RefreshCw, ChevronLeft 
} from 'lucide-react-native';
import { bookingAPI } from '../../api/booking.api';
import { socketService } from '../../services/socket.service';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import Skeleton from '../../components/Skeleton';
import { calculateDistance, calculateETA } from '../../utils/distance';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Avatar } from '../../components/ui/Avatar';

const STATUS_INFO = {
  pending:             { icon: <Search size={32} color="#3B82F6" />, title: 'Finding Provider',    message: 'We are searching for the best provider near you...', color: '#3B82F6', bg: '#EFF6FF', pulse: true  },
  accepted:            { icon: <CheckCircle2 size={32} color="#3B82F6" />, title: 'Job Accepted!',       message: 'A provider has accepted your booking.',              color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  confirmed:           { icon: <CheckCircle2 size={32} color="#3B82F6" />, title: 'Provider Confirmed!', message: 'Your provider accepted and will arrive soon.',       color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  provider_on_the_way: { icon: <Navigation2 size={32} color="#3B82F6" />, title: 'Provider is Coming!', message: 'Your provider is on the way to your location.',     color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  arrived:             { icon: <MapPin size={32} color="#3B82F6" />, title: 'Provider Arrived',    message: 'Your provider is at your location.',                color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  otp_verification:    { icon: <ShieldCheck size={32} color="#3B82F6" />, title: 'Share OTP to Begin', message: 'Show the OTP below to your provider to start work.', color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  in_progress:         { icon: <Wrench size={32} color="#3B82F6" />, title: 'Work in Progress',   message: 'Your provider is actively working on the service.',  color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  payment_pending:     { icon: <CreditCard size={32} color="#3B82F6" />, title: 'Payment Due',        message: 'Work is complete! Please make the payment.',         color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  completed:           { icon: <Star size={32} color="#16A34A" />, title: 'Service Complete!',  message: 'Service done. We hope you loved the experience!',    color: '#16A34A', bg: '#DCFCE7', pulse: false },
  cancelled:           { icon: <XCircle size={32} color="#EF4444" />, title: 'Booking Cancelled',  message: 'This booking has been cancelled.',                   color: '#EF4444', bg: '#FEF2F2', pulse: false },
  rejected:            { icon: <AlertCircle size={32} color="#6B7280" />, title: 'No Provider Found',  message: 'No providers are available right now. Try again.',   color: '#6B7280', bg: '#F9FAFB', pulse: false },
};

const TIMELINE_STEPS = [
  { id: 'created', label: 'Booking Created',     icon: <CheckCircle2 size={16} color="#FFF" /> },
  { id: 'assigned',label: 'Provider Assigned',   icon: <CheckCircle2 size={16} color="#FFF" /> },
  { id: 'accepted',label: 'Accepted',            icon: <CheckCircle2 size={16} color="#FFF" /> },
  { id: 'on_way',  label: 'On The Way',          icon: <Navigation2 size={16} color="#FFF" /> },
  { id: 'arrived', label: 'Arrived',             icon: <MapPin size={16} color="#FFF" /> },
  { id: 'otp',     label: 'OTP Verified',        icon: <ShieldCheck size={16} color="#FFF" /> },
  { id: 'started', label: 'Service Started',     icon: <Wrench size={16} color="#FFF" /> },
  { id: 'payment', label: 'Payment Pending',     icon: <CreditCard size={16} color="#FFF" /> },
  { id: 'done',    label: 'Completed',           icon: <Star size={16} color="#FFF" /> },
];

const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'rejected']);

const BookingTrackScreen = ({ route, navigation }) => {
  const bookingId = route?.params?.bookingId;

  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo,  setSecondsAgo]  = useState(0);
  const [providerLocation, setProviderLocation] = useState(null);

  const timerRef   = useRef(null);
  const counterRef = useRef(null);
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  const [error, setError] = useState(null);

  const handleBack = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CustomerTabs', params: { screen: 'MyBookings' } }],
    });
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [handleBack]);

  const loadBooking = useCallback(async (silent = false) => {
    if (!bookingId) { setLoading(false); return; }
    try {
      if (!silent && !booking) setError(null);
      const res = await bookingAPI.getById(bookingId);
      const data = res?.data?.data || res?.data || null;
      setBooking(data);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
    } catch (e) {
      if (!silent && !booking) setError('Failed to load tracking info. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId, booking]);

  const [hasNewMessage, setHasNewMessage] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBooking(true);
      const iv = setInterval(() => loadBooking(false), 20000);
      
      socketService.joinBookingRoom(bookingId);
      const handleNewMessage = () => setHasNewMessage(true);
      socketService.on('newMessage', handleNewMessage);

      return () => {
        clearInterval(iv);
        socketService.leaveBookingRoom(bookingId);
        socketService.off('newMessage', handleNewMessage);
      };
    }, [bookingId])
  );

  useEffect(() => {
    loadBooking();
    if (!bookingId) return;

    socketService.joinBookingRoom(bookingId);

    const handleUpdate = () => loadBooking(true);
    socketService.on('booking:status_update', handleUpdate);

    const handleLocationUpdate = (data) => {
      setProviderLocation({
        latitude: data.latitude,
        longitude: data.longitude
      });
      setLastUpdated(Date.now());
      setSecondsAgo(0);
    };
    socketService.on('location:update', handleLocationUpdate);

    return () => {
      socketService.leaveBookingRoom(bookingId);
      socketService.off('booking:status_update', handleUpdate);
      socketService.off('location:update', handleLocationUpdate);
    };
  }, [bookingId, loadBooking]);

  useEffect(() => {
    counterRef.current = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(counterRef.current);
  }, [lastUpdated]);

  useEffect(() => {
    if (booking?.status === 'pending') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [booking?.status]);

  const handleRespondReschedule = async (response) => {
    try {
      setLoading(true);
      await bookingAPI.respondReschedule(bookingId, { response });
      Alert.alert(
        response === 'approved' ? '✅ Rescheduled' : '🔄 Reassigning',
        response === 'approved' ? 'You approved the reschedule request.' : 'Declined. We are searching for another provider.'
      );
      loadBooking();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to respond.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.cancel(bookingId, 'Cancelled by customer');
              loadBooking();
              Alert.alert('Cancelled', 'Your booking has been cancelled.');
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  };

  const handleChat = () => {
    if (!booking?.providerId?.userId?._id) return;
    setHasNewMessage(false);
    navigation.navigate('Chat', {
      bookingId,
      receiverId: booking.providerId.userId._id,
      receiverName: booking.providerId.userId.name || 'Provider'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooking();
  };

  if (loading && !booking) {
    return (
      <View style={[styles.safe, { padding: SPACING.lg, paddingTop: 60 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 16 }} />
          <Skeleton width={150} height={24} />
        </View>
        <Skeleton width="100%" height={160} borderRadius={BORDER_RADIUS.xxl} style={{ marginBottom: 24 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <Skeleton width="48%" height={56} borderRadius={BORDER_RADIUS.xl} />
          <Skeleton width="48%" height={56} borderRadius={BORDER_RADIUS.xl} />
        </View>
        <Skeleton width="100%" height={240} borderRadius={BORDER_RADIUS.xxl} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderBox}>
        <AlertCircle size={64} color={COLORS.textSecondary} />
        <Text style={styles.loaderText}>{error}</Text>
        <PrimaryButton title="Retry" onPress={loadBooking} style={{ width: 150, marginTop: SPACING.lg }} />
        <PrimaryButton title="Go Back" variant="outline" onPress={handleBack} style={{ width: 150, marginTop: SPACING.md }} />
      </View>
    );
  }

  if (!booking) return null;

  const status      = booking.status || 'pending';
  const info        = STATUS_INFO[status] || STATUS_INFO.pending;
  const provider    = booking.providerId;
  const isCompleted = status === 'completed';
  const canCancel   = ['pending', 'accepted', 'confirmed', 'provider_on_the_way', 'arrived'].includes(status);
  const canRate     = isCompleted && !booking.isRated;

  const getCurrentStepIndex = () => {
    const s = booking.status;
    if (s === 'completed') return 8;
    if (s === 'payment_pending') return 7;
    if (s === 'in_progress') return 6;
    if (s === 'otp_verification') return 5;
    if (s === 'arrived') return 4;
    if (s === 'provider_on_the_way') return 3;
    if (s === 'confirmed' || s === 'accepted') return 2;
    if (booking.providerId) return 1;
    return 0;
  };
  const currentIdx = getCurrentStepIndex();

  const getStepTimestamp = (stepId) => {
    if (!booking.statusHistory) return null;
    let targetStatus;
    if (stepId === 'created') targetStatus = 'pending';
    if (stepId === 'assigned' || stepId === 'accepted') targetStatus = 'confirmed';
    if (stepId === 'on_way') targetStatus = 'provider_on_the_way';
    if (stepId === 'arrived') targetStatus = 'arrived';
    if (stepId === 'otp') targetStatus = 'otp_verification';
    if (stepId === 'started') targetStatus = 'in_progress';
    if (stepId === 'payment') targetStatus = 'payment_pending';
    if (stepId === 'done') targetStatus = 'completed';

    const entry = booking.statusHistory?.find(h => h.status === targetStatus || (stepId === 'accepted' && h.status === 'accepted'));
    if (!entry?.changedAt) return null;
    const d = new Date(entry.changedAt);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
           ' · ' +
           d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleCopyOtp = () => {
    if (booking?.startOtp) {
      Clipboard.setString(booking.startOtp.toString());
      Alert.alert('Copied!', 'OTP has been copied to your clipboard.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
          <ChevronLeft size={32} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Track Booking</Text>
          <Text style={styles.headerSub}>#{bookingId?.slice(-8).toUpperCase()}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <Animated.View style={{ transform: [{ scale: info.pulse ? pulseAnim : 1 }] }}>
          <Card style={styles.statusCard} noPadding>
            <View style={styles.statusCardInner}>
              <View style={[styles.statusIconBox, { backgroundColor: info.bg }]}>
                {info.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, { color: info.color }]}>{info.title}</Text>
                <Text style={styles.statusMessage}>{info.message}</Text>
              </View>
            </View>
            <View style={styles.refreshRow}>
               <RefreshCw size={14} color={info.color} />
               <Text style={[styles.refreshTxt, { color: info.color }]}>Auto-refreshing · Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}</Text>
            </View>
          </Card>
        </Animated.View>

        {(status === 'accepted' || status === 'confirmed' || status === 'provider_on_the_way' || status === 'arrived') && (
          <Reanimated.View entering={FadeInUp.delay(100).springify()}>
            <LiveTrackingMap 
              providerLocation={providerLocation}
              customerLocation={{
                latitude: booking.address?.location?.coordinates[1] || 0,
                longitude: booking.address?.location?.coordinates[0] || 0,
              }}
            />
          </Reanimated.View>
        )}

        {provider && status !== 'cancelled' && status !== 'completed' && (
          <Reanimated.View entering={FadeInUp.delay(150).springify()}>
            <View style={styles.quickActionsRow}>
              <PrimaryButton 
                title="Call" 
                variant="outline" 
                icon={<Phone size={18} color={COLORS.primary} />}
                onPress={() => Linking.openURL(`tel:${provider.userId?.phone || ''}`)}
                style={styles.halfBtn}
              />
              <View style={styles.btnSpacer} />
              <PrimaryButton 
                title="Message" 
                variant="primary" 
                icon={<MessageCircle size={18} color={COLORS.white} />}
                onPress={() => handleChat(provider.userId?.phone)}
                style={styles.halfBtn}
              />
              {hasNewMessage && <View style={styles.notificationDot} />}
            </View>
          </Reanimated.View>
        )}

        {booking.startOtp && (status === 'arrived' || status === 'otp_verification') && (
          <Reanimated.View entering={FadeInUp.delay(200).springify()}>
            <Card style={styles.otpCard}>
              <View style={styles.otpTopRow}>
                <View style={styles.otpIconBox}>
                  <ShieldCheck size={28} color={COLORS.primary} />
                </View>
                <View style={styles.otpInfo}>
                  <Text style={styles.otpTitle}>Service OTP</Text>
                  <Text style={styles.otpSub}>Share this OTP with your provider to begin the service securely.</Text>
                </View>
              </View>
              
              <View style={styles.otpCodeBox}>
                <Text style={styles.otpCodeTxt}>{booking.startOtp}</Text>
              </View>
              
              <PrimaryButton 
                title="Copy OTP" 
                variant="secondary" 
                icon={<Copy size={16} color={COLORS.white} />}
                onPress={handleCopyOtp}
              />
            </Card>
          </Reanimated.View>
        )}

        {status !== 'cancelled' && status !== 'rejected' && (
          <Reanimated.View entering={FadeInUp.delay(300).springify()}>
            <SectionHeader title="Booking Progress" />
            <Card>
              {TIMELINE_STEPS.map((step, idx) => {
                const isDone    = idx < currentIdx || isCompleted;
                const isCurrent = idx === currentIdx && !isCompleted;
                const isFuture  = idx > currentIdx && !isCompleted;
                const ts        = getStepTimestamp(step.id);

                return (
                  <View key={step.id} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        isDone    && styles.timelineDotDone,
                        isCurrent && styles.timelineDotCurrent,
                        isFuture  && styles.timelineDotFuture,
                      ]}>
                        {isDone    && step.icon}
                        {isCurrent && <ActivityIndicator size={12} color="#FFF" />}
                        {isFuture  && <View style={styles.timelineDotSmall} />}
                      </View>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[
                        styles.timelineLabel,
                        isDone    && styles.timelineLabelDone,
                        isCurrent && styles.timelineLabelCurrent,
                        isFuture  && styles.timelineLabelFuture,
                      ]}>
                        {step.label}
                      </Text>
                      {ts && <Text style={styles.timelineTime}>{ts}</Text>}
                    </View>
                  </View>
                );
              })}
            </Card>
          </Reanimated.View>
        )}

        {provider && (
          <Reanimated.View entering={FadeInUp.delay(400).springify()}>
            <SectionHeader title="Your Provider" />
            <Card>
              <View style={styles.providerRow}>
                <Avatar name={provider?.userId?.name || 'Provider'} size={60} />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider?.userId?.name || 'Provider'}</Text>
                  <Text style={styles.providerPhone}>📱 {provider?.userId?.phone || ''}</Text>
                  <View style={styles.metaRow}>
                    {provider?.rating?.average > 0 && (
                      <View style={styles.ratingChip}>
                        <Star size={12} color={COLORS.star} fill={COLORS.star} />
                        <Text style={styles.ratingTxt}>{Number(provider.rating.average).toFixed(1)}</Text>
                      </View>
                    )}
                    {provider?.experience > 0 && (
                      <View style={styles.expChip}>
                        <Text style={styles.expTxt}>{provider.experience}yr exp</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </Reanimated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {canCancel && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelBooking}>
            <Text style={styles.cancelBtnText}>✕ Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  safe:       { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  loaderBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.background },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerBack:      { padding: SPACING.xs },
  headerTitle:     { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:       { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },

  statusCard: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg,
  },
  statusCardInner: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconBox: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  statusTitle:   { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  statusMessage: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 4, lineHeight: 22 },
  refreshRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, backgroundColor: COLORS.background,
    borderBottomLeftRadius: BORDER_RADIUS.xxl, borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  refreshTxt: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginLeft: SPACING.xs },

  quickActionsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  halfBtn: { flex: 1 },
  btnSpacer: { width: SPACING.md },
  notificationDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.danger,
    position: 'absolute', top: -4, right: -4, borderWidth: 2, borderColor: COLORS.surface
  },

  otpCard: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primaryLight },
  otpTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  otpIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  otpInfo: { flex: 1, marginLeft: SPACING.md },
  otpTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primaryDark },
  otpSub: { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 2, lineHeight: 18 },
  otpCodeBox: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg, ...SHADOWS.sm },
  otpCodeTxt: { fontSize: 40, fontWeight: '900', letterSpacing: 12, color: COLORS.primaryDark },

  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  timelineLeft: { alignItems: 'center', width: 32, marginRight: SPACING.md },
  timelineDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.divider },
  timelineDotDone: { backgroundColor: COLORS.success },
  timelineDotCurrent: { backgroundColor: COLORS.primary },
  timelineDotFuture: { backgroundColor: COLORS.divider },
  timelineDotSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.textDisabled },
  timelineLine: { width: 2, flex: 1, minHeight: 32, backgroundColor: COLORS.divider, marginVertical: 4 },
  timelineLineDone: { backgroundColor: COLORS.success },
  timelineContent: { flex: 1, paddingBottom: SPACING.md },
  timelineLabel: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  timelineLabelDone: { color: COLORS.success },
  timelineLabelCurrent: { color: COLORS.primary },
  timelineLabelFuture: { color: COLORS.textDisabled },
  timelineTime: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },

  providerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  providerPhone: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  ratingChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
  ratingTxt: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.warning, marginLeft: 4 },
  expChip: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
  expTxt: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, paddingBottom: 32, backgroundColor: COLORS.background },
  cancelBtn: { backgroundColor: COLORS.errorLight, height: 56, borderRadius: BORDER_RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: FONT_SIZES.lg },
});

export default BookingTrackScreen;