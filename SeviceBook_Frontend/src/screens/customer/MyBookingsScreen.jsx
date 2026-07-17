import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform, Image
} from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { bookingAPI } from '../../api/booking.api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Calendar, MapPin, User, ChevronRight, Star, Receipt, SearchX } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
];

const CATEGORY_IMAGES = {
  'Electrician': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop',
  'Plumber': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=200&auto=format&fit=crop',
  'AC Repair': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop',
  'Home Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop',
};

const BookingCard = React.memo(({ item, index, onPressDetail, onPressTrack, onPressReview }) => {
  const canTrack = ['confirmed', 'provider_on_the_way', 'in_progress', 'arrived', 'otp_verification'].includes(item.status);
  const catName = item.categoryId?.name || 'Service';
  const imgUrl = CATEGORY_IMAGES[catName] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop';
  
  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()} layout={Layout.springify()}>
      <Card style={styles.card} onPress={() => onPressDetail(item._id)}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: imgUrl }} style={styles.serviceImage} />
          <View style={styles.headerInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>{catName}</Text>
            {item.subService?.name && <Text style={styles.subService} numberOfLines={1}>{item.subService.name}</Text>}
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address?.city}, {item.address?.pincode}
            </Text>
          </View>
          {item.providerId?.userId?.name && (
            <View style={styles.detailItem}>
              <User size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>{item.providerId.userId.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.amount}>₹{item.pricing?.totalAmount || 0}</Text>
          </View>
          <View style={styles.footerActions}>
            {canTrack && (
              <TouchableOpacity style={styles.trackBtn} onPress={() => onPressTrack(item._id)}>
                <Text style={styles.trackBtnText}>Track</Text>
                <ChevronRight size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            {item.status === 'completed' && !item.isRated && (
              <TouchableOpacity style={styles.rateBtn} onPress={() => onPressReview(item._id)}>
                <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
                <Text style={styles.rateBtnText}>Rate Provider</Text>
              </TouchableOpacity>
            )}
            {(!canTrack && item.status !== 'completed') && (
              <TouchableOpacity style={styles.detailsBtn} onPress={() => onPressDetail(item._id)}>
                <Text style={styles.detailsBtnText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
});

const MyBookingsScreen = ({ navigation }) => {
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

      const res = await bookingAPI.getMyBookings(params);
      const { data, pagination } = res.data.data;

      if (reset) setBookings(data || []);
      else setBookings(prev => [...prev, ...(data || [])]);
      
      setPage(pageNum);
      setHasNextPage(pagination?.hasNextPage || false);
    } catch (e) {
      console.log('Bookings error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage]);

  useEffect(() => { loadBookings(1, activeTab, true); }, [activeTab, loadBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings(1, activeTab, true);
    setRefreshing(false);
  }, [activeTab, loadBookings]);

  const handleLoadMore = () => { if (!loading && hasNextPage) loadBookings(page + 1, activeTab); };

  const handleTabChange = (tab) => {
    setActiveTab(tab); setBookings([]); setPage(1); setHasNextPage(true);
  };

  const handlePressDetail = useCallback((bookingId) => navigation.navigate('BookingDetail', { bookingId }), [navigation]);
  const handlePressTrack = useCallback((bookingId) => navigation.navigate('BookingTrack', { bookingId }), [navigation]);
  const handlePressReview = useCallback((bookingId) => navigation.navigate('Review', { bookingId }), [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(item.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <BookingCard item={item} index={index} onPressDetail={handlePressDetail} onPressTrack={handlePressTrack} onPressReview={handlePressReview} />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListFooterComponent={loading && bookings.length > 0 ? <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.xl }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInUp.springify()} style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Receipt size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubText}>Looks like you haven't booked anything in this category yet.</Text>
            </Animated.View>
          ) : <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxxl }} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, 
    paddingBottom: SPACING.lg, backgroundColor: COLORS.background 
  },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },

  tabsWrapper: { marginBottom: SPACING.md },
  tabs: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  tab: { 
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.round, 
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm 
  },
  tabActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  tabText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: { padding: SPACING.lg, marginBottom: SPACING.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  serviceImage: { width: 56, height: 56, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.border },
  headerInfo: { flex: 1, marginLeft: SPACING.md, marginRight: SPACING.sm },
  serviceName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subService: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },

  detailsGrid: { gap: SPACING.xs, marginBottom: SPACING.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.md },
  totalLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  amount: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: COLORS.textPrimary },
  
  footerActions: { flexDirection: 'row', gap: SPACING.sm },
  trackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.round, gap: 4 },
  trackBtnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT_SIZES.sm },
  
  rateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.round, gap: 6 },
  rateBtnText: { color: COLORS.warning, fontWeight: '700', fontSize: FONT_SIZES.sm },

  detailsBtn: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.border },
  detailsBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: FONT_SIZES.sm },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptySubText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});

export default MyBookingsScreen;
