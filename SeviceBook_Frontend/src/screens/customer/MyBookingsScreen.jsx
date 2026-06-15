// src/screens/customer/MyBookingsScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

/*
PAGINATION PATTERN:
  - Loads 10 bookings at a time
  - FlatList onEndReached loads next page
  - Pull to refresh resets to page 1
  - Filter tabs filter by status without re-loading everything
*/

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
];

const MyBookingsScreen = ({ navigation }) => {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [activeTab,   setActiveTab]   = useState('all');

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

      const res = await bookingAPI.getMyBookings(params);
      const { data, pagination } = res.data.data;

      if (reset) {
        setBookings(data || []);
      } else {
        setBookings(prev => [...prev, ...(data || [])]);
      }
      setPage(pageNum);
      setHasNextPage(pagination?.hasNextPage || false);
    } catch (e) {
      console.log('Bookings error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings(1, activeTab, true);
    setRefreshing(false);
  }, [activeTab]);

  const handleLoadMore = () => {
    if (!loading && hasNextPage) loadBookings(page + 1, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setBookings([]);
    setPage(1);
    setHasNextPage(true);
  };

  const BookingCard = ({ item }) => {
    const canTrack = ['confirmed', 'provider_on_the_way', 'in_progress'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.categoryId?.name || 'Service'}</Text>
            {item.subService?.name && (
              <Text style={styles.subService}>{item.subService.name}</Text>
            )}
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.cardMid}>
          <Text style={styles.infoRow}>📅 {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}  ⏰ {item.scheduledTime}</Text>
          <Text style={styles.infoRow}>📍 {item.address?.city}, {item.address?.pincode}</Text>
          {item.providerId?.userId?.name && (
            <Text style={styles.infoRow}>👤 {item.providerId.userId.name}</Text>
          )}
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.amount}>₹{item.pricing?.totalAmount || 0}</Text>
          {canTrack && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('BookingTrack', { bookingId: item._id })}
            >
              <Text style={styles.trackBtnText}>Track →</Text>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && !item.isRated && (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => navigation.navigate('Review', { bookingId: item._id })}
            >
              <Text style={styles.rateBtnText}>⭐ Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
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
        renderItem={({ item }) => <BookingCard item={item} />}
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
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No bookings found</Text>
                <Text style={styles.emptySubText}>Your bookings will appear here</Text>
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

  card:       { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  serviceInfo:{ flex: 1, marginRight: SPACING.md },
  serviceName:{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  subService: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },

  cardMid:   { marginBottom: SPACING.md, gap: SPACING.xs },
  infoRow:   { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.md },
  amount:     { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },

  trackBtn:     { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  trackBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm },

  rateBtn:     { backgroundColor: COLORS.warningLight, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  rateBtnText: { color: COLORS.warning, fontWeight: '700', fontSize: FONT_SIZES.sm },

  empty:        { alignItems: 'center', paddingTop: SPACING.huge },
  emptyIcon:    { fontSize: 64, marginBottom: SPACING.lg },
  emptyText:    { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptySubText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
});

export default MyBookingsScreen;
