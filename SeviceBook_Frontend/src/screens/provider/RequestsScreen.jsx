// src/screens/provider/RequestsScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const FILTER_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'New' },
  { key: 'confirmed',  label: 'Active' },
  { key: 'completed',  label: 'Done' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const RequestsScreen = ({ navigation }) => {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [activeTab,   setActiveTab]   = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // bookingId being acted on

  useEffect(() => {
    loadBookings(1, activeTab, true);
  }, [activeTab]);

  const loadBookings = async (pageNum = 1, status = 'all', reset = false) => {
    if (loading && !reset) return;
    if (!reset && !hasNextPage) return;

    try {
      setLoading(true);
      const params = { page: pageNum, limit: 10 };
      if (status !== 'all') params.status = status;

      const res = await bookingAPI.getProviderBookings(params);
      const { data, pagination } = res.data.data;

      if (reset) {
        setBookings(data || []);
      } else {
        setBookings(prev => [...prev, ...(data || [])]);
      }
      setPage(pageNum);
      setHasNextPage(pagination?.hasNextPage || false);
    } catch (e) {
      console.log('Requests error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings(1, activeTab, true);
    setRefreshing(false);
  }, [activeTab]);

  const handleAccept = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      await bookingAPI.accept(bookingId);
      Alert.alert('✅ Accepted!', 'Booking accepted. Customer has been notified.');
      loadBookings(1, activeTab, true);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(bookingId);
              await bookingAPI.reject(bookingId, 'Not available at this time');
              Alert.alert('Rejected', 'Booking rejected. Looking for another provider.');
              loadBookings(1, activeTab, true);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not reject');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (bookingId, currentStatus) => {
    const nextStatus = {
      confirmed:           'provider_on_the_way',
      provider_on_the_way: 'in_progress',
      in_progress:         'completed',
    };

    const statusLabels = {
      provider_on_the_way: 'On The Way',
      in_progress:         'Start Service',
      completed:           'Complete Service',
    };

    const next = nextStatus[currentStatus];
    if (!next) return;

    Alert.alert(
      'Update Status',
      `Mark as "${statusLabels[next]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(bookingId);
              await bookingAPI.updateStatus(bookingId, next);
              loadBookings(1, activeTab, true);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not update status');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const BookingCard = ({ item }) => {
    const isActing = actionLoading === item._id;

    return (
      <View style={styles.card}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <Text style={styles.serviceName}>{item.categoryId?.name || 'Service'}</Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Sub service */}
        {item.subService?.name && (
          <Text style={styles.subService}>→ {item.subService.name} • ₹{item.subService.price}</Text>
        )}

        {/* Customer info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoRow}>👤 {item.customerId?.name || 'Customer'}  📱 {item.customerId?.phone}</Text>
          <Text style={styles.infoRow}>📅 {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          <Text style={styles.infoRow}>⏰ {item.scheduledTime}</Text>
          <Text style={styles.infoRow}>📍 {item.address?.addressLine}, {item.address?.city} - {item.address?.pincode}</Text>
          {item.description ? <Text style={styles.infoRow}>📝 {item.description}</Text> : null}
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{item.pricing?.totalAmount || 0}</Text>
        </View>

        {/* Action buttons */}
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, isActing && styles.btnDisabled]}
              onPress={() => handleReject(item._id)}
              disabled={isActing}
            >
              <Text style={styles.rejectBtnText}>✗ Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, isActing && styles.btnDisabled]}
              onPress={() => handleAccept(item._id)}
              disabled={isActing}
            >
              {isActing
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <Text style={styles.acceptBtnText}>✓ Accept</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Status update buttons for active bookings */}
        {['confirmed', 'provider_on_the_way', 'in_progress'].includes(item.status) && (
          <TouchableOpacity
            style={[styles.updateBtn, isActing && styles.btnDisabled]}
            onPress={() => handleUpdateStatus(item._id, item.status)}
            disabled={isActing}
          >
            {isActing
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.updateBtnText}>
                  {item.status === 'confirmed'           && '🚗 I am On The Way'}
                  {item.status === 'provider_on_the_way' && '🔧 Start Service'}
                  {item.status === 'in_progress'         && '✅ Mark as Completed'}
                </Text>
            }
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Job Requests</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(item.key);
                setBookings([]);
                setPage(1);
                setHasNextPage(true);
              }}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <BookingCard item={item} />}
        onEndReached={() => !loading && hasNextPage && loadBookings(page + 1, activeTab)}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListFooterComponent={
          loading && bookings.length > 0
            ? <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.xl }} />
            : null
        }
        ListEmptyComponent={
          !loading
            ? <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No {activeTab === 'all' ? '' : activeTab} bookings</Text>
                <Text style={styles.emptySub}>Go online from Dashboard to receive requests</Text>
              </View>
            : <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxxl }} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header:    { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl + SPACING.lg, paddingBottom: SPACING.md, backgroundColor: COLORS.white, ...SHADOWS.sm },
  title:     { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },

  tabsWrapper: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabs:        { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  tab:         { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  tabActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText:     { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },

  list: { padding: SPACING.xl, paddingBottom: SPACING.xxxl, gap: SPACING.md },

  card:        { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  serviceName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  subService:  { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600', marginBottom: SPACING.sm },

  infoSection: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, gap: 4 },
  infoRow:     { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  amountRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider, marginBottom: SPACING.md },
  amountLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  amount:      { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  actionRow:   { flexDirection: 'row', gap: SPACING.md },
  acceptBtn:   { flex: 1, backgroundColor: COLORS.success, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  acceptBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  rejectBtn:   { flex: 1, backgroundColor: COLORS.errorLight, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  rejectBtnText: { color: COLORS.error, fontWeight: '700', fontSize: FONT_SIZES.md },

  updateBtn:     { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  updateBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },

  btnDisabled: { opacity: 0.6 },

  empty:    { alignItems: 'center', paddingTop: SPACING.huge },
  emptyIcon:{ fontSize: 64, marginBottom: SPACING.lg },
  emptyText:{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});

export default RequestsScreen;