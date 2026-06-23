// src/screens/provider/ProviderBookingsHistoryScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Requests' },
  { key: 'confirmed', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const BookingCard = React.memo(({ item, onPressDetail }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPressDetail(item._id)}
      activeOpacity={0.9}
    >
      <View style={styles.cardTop}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.serviceId?.name || 'Service'}</Text>
          {item.subService?.name && (
            <Text style={styles.subService}>{item.subService.name}</Text>
          )}
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.infoRow}>📅 {new Date(item.scheduledDate || item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}  ⏰ {item.scheduledTime || 'N/A'}</Text>
        <Text style={styles.infoRow}>📍 {item.address?.city || 'Address info'}, {item.address?.pincode}</Text>
        {item.customerId?.name && (
          <Text style={styles.infoRow}>👤 Customer: {item.customerId.name}</Text>
        )}
      </View>

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.amountLabel}>Earnings / Total</Text>
          <Text style={styles.amount}>₹{item.pricing?.totalAmount || item.totalAmount || 0}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => onPressDetail(item._id)}
        >
          <Text style={styles.viewBtnText}>View Details →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const ProviderBookingsHistoryScreen = ({ navigation }) => {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [activeTab,   setActiveTab]   = useState('all');

  const loadBookings = useCallback(async (pageNum = 1, status = 'all', reset = false) => {
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
      console.log('Provider Bookings error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage]);

  useEffect(() => {
    loadBookings(1, activeTab, true);
  }, [activeTab, loadBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings(1, activeTab, true);
    setRefreshing(false);
  }, [activeTab, loadBookings]);

  const handleLoadMore = () => {
    if (!loading && hasNextPage) loadBookings(page + 1, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setBookings([]);
    setPage(1);
    setHasNextPage(true);
  };

  const handlePressDetail = useCallback((bookingId) => {
    navigation.navigate('BookingDetail', { bookingId });
  }, [navigation]);

  const renderBookingCard = useCallback(({ item }) => (
    <BookingCard 
      item={item} 
      onPressDetail={handlePressDetail} 
    />
  ), [handlePressDetail]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
      </View>

      {/* Filter tabs */}
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
              onPress={() => handleTabChange(item.key)}
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
        renderItem={renderBookingCard}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListFooterComponent={
          loading && bookings.length > 0
            ? <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.xl }} />
            : null
        }
        ListEmptyComponent={
          !loading
            ? <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💼</Text>
                <Text style={styles.emptyText}>No jobs found</Text>
                <Text style={styles.emptySubText}>Your booking history will appear here</Text>
              </View>
            : <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: SPACING.xl, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#111827' },
  
  tabsWrapper: { backgroundColor: COLORS.white },
  tabs: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  tab: { paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  tabText: { fontSize: FONT_SIZES.sm, color: '#4B5563', fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },

  list: { padding: SPACING.lg, paddingBottom: 100 },
  
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  serviceInfo: { flex: 1, marginRight: SPACING.md },
  serviceName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subService: { fontSize: FONT_SIZES.sm, color: '#6B7280', fontWeight: '500' },

  cardMid: { backgroundColor: '#F9FAFB', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.lg },
  infoRow: { fontSize: 13, color: '#4B5563', marginBottom: 6, fontWeight: '500' },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: SPACING.md },
  amountLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  amount: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },
  
  viewBtn: { backgroundColor: '#F3E8FD', paddingHorizontal: SPACING.lg, paddingVertical: 10, borderRadius: 20 },
  viewBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: SPACING.xl },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubText: { fontSize: FONT_SIZES.md, color: '#6B7280', textAlign: 'center', lineHeight: 22 }
});

export default ProviderBookingsHistoryScreen;
