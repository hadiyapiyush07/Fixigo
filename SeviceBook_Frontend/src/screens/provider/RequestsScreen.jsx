import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { providerAPI } from '../../api/provider.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const FILTER_TABS = [
  { key: 'all',       label: 'All',       emoji: '📋' },
  { key: 'pending',   label: 'New',       emoji: '🔔' },
  { key: 'confirmed', label: 'Active',    emoji: '⚡' },
  { key: 'completed', label: 'Done',      emoji: '✅' },
  { key: 'cancelled', label: 'Cancelled', emoji: '❌' },
];

const STATUS_FLOW = {
  confirmed:           { next: 'provider_on_the_way', label: '🚗 I am On The Way',     color: '#3B82F6' },
  provider_on_the_way: { next: 'in_progress',         label: '🔧 Start Service',        color: '#F59E0B' },
  in_progress:         { next: 'completed',           label: '✅ Mark as Completed',    color: '#22C55E' },
};

const RequestsScreen = ({ navigation }) => {
  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [page,          setPage]          = useState(1);
  const [hasNextPage,   setHasNextPage]   = useState(true);
  const [activeTab,     setActiveTab]     = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  
  const [isVerified, setIsVerified] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    checkVerification();
  }, []);

  useEffect(() => {
    if (isVerified) {
      loadBookings(1, activeTab, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isVerified]);

  const checkVerification = async () => {
    try {
      const res = await providerAPI.getMyProfile();
      const verified = res.data.data?.isVerified || false;
      setIsVerified(verified);
      setVerificationStatus(res.data.data?.verificationStatus || 'pending');
    } catch (e) {
      console.log('Error checking verification:', e.message);
    }
  };

  const loadBookings = async (pageNum = 1, status = 'all', reset = false) => {
    if (!isVerified) return;
    if (loading && !reset) return;
    if (!reset && !hasNextPage) return;

    try {
      setLoading(true);
      const params = { page: pageNum, limit: 10 };
      if (status !== 'all') params.status = status;

      const res = await bookingAPI.getProviderBookings(params);
      const { data, pagination } = res.data.data;

      setBookings(prev => reset ? (data || []) : [...prev, ...(data || [])]);
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
    await checkVerification();
    if (isVerified) {
      await loadBookings(1, activeTab, true);
    }
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isVerified]);

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

  const handleReject = (bookingId) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(bookingId);
            await bookingAPI.reject(bookingId, 'Not available at this time');
            Alert.alert('Rejected', 'Booking rejected.');
            loadBookings(1, activeTab, true);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not reject');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleUpdateStatus = (bookingId, currentStatus) => {
    const flow = STATUS_FLOW[currentStatus];
    if (!flow) return;

    Alert.alert('Update Status', `Mark as "${flow.label.replace(/^[^\w]+/, '')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setActionLoading(bookingId);
            await bookingAPI.updateStatus(bookingId, flow.next);
            loadBookings(1, activeTab, true);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not update status');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const BookingCard = ({ item }) => {
    const isActing = actionLoading === item._id;
    const flow     = STATUS_FLOW[item.status];

    return (
      <View style={styles.card}>
        {/* Top */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {item.categoryId?.name || 'Service'}
            </Text>
            {item.subService?.name && (
              <Text style={styles.subService}>→ {item.subService.name}  •  ₹{item.subService.price}</Text>
            )}
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Info block */}
        <View style={styles.infoBlock}>
          <InfoRow emoji="👤" text={`${item.customerId?.name || 'Customer'}   📱 ${item.customerId?.phone || ''}`} />
          <InfoRow emoji="📅" text={new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <InfoRow emoji="⏰" text={item.scheduledTime} />
          <InfoRow emoji="📍" text={`${item.address?.addressLine}, ${item.address?.city} - ${item.address?.pincode}`} />
          {item.description ? <InfoRow emoji="📝" text={item.description} /> : null}
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{item.pricing?.totalAmount || 0}</Text>
        </View>

        {/* Pending actions */}
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, isActing && styles.btnDisabled]}
              onPress={() => handleReject(item._id)}
              disabled={isActing}
            >
              <Text style={styles.rejectBtnText}>✗  Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, isActing && styles.btnDisabled]}
              onPress={() => handleAccept(item._id)}
              disabled={isActing}
            >
              {isActing
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.acceptBtnText}>✓  Accept</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Status progression */}
        {flow && (
          <TouchableOpacity
            style={[styles.updateBtn, { backgroundColor: flow.color }, isActing && styles.btnDisabled]}
            onPress={() => handleUpdateStatus(item._id, item.status)}
            disabled={isActing}
          >
            {isActing
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.updateBtnText}>{flow.label}</Text>}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const InfoRow = ({ emoji, text }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={styles.infoText} numberOfLines={2}>{text}</Text>
    </View>
  );

  if (!isVerified) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Job Requests</Text>
        </View>
        <View style={[styles.empty, { justifyContent: 'center', flex: 1, paddingBottom: 100 }]}>
          <Text style={styles.emptyIcon}>{verificationStatus === 'rejected' ? '❌' : '⏳'}</Text>
          <Text style={[styles.emptyText, { textAlign: 'center' }]}>
            {verificationStatus === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
          </Text>
          <Text style={styles.emptySub}>
            {verificationStatus === 'rejected'
              ? 'Your profile verification was rejected. Please update your profile or contact support.'
              : 'Your profile is under verification. Please wait until the admin approves your account.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Job Requests</Text>
        {loading && bookings.length === 0 && (
          <ActivityIndicator color={COLORS.primary} size="small" />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(item.key);
                setBookings([]);
                setPage(1);
                setHasNextPage(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.tabEmoji}>{item.emoji}</Text>
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      <FlatList
        data={bookings}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <BookingCard item={item} />}
        onEndReached={() => !loading && hasNextPage && loadBookings(page + 1, activeTab)}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
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
            : <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xl + SPACING.lg,
    paddingBottom:     SPACING.md,
    backgroundColor:   '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#111827' },

  tabsWrapper:    { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabsContainer:  { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  tab: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    paddingHorizontal: SPACING.md,
    paddingVertical:   8,
    borderRadius:      20,
    backgroundColor:   '#F3F4F6',
    borderWidth:       1,
    borderColor:       '#E5E7EB',
  },
  tabActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabEmoji:       { fontSize: 13 },
  tabText:        { fontSize: FONT_SIZES.sm, fontWeight: '500', color: '#6B7280' },
  tabTextActive:  { color: '#FFFFFF', fontWeight: '700' },

  listContent: { padding: SPACING.xl, paddingBottom: 60, gap: SPACING.md },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    padding:         SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  serviceName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#111827' },
  subService:  { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600', marginTop: 2 },

  infoBlock: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md, gap: 6 },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoEmoji: { fontSize: 13, marginTop: 1 },
  infoText:  { fontSize: FONT_SIZES.sm, color: '#4B5563', flex: 1 },

  amountRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingVertical:  SPACING.sm,
    borderTopWidth:   1,
    borderTopColor:   '#F3F4F6',
    marginBottom:     SPACING.md,
  },
  amountLabel: { fontSize: FONT_SIZES.sm, color: '#6B7280' },
  amount:      { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },

  actionRow:     { flexDirection: 'row', gap: SPACING.md },
  acceptBtn:     { flex: 1, backgroundColor: '#22C55E', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.md },
  rejectBtn:     { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: FONT_SIZES.md },

  updateBtn:     { paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: SPACING.sm },
  updateBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.md },

  btnDisabled: { opacity: 0.55 },

  empty:    { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
  emptyIcon:{ fontSize: 64, marginBottom: SPACING.lg },
  emptyText:{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: FONT_SIZES.sm, color: '#6B7280', marginTop: SPACING.sm, textAlign: 'center' },
});

export default RequestsScreen;