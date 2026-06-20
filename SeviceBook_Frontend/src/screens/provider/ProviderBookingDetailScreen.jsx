import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  Modal, TextInput,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

const STATUS_FLOW = {
  confirmed:           { next: 'provider_on_the_way', label: '🚗 I am On The Way',   color: '#3B82F6' },
  provider_on_the_way: { next: 'in_progress',         label: '🔧 Start Service',      color: '#F59E0B' },
  in_progress:         { next: 'completed',           label: '✅ Mark as Completed',  color: '#22C55E' },
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const ProviderBookingDetailScreen = ({ route, navigation }) => {
  const { booking: initialBooking } = route.params || {};
  const [booking, setBooking]       = useState(initialBooking);
  const [loading, setLoading]       = useState(false);

  // Reschedule Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const CANCEL_REASONS = [
    'Personal Emergency',
    'Medical Emergency',
    'Vehicle Issue',
    'Too Busy',
    'Other',
  ];

  const handleCancelJob = () => {
    Alert.alert(
      '⚠️ Cancel Job',
      'Select a reason for cancellation:',
      [
        ...CANCEL_REASONS.map(reason => ({
          text: reason,
          onPress: async () => {
            Alert.alert(
              'Confirm Cancellation',
              `Cancel job with reason: "${reason}"?\n\nThe booking will be automatically reassigned to another provider.`,
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes, Cancel',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setLoading(true);
                      await bookingAPI.providerCancel(booking._id, reason);
                      Alert.alert('✅ Cancelled', 'Job cancelled. Finding next available provider...');
                      navigation.goBack();
                    } catch (e) {
                      Alert.alert('Error', e?.response?.data?.message || 'Could not cancel job.');
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }
        })),
        { text: 'Dismiss', style: 'cancel' },
      ]
    );
  };

  const handleRequestReschedule = () => {
    if (!proposedDate) {
      setProposedDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
    if (!proposedTime) {
      setProposedTime('12:00 PM');
    }
    setModalVisible(true);
  };

  const submitReschedule = async () => {
    if (!proposedDate.trim() || !proposedTime.trim()) {
      Alert.alert('Validation Error', 'Please enter proposed Date and Time.');
      return;
    }
    try {
      setLoading(true);
      await bookingAPI.requestReschedule(booking._id, {
        proposedDate,
        proposedTime,
        reason: rescheduleReason
      });
      Alert.alert('Success', 'Reschedule request sent to customer.');
      setModalVisible(false);
      setBooking(prev => ({
        ...prev,
        rescheduleRequest: {
          proposedDate,
          proposedTime,
          requestedBy: 'provider',
          status: 'pending',
          reason: rescheduleReason
        }
      }));
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to request reschedule.');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Booking not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const flow = STATUS_FLOW[booking.status];

  const handleAccept = async () => {
    try {
      setLoading(true);
      await bookingAPI.accept(booking._id);
      setBooking(prev => ({ ...prev, status: 'confirmed' }));
      Alert.alert('✅ Accepted', 'Booking confirmed! Customer has been notified.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not accept');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    Alert.alert('Reject Booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await bookingAPI.reject(booking._id, 'Not available');
            setBooking(prev => ({ ...prev, status: 'cancelled' }));
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not reject');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleUpdateStatus = () => {
    if (!flow) return;
    Alert.alert('Update Status', `Move to "${flow.label.replace(/^[^\w]+/, '')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setLoading(true);
            await bookingAPI.updateStatus(booking._id, flow.next);
            setBooking(prev => ({ ...prev, status: flow.next }));
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not update');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <StatusBadge status={booking.status} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Service & Amount */}
        <View style={styles.heroCard}>
          <Text style={styles.heroService}>{booking.categoryId?.name || 'Service'}</Text>
          {booking.subService?.name && (
            <Text style={styles.heroSub}>→ {booking.subService.name}</Text>
          )}
          <Text style={styles.heroAmount}>₹{booking.pricing?.totalAmount || 0}</Text>
        </View>

        {booking.rescheduleRequest && booking.rescheduleRequest.status === 'pending' && (
          <View style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B' }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#B7770D' }}>
              ⏳ Reschedule Request Pending
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: '#D97706', marginTop: 4 }}>
              Proposed: {new Date(booking.rescheduleRequest.proposedDate).toLocaleDateString('en-IN')} at {booking.rescheduleRequest.proposedTime}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: '#D97706', marginTop: 2, fontStyle: 'italic' }}>
              Reason: {booking.rescheduleRequest.reason || '—'}
            </Text>
          </View>
        )}

        <Section title="📅 Schedule">
          <Row icon="📅" label="Date"
            value={new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
          <View style={styles.rowDivider} />
          <Row icon="⏰" label="Time" value={booking.scheduledTime} />
        </Section>

        <Section title="👤 Customer">
          <Row icon="👤" label="Name"  value={booking.customerId?.name  || '—'} />
          <View style={styles.rowDivider} />
          <Row icon="📱" label="Phone" value={booking.customerId?.phone || '—'} />
        </Section>

        <Section title="📍 Location">
          <Row icon="🏠" label="Address" value={booking.address?.addressLine || '—'} />
          <View style={styles.rowDivider} />
          <Row icon="🏙️" label="City"    value={`${booking.address?.city || '—'} - ${booking.address?.pincode || ''}`} />
        </Section>

        {booking.description ? (
          <Section title="📝 Notes">
            <Text style={styles.notesText}>{booking.description}</Text>
          </Section>
        ) : null}

        <Section title="💰 Payment">
          <Row icon="💵" label="Base Price"    value={`₹${booking.pricing?.basePrice || 0}`} />
          <View style={styles.rowDivider} />
          <Row icon="🏷️" label="Platform Fee"  value={`₹${booking.pricing?.platformFee || 0}`} />
          <View style={styles.rowDivider} />
          <Row icon="💳" label="Total Amount"  value={`₹${booking.pricing?.totalAmount || 0}`} />
        </Section>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        {booking.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, loading && { opacity: 0.6 }]}
              onPress={handleReject}
              disabled={loading}
            >
              <Text style={styles.rejectText}>✗  Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, loading && { opacity: 0.6 }]}
              onPress={handleAccept}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.acceptText}>✓  Accept</Text>}
            </TouchableOpacity>
          </View>
        )}

        {flow && (
          <View>
            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: flow.color, marginBottom: 12 }, loading && { opacity: 0.6 }]}
              onPress={handleUpdateStatus}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.updateText}>{flow.label}</Text>}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.cancelJobBtn, loading && { opacity: 0.6 }]}
                onPress={handleCancelJob}
                disabled={loading}
              >
                <Text style={styles.cancelJobText}>⚠️ Cancel Job</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rescheduleBtn, loading && { opacity: 0.6 }]}
                onPress={handleRequestReschedule}
                disabled={loading}
              >
                <Text style={styles.rescheduleText}>📅 Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(booking.status === 'completed' || booking.status === 'cancelled') && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>← Back to Requests</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reschedule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Reschedule</Text>
            
            <Text style={styles.modalLabel}>Proposed Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={proposedDate}
              onChangeText={setProposedDate}
              placeholder="e.g. 2026-06-20"
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={styles.modalLabel}>Proposed Time</Text>
            <TextInput
              style={styles.modalInput}
              value={proposedTime}
              onChangeText={setProposedTime}
              placeholder="e.g. 12:00 PM"
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={styles.modalLabel}>Reason for Rescheduling</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="e.g. Traffic delays, emergency work..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={submitReschedule}
                disabled={loading}
              >
                {loading 
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.modalSubmitText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  headerTitle: { flex: 1, fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },

  heroCard: {
    backgroundColor:  COLORS.primary,
    margin:           SPACING.xl,
    borderRadius:     18,
    padding:          SPACING.xl,
    alignItems:       'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  heroService: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#FFFFFF' },
  heroSub:     { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  heroAmount:  { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },

  section:      { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  sectionCard:  { backgroundColor: '#FFFFFF', borderRadius: 14, padding: SPACING.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },

  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  rowIcon:    { fontSize: 18, marginTop: 2 },
  rowLabel:   { fontSize: FONT_SIZES.xs, color: '#9CA3AF', fontWeight: '500' },
  rowValue:   { fontSize: FONT_SIZES.md, color: '#111827', fontWeight: '600', marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: '#F9FAFB', marginVertical: SPACING.sm },
  notesText:  { fontSize: FONT_SIZES.md, color: '#374151' },

  bottomBar: {
    position:          'absolute',
    bottom:            0, left: 0, right: 0,
    backgroundColor:   '#FFFFFF',
    padding:           SPACING.xl,
    paddingBottom:     SPACING.xl + 4,
    borderTopWidth:    1,
    borderTopColor:    '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  actionRow:  { flexDirection: 'row', gap: SPACING.md },
  acceptBtn:  { flex: 1, backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  acceptText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.md },
  rejectBtn:  { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  rejectText: { color: '#EF4444', fontWeight: '700', fontSize: FONT_SIZES.md },
  updateBtn:  { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  updateText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.md },
  doneBtn:    { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  doneBtnText:{ color: '#6B7280', fontWeight: '600', fontSize: FONT_SIZES.md },

  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: '#111827' },
  backBtn:   { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#FFFFFF', fontWeight: '700' },

  cancelJobBtn: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderColor: '#FCA5A5', borderWidth: 1 },
  cancelJobText: { color: '#EF4444', fontWeight: '700', fontSize: FONT_SIZES.sm },
  rescheduleBtn: { flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderColor: '#BFDBFE', borderWidth: 1 },
  rescheduleText: { color: '#3B82F6', fontWeight: '700', fontSize: FONT_SIZES.sm },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111827', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#F9FAFB', borderHorizontalWidth: 0, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: FONT_SIZES.md, color: '#111827', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: '#4B5563', fontWeight: '600' },
  modalSubmitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontWeight: '700' },
});

export default ProviderBookingDetailScreen;