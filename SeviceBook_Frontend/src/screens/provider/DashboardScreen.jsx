import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated,
  PermissionsAndroid, Platform, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { bookingAPI } from '../../api/booking.api';
import { providerAPI } from '../../api/provider.api';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { StatusBadge } from '../../components/common/StatusBadge';
import Geolocation from '@react-native-community/geolocation';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [isOnline, setIsOnline]         = useState(false);
  const [bookings, setBookings]         = useState([]);
  const [stats, setStats]               = useState({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Animated values for the toggle
  const toggleAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const glowAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDashboard();
  }, []);

  // Sync animation when isOnline changes
  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isOnline ? 1 : 0,
      useNativeDriver: false,
      friction: 6,
      tension: 80,
    }).start();

    if (isOnline) {
      // Pulse glow when online
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  }, [isOnline]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res   = await bookingAPI.getProviderBookings({ page: 1, limit: 5 });
      const data  = res.data.data?.data || [];
      setBookings(data);

      const total     = res.data.data?.pagination?.total || 0;
      const completed = data.filter(b => b.status === 'completed').length;
      const pending   = data.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      setStats({ total, completed, pending });

      const profRes = await providerAPI.getMyProfile();
      setIsOnline(profRes.data.data?.isOnline || false);
    } catch (e) {
      console.log('Dashboard error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleToggleOnline = async (newValue) => {
    if (togglingOnline) return;
    setTogglingOnline(true);

    try {
      // Android location permission
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need your location to show you to nearby customers.',
            buttonPositive: 'Allow',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location access is required to go online.');
          setTogglingOnline(false);
          return;
        }
      }

      // Optimistically update UI for instant feel
      setIsOnline(newValue);

      Geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            await providerAPI.toggleOnline({ isOnline: newValue, latitude, longitude });
          } catch (apiError) {
            // Revert on failure
            setIsOnline(!newValue);
            Alert.alert('Update Failed', 'Could not update your status. Please try again.');
          } finally {
            setTogglingOnline(false);
          }
        },
        (err) => {
          console.log('GPS Error:', err);
          // Still allow toggle if GPS fails (fallback)
          providerAPI
            .toggleOnline({ isOnline: newValue })
            .catch(() => {
              setIsOnline(!newValue);
              Alert.alert('Error', 'Could not update status.');
            })
            .finally(() => setTogglingOnline(false));
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      setIsOnline(!newValue);
      setTogglingOnline(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutUser());
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  // Interpolations
  const thumbTranslate = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 26] });
  const trackColor     = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: ['#D1D5DB', '#22C55E'] });
  const glowOpacity    = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] });

  const CustomToggle = () => (
    <TouchableOpacity
      onPress={() => handleToggleOnline(!isOnline)}
      disabled={togglingOnline}
      activeOpacity={0.85}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        {/* Glow ring */}
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: thumbTranslate }] },
            togglingOnline && styles.thumbLoading,
          ]}
        >
          {togglingOnline && (
            <View style={styles.loadingDots}>
              <View style={styles.dot} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Service Provider Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Online Toggle Card ── */}
      <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
        <View style={styles.onlineLeft}>
          <Animated.View
            style={[
              styles.statusDotWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#22C55E' : '#9CA3AF' }]} />
            {isOnline && <View style={styles.onlineDotRing} />}
          </Animated.View>

          <View style={{ flex: 1 }}>
            <Text style={styles.onlineTitle}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
            <Text style={styles.onlineSubtitle}>
              {togglingOnline
                ? 'Updating status…'
                : isOnline
                ? 'Receiving new job requests'
                : 'Toggle ON to receive requests'}
            </Text>
          </View>
        </View>

        <CustomToggle />
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsRow}>
        <StatCard icon="📋" label="Total Jobs"  value={stats.total}     color={COLORS.primary} />
        <StatCard icon="✅" label="Completed"   value={stats.completed} color="#22C55E" />
        <StatCard icon="⏳" label="Active"      value={stats.pending}   color="#F59E0B" />
      </View>

      {/* Recent Bookings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {bookings.length === 0 && !loading ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySub}>Go online to start receiving job requests</Text>
        </View>
      ) : (
        bookings.map(item => (
          <TouchableOpacity
            key={item._id}
            style={styles.bookingCard}
            onPress={() => navigation.navigate('Requests')}
            activeOpacity={0.92}
          >
            <View style={styles.bookingTop}>
              <Text style={styles.bookingService}>{item.categoryId?.name || 'Service'}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.bookingInfo}>👤 {item.customerId?.name || 'Customer'}</Text>
            <Text style={styles.bookingInfo}>
              📅 {new Date(item.scheduledDate).toLocaleDateString('en-IN')}  ⏰ {item.scheduledTime}
            </Text>
            <Text style={styles.bookingInfo}>📍 {item.address?.city}, {item.address?.pincode}</Text>

            <View style={styles.bookingBottom}>
              <Text style={styles.bookingAmount}>₹{item.pricing?.totalAmount || 0}</Text>
              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={async () => {
                      try {
                        await bookingAPI.reject(item._id, 'Not available');
                        loadDashboard();
                      } catch (e) {
                        Alert.alert('Error', e.response?.data?.message || 'Failed');
                      }
                    }}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={async () => {
                      try {
                        await bookingAPI.accept(item._id);
                        Alert.alert('✅ Accepted', 'Booking accepted successfully!');
                        loadDashboard();
                      } catch (e) {
                        Alert.alert('Error', e.response?.data?.message || 'Failed');
                      }
                    }}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  /* Header */
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xl + SPACING.lg,
    paddingBottom:     SPACING.lg,
    backgroundColor:   '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  greeting:    { fontSize: FONT_SIZES.xl, fontWeight: '700', color: '#111827' },
  subGreeting: { fontSize: FONT_SIZES.sm, color: '#6B7280', marginTop: 2 },
  logoutBtn:   { backgroundColor: '#FEE2E2', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  logoutText:  { color: '#EF4444', fontSize: FONT_SIZES.sm, fontWeight: '600' },

  /* Online Card */
  onlineCard: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    backgroundColor:  '#FFFFFF',
    marginHorizontal: SPACING.xl,
    marginTop:        SPACING.xl,
    padding:          SPACING.lg,
    borderRadius:     16,
    borderWidth:      1.5,
    borderColor:      '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  onlineCardActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

  statusDotWrapper: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  onlineDot:        { width: 12, height: 12, borderRadius: 6, position: 'absolute' },
  onlineDotRing:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#22C55E', opacity: 0.4, position: 'absolute' },

  onlineTitle:    { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827' },
  onlineSubtitle: { fontSize: FONT_SIZES.xs, color: '#6B7280', marginTop: 2 },

  /* Custom Toggle */
  track: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    padding: 2,
    overflow: 'visible',
  },
  glowRing: {
    position:      'absolute',
    top:           -6,
    left:          -6,
    right:         -6,
    bottom:        -6,
    borderRadius:  21,
    backgroundColor: '#22C55E',
  },
  thumb: {
    width:        26,
    height:       26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius:  4,
    elevation:     4,
    alignItems:    'center',
    justifyContent:'center',
  },
  thumbLoading: { opacity: 0.7 },
  loadingDots:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' },

  /* Stats */
  sectionTitle:  { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#111827', paddingHorizontal: SPACING.xl, marginTop: SPACING.xl, marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.xl },
  seeAll:        { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.md, marginBottom: SPACING.sm },
  statCard:  {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: SPACING.md, alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZES.xs, color: '#6B7280', marginTop: 2 },

  /* Booking Cards */
  bookingCard: {
    backgroundColor:  '#FFFFFF',
    marginHorizontal: SPACING.xl,
    marginBottom:     SPACING.md,
    borderRadius:     14,
    padding:          SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  bookingTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  bookingService: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#111827' },
  bookingInfo:    { fontSize: FONT_SIZES.sm, color: '#6B7280', marginBottom: 3 },
  bookingBottom:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: SPACING.sm,
  },
  bookingAmount: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111827' },

  actionRow:  { flexDirection: 'row', gap: SPACING.sm },
  acceptBtn:  { backgroundColor: '#22C55E', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 20 },
  acceptText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.sm },
  rejectBtn:  { backgroundColor: '#FEE2E2', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 20 },
  rejectText: { color: '#EF4444', fontWeight: '700', fontSize: FONT_SIZES.sm },

  emptyBox:  { alignItems: 'center', padding: SPACING.xxxl },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: '#111827' },
  emptySub:  { fontSize: FONT_SIZES.sm, color: '#6B7280', marginTop: SPACING.sm, textAlign: 'center' },
});

export default DashboardScreen;