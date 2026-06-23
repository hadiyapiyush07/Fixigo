import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Animated, Linking, Clipboard
} from 'react-native';
import Reanimated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../../api/booking.api';
import { socketService } from '../../services/socket.service';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

// ── Status display config ─────────────────────────────────────────────────
const STATUS_INFO = {
  pending:             { icon: '🔍', title: 'Finding Provider',    message: 'We are searching for the best provider near you...', color: '#3B82F6', bg: '#EFF6FF', pulse: true  },
  accepted:            { icon: '🤝', title: 'Job Accepted!',       message: 'A provider has accepted your booking.',              color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  confirmed:           { icon: '✅', title: 'Provider Confirmed!', message: 'Your provider accepted and will arrive soon.',       color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  provider_on_the_way: { icon: '🚗', title: 'Provider is Coming!', message: 'Your provider is on the way to your location.',     color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  arrived:             { icon: '📍', title: 'Provider Arrived',    message: 'Your provider is at your location.',                color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  otp_verification:    { icon: '🔑', title: 'Share OTP to Begin', message: 'Show the OTP below to your provider to start work.', color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  in_progress:         { icon: '🔧', title: 'Work in Progress',   message: 'Your provider is actively working on the service.',  color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  payment_pending:     { icon: '💳', title: 'Payment Due',        message: 'Work is complete! Please make the payment.',         color: '#3B82F6', bg: '#EFF6FF', pulse: false },
  completed:           { icon: '🎉', title: 'Service Complete!',  message: 'Service done. We hope you loved the experience!',    color: '#16A34A', bg: '#DCFCE7', pulse: false },
  cancelled:           { icon: '❌', title: 'Booking Cancelled',  message: 'This booking has been cancelled.',                   color: '#EF4444', bg: '#FEF2F2', pulse: false },
  rejected:            { icon: '⚠️', title: 'No Provider Found',  message: 'No providers are available right now. Try again.',   color: '#6B7280', bg: '#F9FAFB', pulse: false },
};

// ── Professional timeline steps ───────────────────────────────────────────
const TIMELINE_STEPS = [
  { id: 'created', label: 'Booking Created',     icon: '📋' },
  { id: 'assigned',label: 'Provider Assigned',   icon: '👤' },
  { id: 'accepted',label: 'Accepted',            icon: '✅' },
  { id: 'on_way',  label: 'On The Way',          icon: '🚗' },
  { id: 'arrived', label: 'Arrived',             icon: '📍' },
  { id: 'otp',     label: 'OTP Verified',        icon: '🔑' },
  { id: 'started', label: 'Service Started',     icon: '🔧' },
  { id: 'payment', label: 'Payment Pending',     icon: '💳' },
  { id: 'done',    label: 'Completed',           icon: '🎉' },
];

// Terminal statuses — stop auto-polling when we reach these
const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'rejected']);

// Active statuses — poll aggressively
const ACTIVE_POLL_MS  = 3000;   // 3s while booking is active
const PASSIVE_POLL_MS = 30000;  // 30s for terminal (just in case)

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

  // ── Load booking ─────────────────────────────────────────────────────────
  const loadBooking = useCallback(async (silent = false) => {
    if (!bookingId) { setLoading(false); return; }
    try {
      const res = await bookingAPI.getById(bookingId);
      const data = res?.data?.data || res?.data || null;
      setBooking(data);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
    } catch (e) {
      if (!silent) console.log('Track error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

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

  // ── Initial load & Socket.IO Real-time setup ─────────────────────────────
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

  // ── "Last updated X seconds ago" counter ─────────────────────────────────
  useEffect(() => {
    counterRef.current = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(counterRef.current);
  }, [lastUpdated]);

  // ── Pulse animation for pending status ────────────────────────────────────
  useEffect(() => {
    if (booking?.status === 'pending') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.status]);

  // ── Respond to provider's reschedule request ──────────────────────────────
  const handleRespondReschedule = async (response) => {
    try {
      setLoading(true);
      await bookingAPI.respondReschedule(bookingId, { response });
      Alert.alert(
        response === 'approved' ? '✅ Rescheduled' : '🔄 Reassigning',
        response === 'approved'
          ? 'You approved the reschedule request.'
          : 'Declined. We are searching for another provider.'
      );
      loadBooking();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to respond.');
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel booking ────────────────────────────────────────────────────────
  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && !booking) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading tracking info...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loaderBox}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={styles.loaderText}>Booking not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status      = booking.status || 'pending';
  const info        = STATUS_INFO[status] || STATUS_INFO.pending;
  const provider    = booking.providerId;
  const isCompleted = status === 'completed';
  const canCancel   = ['pending', 'accepted', 'confirmed', 'provider_on_the_way', 'arrived'].includes(status);
  const canRate     = isCompleted && !booking.isRated;

  // ── Timeline helpers ──────────────────────────────────────────────────────
  const getCurrentStepIndex = () => {
    if (!booking) return 0;
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
    if (!booking || !booking.statusHistory) return null;
    let targetStatus;
    if (stepId === 'created') targetStatus = 'pending';
    if (stepId === 'assigned' || stepId === 'accepted') targetStatus = 'confirmed'; // Approximate, as assigned is virtual
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;



  const handleCopyOtp = () => {
    if (booking?.startOtp) {
      Clipboard.setString(booking.startOtp.toString());
      Alert.alert('Copied!', 'OTP has been copied to your clipboard.');
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Track Booking</Text>
          <Text style={styles.headerSub}>#{bookingId?.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: info.color + '22', borderColor: info.color }]}>
          <Text style={[styles.statusBadgeText, { color: info.color }]}>{status.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* ── Live Status Card ─────────────────────────────────────────── */}
        <Animated.View style={[styles.statusCard, { backgroundColor: info.bg, borderColor: info.color, transform: [{ scale: info.pulse ? pulseAnim : 1 }] }]}>
          <Text style={styles.statusIcon}>{info.icon}</Text>
          <Text style={[styles.statusTitle, { color: info.color }]}>{info.title}</Text>
          <Text style={styles.statusMessage}>{info.message}</Text>
          {status === 'pending' && (
            <View style={styles.searchingRow}>
              <ActivityIndicator color={info.color} size="small" />
              <Text style={[styles.searchingText, { color: info.color }]}>Searching nearby providers...</Text>
            </View>
          )}
          {/* Last updated indicator */}
          <Text style={[styles.lastUpdated, { color: info.color + 'AA' }]}>
            🔄 Auto-refreshing · Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
          </Text>
        </Animated.View>

        {/* ── Live Tracking Map ────────────────────────────────────────────── */}
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

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        {provider && status !== 'cancelled' && status !== 'completed' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity 
              style={{ width: '48%', backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
              onPress={() => Linking.openURL(`tel:${provider.userId?.phone || ''}`)}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>📞</Text>
              <Text style={{ color: '#111827', fontWeight: '600', fontSize: 15 }}>Call Provider</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ width: '48%', backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              onPress={() => handleChat(provider.userId?.phone)}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>💬</Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Message</Text>
              {hasNewMessage && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', position: 'absolute', top: 12, right: 16 }} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Minimalist OTP Card ─────────────────────────────────────────────────── */}
        {booking.startOtp && (status === 'arrived' || status === 'otp_verification') && (
          <Reanimated.View entering={FadeInUp.delay(200).springify()} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', padding: 24, borderRadius: 16, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Service Verification OTP
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', paddingVertical: 20, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 48, fontWeight: '800', letterSpacing: 16, color: '#111827', marginLeft: 16 }}>
                {booking.startOtp}
              </Text>
              <TouchableOpacity onPress={handleCopyOtp} style={{ padding: 10, marginLeft: 8 }}>
                <Text style={{ fontSize: 20, opacity: 0.6 }}>📋</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 16, textAlign: 'center', fontWeight: '500', lineHeight: 18 }}>
              Please share this code with the provider to begin the service.
            </Text>
          </Reanimated.View>
        )}

        {/* ── Reschedule Request Banner ─────────────────────────────────── */}
        {booking.rescheduleRequest?.status === 'pending' && booking.rescheduleRequest.requestedBy === 'provider' && (
          <Reanimated.View entering={FadeInUp.delay(200).springify()} style={styles.rescheduleCard}>
            <Text style={styles.rescheduleTitle}>📅 Reschedule Requested by Provider</Text>
            <Text style={styles.rescheduleBody}>
              Your provider has requested to reschedule to:
            </Text>
            <Text style={styles.rescheduleProposed}>
              {new Date(booking.rescheduleRequest.proposedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at {booking.rescheduleRequest.proposedTime}
            </Text>
            {booking.rescheduleRequest.reason ? (
              <Text style={styles.rescheduleReason}>Reason: "{booking.rescheduleRequest.reason}"</Text>
            ) : null}
            <View style={styles.rescheduleActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={() => handleRespondReschedule('declined')} disabled={loading}>
                <Text style={styles.declineText}>Decline & Reassign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleRespondReschedule('approved')} disabled={loading}>
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        )}

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        {status !== 'cancelled' && status !== 'rejected' && (
          <Reanimated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Booking Progress</Text>
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone    = idx < currentIdx || isCompleted;
              const isCurrent = idx === currentIdx && !isCompleted;
              const isFuture  = idx > currentIdx && !isCompleted;
              const ts        = getStepTimestamp(step.id);

              return (
                <View key={step.id} style={styles.timelineRow}>
                  {/* Left — dot + connector */}
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isDone    && styles.timelineDotDone,
                      isCurrent && styles.timelineDotCurrent,
                      isFuture  && styles.timelineDotFuture,
                    ]}>
                      {isDone    && <Text style={styles.timelineDotIcon}>✓</Text>}
                      {isCurrent && <ActivityIndicator size={10} color="#FFF" />}
                    </View>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                    )}
                  </View>
                  {/* Right — label + timestamp */}
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      isDone    && styles.timelineLabelDone,
                      isCurrent && styles.timelineLabelCurrent,
                      isFuture  && styles.timelineLabelFuture,
                    ]}>
                      {step.icon} {step.label}
                    </Text>
                    {ts && <Text style={styles.timelineTime}>{ts}</Text>}
                  </View>
                </View>
              );
            })}
          </Reanimated.View>
        )}

        {/* ── Provider Card ─────────────────────────────────────────────── */}
        {provider && (
          <Reanimated.View entering={FadeInUp.delay(400).springify()} style={styles.section}>
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
                {provider?.bio ? <Text style={styles.providerBio} numberOfLines={2}>{provider.bio}</Text> : null}
                <View style={styles.providerMeta}>
                  {provider?.rating?.average > 0 && (
                    <View style={styles.ratingChip}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingText}>{Number(provider.rating.average).toFixed(1)}</Text>
                    </View>
                  )}
                  {provider?.experience > 0 && (
                    <View style={styles.expChip}>
                      <Text style={styles.expText}>{provider.experience}yr exp</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Reanimated.View>
        )}

        {/* ── Services Ordered ──────────────────────────────────────────── */}
        {(booking.subServices?.length > 0 || booking.subService?.name) && (
          <Reanimated.View entering={FadeInUp.delay(500).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ Services Ordered</Text>
            {booking.subServices?.length > 0 ? (
              booking.subServices.map((s, i) => (
                <View key={i} style={styles.serviceRow}>
                  <View>
                    <Text style={styles.serviceName}>• {s.name}</Text>
                    {s.duration > 0 && <Text style={styles.serviceDuration}>⏱ {s.duration} min</Text>}
                  </View>
                  <Text style={styles.servicePrice}>{fmtINR(s.price)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.serviceRow}>
                <Text style={styles.serviceName}>• {booking.subService?.name}</Text>
                <Text style={styles.servicePrice}>{fmtINR(booking.subService?.price)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            {/* Payment Breakdown */}
            {booking.pricing && (
              <>
                {booking.pricing.discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Discount</Text>
                    <Text style={[styles.priceValue, { color: '#16A34A' }]}>- {fmtINR(booking.pricing.discount)}</Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Convenience Fee</Text>
                  <Text style={styles.priceValue}>{fmtINR(booking.pricing.convenienceFee)}</Text>
                </View>
                <View style={[styles.priceRow, styles.priceRowTotal]}>
                  <Text style={styles.priceTotalLabel}>Total Payable</Text>
                  <Text style={styles.priceTotalValue}>{fmtINR(booking.pricing.totalAmount)}</Text>
                </View>
              </>
            )}
          </Reanimated.View>
        )}

        {/* ── Booking Info ──────────────────────────────────────────────── */}
        <Reanimated.View entering={FadeInUp.delay(600).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Booking Info</Text>
          <InfoRow label="Booking ID" value={`#${bookingId?.slice(-8).toUpperCase()}`} />
          <InfoRow label="Category"   value={booking.categoryId?.name || '—'} />
          <InfoRow label="Type"       value="⚡ Instant Booking" />
          <InfoRow label="Address"    value={[booking.address?.addressLine, booking.address?.city, booking.address?.pincode].filter(Boolean).join(', ')} />
        </Reanimated.View>

        {/* ── Premium Completion / Rate Card ─────────────────────────────── */}
        {isCompleted && (
          <Reanimated.View entering={FadeInUp.delay(700).springify()} style={[styles.section, { backgroundColor: canRate ? '#FEFCE8' : '#DCFCE7', borderColor: canRate ? '#FDE047' : '#86EFAC', borderWidth: 2 }]}>
            <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
              <Text style={{ fontSize: 64, marginBottom: 12 }}>{canRate ? '🌟' : '🎉'}</Text>
              <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '900', color: canRate ? '#A16207' : '#166534', textAlign: 'center', marginBottom: 8 }}>
                {canRate ? 'Service Completed!' : 'Thank You!'}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.md, color: canRate ? '#CA8A04' : '#15803D', textAlign: 'center', marginBottom: 24 }}>
                {canRate ? 'Please rate your experience to help us improve.' : 'We hope you loved your Fixigo experience.'}
              </Text>
              
              {canRate && (
                <TouchableOpacity
                  style={{ backgroundColor: '#EAB308', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 100, shadowColor: '#EAB308', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                  onPress={() => navigation.navigate('Review', { bookingId, providerId: booking.providerId?._id })}
                >
                  <Text style={{ color: '#FFF', fontSize: FONT_SIZES.lg, fontWeight: '800' }}>⭐ Rate Your Provider</Text>
                </TouchableOpacity>
              )}
            </View>
          </Reanimated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer Actions ────────────────────────────────────────────── */}
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

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F7FA' },
  content:    { paddingBottom: SPACING.xxxl },
  loaderBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  backBtn:    { marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText:{ color: '#FFF', fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl + SPACING.lg, paddingBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  headerBack:      { padding: 4 },
  headerBackText:  { fontSize: 28, color: COLORS.textPrimary, fontWeight: '300' },
  headerTitle:     { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111827' },
  headerSub:       { fontSize: FONT_SIZES.xs, color: '#9CA3AF', marginTop: 1 },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Status Card
  statusCard: {
    margin: SPACING.xl, borderRadius: BORDER_RADIUS.xl, borderWidth: 2,
    padding: SPACING.xl, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  statusIcon:    { fontSize: 64, marginBottom: SPACING.md },
  statusTitle:   { fontSize: FONT_SIZES.xl, fontWeight: '800', textAlign: 'center' },
  statusMessage: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  searchingRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  searchingText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  lastUpdated:   { fontSize: 11, marginTop: SPACING.md, fontWeight: '500' },

  // OTP
  otpCard: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.lg,
    backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2, borderColor: '#8B5CF6', padding: SPACING.xl, alignItems: 'center',
  },
  otpLabel: { fontSize: 11, fontWeight: '800', color: '#6D28D9', letterSpacing: 1.2, marginBottom: 12 },
  otpCode:  { fontSize: 44, fontWeight: '900', letterSpacing: 10, color: '#4C1D95' },
  otpHint:  { fontSize: FONT_SIZES.xs, color: '#7C3AED', marginTop: 10, textAlign: 'center' },

  // Reschedule
  rescheduleCard:     { marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, backgroundColor: '#FEF3C7', borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5, borderColor: '#F59E0B', padding: SPACING.lg },
  rescheduleTitle:    { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#B7770D', marginBottom: 6 },
  rescheduleBody:     { fontSize: FONT_SIZES.sm, color: '#D97706', lineHeight: 20 },
  rescheduleProposed: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#92400E', marginTop: 4 },
  rescheduleReason:   { fontSize: FONT_SIZES.xs, color: '#9A4E0A', fontStyle: 'italic', marginTop: 4 },
  rescheduleActions:  { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  declineBtn:         { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 10, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderColor: '#FCA5A5', borderWidth: 1 },
  declineText:        { color: '#EF4444', fontWeight: '700', fontSize: FONT_SIZES.sm },
  approveBtn:         { flex: 1, backgroundColor: '#D1FAE5', paddingVertical: 10, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderColor: '#6EE7B7', borderWidth: 1 },
  approveText:        { color: '#059669', fontWeight: '700', fontSize: FONT_SIZES.sm },

  // Section
  section:      { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.lg, marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827', marginBottom: SPACING.md },
  divider:      { height: 1, backgroundColor: '#F3F4F6', marginVertical: SPACING.md },

  // Timeline
  timelineRow:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  timelineLeft:        { alignItems: 'center', width: 32, marginRight: SPACING.md },
  timelineDot:         { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  timelineDotDone:     { backgroundColor: '#16A34A' },
  timelineDotCurrent:  { backgroundColor: COLORS.primary },
  timelineDotFuture:   { backgroundColor: '#E5E7EB' },
  timelineDotIcon:     { color: '#FFF', fontSize: 12, fontWeight: '900' },
  timelineLine:        { width: 2, flex: 1, minHeight: 28, backgroundColor: '#E5E7EB', marginVertical: 2 },
  timelineLineDone:    { backgroundColor: '#16A34A' },
  timelineContent:     { flex: 1, paddingBottom: 16 },
  timelineLabel:       { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#9CA3AF' },
  timelineLabelDone:   { color: '#16A34A', fontWeight: '700' },
  timelineLabelCurrent:{ color: COLORS.primary, fontWeight: '800' },
  timelineLabelFuture: { color: '#D1D5DB' },
  timelineTime:        { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  // Provider
  providerCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  providerAvatar:     { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  providerAvatarText: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  providerName:       { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#111827' },
  providerPhone:      { fontSize: FONT_SIZES.sm, color: '#6B7280', marginTop: 2 },
  providerBio:        { fontSize: FONT_SIZES.xs, color: '#9CA3AF', marginTop: 4, lineHeight: 16 },
  providerMeta:       { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  ratingChip:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  ratingStar:         { color: '#F39C12', fontSize: 12 },
  ratingText:         { fontSize: 12, fontWeight: '700', color: '#B7770D', marginLeft: 3 },
  expChip:            { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  expText:            { fontSize: 12, fontWeight: '600', color: '#3B82F6' },

  // Services
  serviceRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  serviceName:   { fontSize: FONT_SIZES.sm, color: '#111827', fontWeight: '600', flex: 1 },
  serviceDuration:{ fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  servicePrice:  { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary },

  // Price breakdown
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel:     { fontSize: FONT_SIZES.sm, color: '#6B7280' },
  priceValue:     { fontSize: FONT_SIZES.sm, color: '#111827', fontWeight: '600' },
  priceRowTotal:  { borderTopWidth: 1.5, borderTopColor: '#E5E7EB', marginTop: 6, paddingTop: 10 },
  priceTotalLabel:{ fontSize: FONT_SIZES.md, fontWeight: '800', color: '#111827' },
  priceTotalValue:{ fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.primary },

  // Booking Info
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  infoLabel: { fontSize: FONT_SIZES.sm, color: '#6B7280', flex: 1 },
  infoValue: { fontSize: FONT_SIZES.sm, color: '#111827', fontWeight: '600', flex: 1.8, textAlign: 'right' },

  // Footer
  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: SPACING.sm, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 6 },
  cancelBtn:   { backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: '#FCA5A5' },
  cancelBtnText:{ color: '#EF4444', fontWeight: '700', fontSize: FONT_SIZES.md },
  rateBtn:     { backgroundColor: '#FEF3C7', paddingVertical: 14, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  rateBtnText: { color: '#B7770D', fontWeight: '700', fontSize: FONT_SIZES.md },
  completedBanner:     { backgroundColor: '#DCFCE7', paddingVertical: 14, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  completedBannerText: { color: '#16A34A', fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default BookingTrackScreen;