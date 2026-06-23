import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  Linking, ActivityIndicator, Modal, TextInput
} from 'react-native';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../../api/booking.api';
import { socketService } from '../../services/socket.service';

import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';
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

  const fetchBooking = useCallback(async (showLoad = true) => {
    if (showLoad) setLoading(true);
    try {
      const res = await bookingAPI.getById(bookingId);
      setBooking(res.data.data);
    } catch (error) {
      console.log('Error fetching booking detail:', error);
    } finally {
      if (showLoad) setLoading(false);
    }
  }, [bookingId]);

  const handleSocketUpdate = useCallback(() => fetchBooking(false), [fetchBooking]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        fetchBooking(false);
      }, 5000); // 5s polling for MVP fallback

      return () => clearInterval(interval);
    }, [fetchBooking])
  );

  useEffect(() => {
    fetchBooking();

    socketService.joinBookingRoom(bookingId);
    socketService.on('booking:status_update', handleSocketUpdate);

    return () => {
      socketService.leaveBookingRoom(bookingId);
      socketService.off('booking:status_update', handleSocketUpdate);
    };
  }, [bookingId, fetchBooking, handleSocketUpdate]);

  const updateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
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

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: FONT_SIZES.lg, color: COLORS.textSecondary }}>Booking not found</Text>
      </View>
    );
  }

  const customerName = booking.customerId?.name || 'Customer';
  const cPhone = booking.customerId?.phone || '';
  const serviceName = booking.serviceId?.name || 'Service';

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bookingId}>ID: {booking._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.serviceName}>{serviceName}</Text>
          </View>
          <StatusBadge status={booking.status} />
        </View>

        {/* Action Timeline (Simplified for MVP) */}
        <Reanimated.View entering={FadeInUp.delay(100).springify()}>
          <Card style={styles.timelineCard}>
            <Text style={styles.timelineTxt}>Service Status: <Text style={{fontWeight: 'bold', color: COLORS.primary}}>{booking.status.replace(/_/g, ' ').toUpperCase()}</Text></Text>
          </Card>
        </Reanimated.View>

        {/* Customer Info */}
        <Reanimated.View entering={FadeInUp.delay(200).springify()}>
          <SectionHeader title="Customer Details" />
          <Card style={styles.premiumCard}>
            <View style={styles.customerRow}>
              <Avatar name={customerName} size={50} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerName}</Text>
                {cPhone ? <Text style={styles.customerPhone}>{cPhone}</Text> : null}
              </View>
            </View>
            <View style={styles.actionRow}>
              <PrimaryButton title="Call" variant="secondary" style={styles.actionBtn} onPress={handleCall} />
              <PrimaryButton title="Chat" variant="secondary" style={styles.actionBtn} onPress={handleChat} />
              <PrimaryButton title="Nav" variant="primary" style={styles.actionBtn} onPress={handleNavigate} />
            </View>
          </Card>
        </Reanimated.View>

        {/* Address Card */}
        <Reanimated.View entering={FadeInUp.delay(300).springify()}>
          <SectionHeader title="Service Location" />
          <Card style={styles.premiumCard}>
            <Text style={styles.addressTxt}>{booking.address?.addressLine || 'Address not provided'}</Text>
            {booking.address?.landmark && <Text style={styles.landmark}>Landmark: {booking.address.landmark}</Text>}
          </Card>
        </Reanimated.View>

        {/* Payment Summary */}
        <Reanimated.View entering={FadeInUp.delay(400).springify()}>
          <SectionHeader title="Payment Details" />
          <Card style={styles.premiumCard}>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Total Amount</Text>
              <Text style={styles.payVal}>₹ {booking.pricing?.totalAmount || booking.totalAmount || 0}</Text>
            </View>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Payment Method</Text>
              <Text style={styles.payVal}>{booking.paymentMethod?.toUpperCase() || 'COD'}</Text>
            </View>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Payment Status</Text>
              <Text style={styles.payVal}>{booking.paymentStatus?.toUpperCase() || 'PENDING'}</Text>
            </View>
          </Card>
        </Reanimated.View>

        <View style={{ height: 100 }} />
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

      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSub}>Ask the customer for the 4-digit OTP to start the service.</Text>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={otpInput}
              onChangeText={setOtpInput}
              placeholder="0000"
            />
            <View style={styles.modalActions}>
              <PrimaryButton title="Cancel" variant="outline" onPress={() => setOtpModalVisible(false)} style={{ flex: 1, marginRight: SPACING.sm }} />
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
  bookingId: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  serviceName: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4 },
  
  timelineCard: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryLight, padding: SPACING.lg, borderRadius: 16 },
  timelineTxt: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  premiumCard: { borderRadius: 16, padding: SPACING.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 0, backgroundColor: COLORS.white },
  
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  customerInfo: { marginLeft: SPACING.md, flex: 1 },
  customerName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  customerPhone: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 4 },
  
  actionRow: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { flex: 1, paddingVertical: SPACING.sm },

  addressTxt: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, lineHeight: 22 },
  landmark: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },

  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  payLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  payVal: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '700' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    elevation: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  modalSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  otpInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: SPACING.lg },
  modalActions: { flexDirection: 'row' }
});

export default ProviderBookingDetailScreen;