import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
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
          <TouchableOpacity
            style={[styles.updateBtn, { backgroundColor: flow.color }, loading && { opacity: 0.6 }]}
            onPress={handleUpdateStatus}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.updateText}>{flow.label}</Text>}
          </TouchableOpacity>
        )}

        {(booking.status === 'completed' || booking.status === 'cancelled') && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>← Back to Requests</Text>
          </TouchableOpacity>
        )}
      </View>
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
});

export default ProviderBookingDetailScreen;