import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  Linking, ActivityIndicator, Modal, TextInput, TouchableOpacity
} from 'react-native';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { Phone, MessageCircle, Navigation, MapPin, Receipt, Navigation2, CheckCircle2 } from 'lucide-react-native';
import { bookingAPI } from '../../api/booking.api';
import { socketService } from '../../services/socket.service';
import { useLocation } from '../../hooks/useLocation';
import { calculateDistance, formatDistance } from '../../utils/distance';
import Skeleton from '../../components/Skeleton';

import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Avatar } from '../../components/ui/Avatar';

const ProviderBookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const [error, setError] = useState(null);

  const isActive = booking && !['completed', 'cancelled', 'rejected'].includes(booking.status);
  const { location } = useLocation({ isActiveBooking: isActive });

  const fetchBooking = useCallback(async (showLoad = true) => {
    if (showLoad) setLoading(true);
    try {
      if (showLoad) setError(null);
      const res = await bookingAPI.getById(bookingId);
      setBooking(res.data.data);
    } catch (err) {
      if (showLoad) setError('Failed to load booking. Please check your internet connection.');
    } finally {
      if (showLoad) setLoading(false);
    }
  }, [bookingId]);

  const handleSocketUpdate = useCallback(() => fetchBooking(false), [fetchBooking]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        fetchBooking(false);
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchBooking])
  );

  useEffect(() => {
    fetchBooking();
    const handleNewMsg = () => setHasNewMessage(true);
    socketService.joinBookingRoom(bookingId);
    socketService.on('booking:status_update', handleSocketUpdate);
    socketService.on('newMessage', handleNewMsg);

    return () => {
      socketService.leaveBookingRoom(bookingId);
      socketService.off('booking:status_update', handleSocketUpdate);
      socketService.off('newMessage', handleNewMsg);
    };
  }, [bookingId, fetchBooking, handleSocketUpdate]);

  const updateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      if (newStatus === 'completed') {
        Alert.alert('Job Completed! 🎉', 'You have successfully completed this booking.', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ProviderTabs', state: { routes: [{ name: 'Bookings' }] } }],
              });
            }
          }
        ]);
        return;
      }
      await fetchBooking(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = () => {
    if (!booking) return;
    if (booking.status === 'confirmed') updateStatus('provider_on_the_way');
    else if (booking.status === 'provider_on_the_way') updateStatus('arrived');
    else if (booking.status === 'arrived') updateStatus('otp_verification');
    else if (booking.status === 'otp_verification') setOtpModalVisible(true);
    else if (booking.status === 'in_progress') updateStatus('payment_pending');
    else if (booking.status === 'payment_pending') updateStatus('completed');
  };

  const submitOtp = async () => {
    if (otpInput.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }
    setActionLoading(true);
    try {
      await bookingAPI.updateStatus(bookingId, 'in_progress', otpInput);
      setOtpModalVisible(false);
      setOtpInput('');
      await fetchBooking(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Invalid OTP');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionText = () => {
    if (booking.status === 'confirmed') return 'Start Trip';
    if (booking.status === 'provider_on_the_way') return 'Mark as Arrived';
    if (booking.status === 'arrived') return 'Enter OTP';
    if (booking.status === 'otp_verification') return 'Start Service';
    if (booking.status === 'in_progress') return 'Finish & Request Payment';
    if (booking.status === 'payment_pending') return 'Confirm Payment & Complete Job';
    return null;
  };

  const handleCall = () => {
    if (booking?.customerId?.phone) Linking.openURL(`tel:${booking.customerId.phone}`);
  };

  const handleChat = () => {
    if (!booking?.customerId?._id) return;
    setHasNewMessage(false);
    navigation.navigate('Chat', {
      bookingId,
      receiverId: booking.customerId._id,
      receiverName: booking.customerId.name || 'Customer'
    });
  };

  const handleNavigate = () => {
    if (booking?.location?.coordinates && booking.location.coordinates.length === 2) {
      const [lng, lat] = booking.location.coordinates;
      Linking.openURL(`google.navigation:q=${lat},${lng}`);
    } else if (booking?.address?.addressLine) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address.addressLine)}`);
    } else {
      Alert.alert('Error', 'Location not available');
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
              setActionLoading(true);
              await bookingAPI.providerCancel(bookingId, 'Cancelled by provider');
              Alert.alert('Cancelled', 'Booking unassigned from you.');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel booking.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.safe, { padding: SPACING.lg, paddingTop: 60 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View>
            <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
            <Skeleton width={150} height={24} />
          </View>
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
        <Skeleton width="100%" height={120} borderRadius={BORDER_RADIUS.xxl} style={{ marginBottom: 30 }} />
        <Skeleton width="100%" height={120} borderRadius={BORDER_RADIUS.xxl} style={{ marginBottom: 30 }} />
        <Skeleton width="100%" height={120} borderRadius={BORDER_RADIUS.xxl} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🌐</Text>
        <Text style={{ fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl }}>{error}</Text>
        <PrimaryButton title="Retry" onPress={() => fetchBooking(true)} style={{ minWidth: 150 }} />
      </View>
    );
  }

  if (!booking) return null;

  const customerName = booking.customerId?.name || 'Customer';
  const cPhone = booking.customerId?.phone || '';
  const serviceName = booking.serviceId?.name || 'Service';
  
  let displayDistance = null;
  if (location && booking.address?.location?.coordinates && booking.address.location.coordinates.length === 2) {
    const [lng, lat] = booking.address.location.coordinates;
    const dist = calculateDistance(location.latitude, location.longitude, lat, lng);
    displayDistance = formatDistance(dist);
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bookingId}>ID: #{booking._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.serviceName}>{serviceName}</Text>
          </View>
          <StatusBadge status={booking.status} />
        </View>

        {/* Customer Details */}
        <Reanimated.View entering={FadeInUp.delay(100).springify()}>
          <SectionHeader title="Customer Details" />
          <Card>
            <View style={styles.customerRow}>
              <View style={styles.avatarContainer}>
                <Avatar name={customerName} size={56} />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerName}</Text>
                {cPhone ? <Text style={styles.customerPhone}>{cPhone}</Text> : null}
              </View>
            </View>
            
            <View style={styles.circularActionRow}>
              <TouchableOpacity style={styles.circleBtn} onPress={handleCall}>
                <Phone size={24} color={COLORS.primary} />
                <Text style={styles.circleBtnTxt}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.circleBtn} onPress={handleChat}>
                <View>
                  <MessageCircle size={24} color={COLORS.primary} />
                  {hasNewMessage && <View style={styles.notificationDot} />}
                </View>
                <Text style={styles.circleBtnTxt}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.circleBtn} onPress={handleNavigate}>
                <Navigation2 size={24} color={COLORS.primary} />
                <Text style={styles.circleBtnTxt}>Nav</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Reanimated.View>

        {/* Service Location */}
        <Reanimated.View entering={FadeInUp.delay(200).springify()}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Service Location" />
            {displayDistance && (
              <Text style={styles.distanceTxt}>📍 {displayDistance}</Text>
            )}
          </View>
          <Card>
            <View style={styles.locationRow}>
              <View style={styles.mapPinContainer}>
                <MapPin size={24} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTxt}>{booking.address?.addressLine || 'Address not provided'}</Text>
                {booking.address?.landmark && <Text style={styles.landmark}>Landmark: {booking.address.landmark}</Text>}
              </View>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.openMapBtn} onPress={handleNavigate}>
              <Navigation size={18} color={COLORS.primary} />
              <Text style={styles.openMapTxt}>Open in Maps</Text>
            </TouchableOpacity>
          </Card>
        </Reanimated.View>

        {/* Payment Summary */}
        <Reanimated.View entering={FadeInUp.delay(300).springify()}>
          <SectionHeader title="Payment Details" />
          <Card>
            <View style={styles.payRow}>
              <View style={styles.payLabelRow}>
                <Receipt size={20} color={COLORS.textSecondary} />
                <Text style={styles.payLabel}>Total Amount</Text>
              </View>
              <Text style={styles.payValBig}>₹ {booking.pricing?.totalAmount || booking.totalAmount || 0}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Method</Text>
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeTxt}>{booking.paymentMethod?.toUpperCase() || 'COD'}</Text>
              </View>
            </View>
            <View style={[styles.payRow, { marginBottom: 0 }]}>
              <Text style={styles.payLabel}>Status</Text>
              <StatusBadge status={booking.status === 'completed' ? 'completed' : (booking.paymentStatus || 'pending')} />
            </View>
          </Card>
        </Reanimated.View>

        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <Reanimated.View entering={FadeInUp.delay(400).springify()}>
            <TouchableOpacity 
              style={[styles.cancelBtn, actionLoading && { opacity: 0.5 }]}
              onPress={handleCancelBooking}
              disabled={actionLoading}
            >
              {actionLoading ? (
                 <ActivityIndicator color={COLORS.danger} size="small" />
              ) : (
                 <Text style={styles.cancelBtnTxt}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          </Reanimated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {getActionText() && (
        <View style={styles.bottomBar}>
          <PrimaryButton 
            title={getActionText()} 
            onPress={handleAction} 
            loading={actionLoading} 
          />
        </View>
      )}

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <CheckCircle2 size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSub}>Ask the customer for the 4-digit OTP to start the service securely.</Text>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={otpInput}
              onChangeText={setOtpInput}
              placeholder="0000"
              placeholderTextColor={COLORS.textDisabled}
            />
            <View style={styles.modalActions}>
              <PrimaryButton title="Cancel" variant="outline" onPress={() => setOtpModalVisible(false)} style={{ flex: 1, marginRight: SPACING.md }} />
              <PrimaryButton title="Verify" onPress={submitOtp} loading={actionLoading} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xl },
  bookingId: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 0.5 },
  serviceName: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4, letterSpacing: -0.5 },
  
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  avatarContainer: { ...SHADOWS.sm, borderRadius: 28 },
  customerInfo: { marginLeft: SPACING.md, flex: 1 },
  customerName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  customerPhone: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  
  circularActionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.sm, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.divider },
  circleBtn: { alignItems: 'center', justifyContent: 'center' },
  circleBtnTxt: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600', marginTop: SPACING.xs },
  notificationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger, position: 'absolute', top: -2, right: -2, borderWidth: 2, borderColor: COLORS.surface },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  distanceTxt: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '700', marginBottom: SPACING.md },
  
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  mapPinContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  addressTxt: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '500', lineHeight: 22 },
  landmark: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  openMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm },
  openMapTxt: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '700', marginLeft: SPACING.xs },

  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },

  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  payLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  payLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  payValBig: { fontSize: FONT_SIZES.xxl, color: COLORS.textPrimary, fontWeight: '800' },
  methodBadge: { backgroundColor: COLORS.divider, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md },
  methodBadgeTxt: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '700' },

  cancelBtn: { backgroundColor: COLORS.errorLight, padding: 18, borderRadius: BORDER_RADIUS.xl, marginTop: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.errorLight },
  cancelBtnTxt: { color: COLORS.danger, fontWeight: '700', fontSize: FONT_SIZES.lg },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.lg,
  },
  
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.xl, width: '100%', maxWidth: 400, alignItems: 'center', ...SHADOWS.lg },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  modalSub: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl, textAlign: 'center', lineHeight: 22 },
  otpInput: { width: '100%', borderWidth: 2, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: 12, marginBottom: SPACING.xl, color: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', width: '100%' }
});

export default ProviderBookingDetailScreen;