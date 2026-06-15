import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { bookingAPI } from '../../api/booking.api';
import { providerAPI } from '../../api/provider.api';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [isOnline, setIsOnline]       = useState(false);
  const [bookings, setBookings]       = useState([]);
  const [stats, setStats]             = useState({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // Load recent bookings
      const res = await bookingAPI.getProviderBookings({ page: 1, limit: 5 });
      const data = res.data.data?.data || [];
      setBookings(data);

      // Calculate stats
      const total     = res.data.data?.pagination?.total || 0;
      const completed = data.filter(b => b.status === 'completed').length;
      const pending   = data.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      setStats({ total, completed, pending });

      // Load provider profile to get online status
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

  // const handleToggleOnline = async (value) => {
  //   try {
  //     setTogglingOnline(true);
  //     await providerAPI.toggleOnline(value);
  //     setIsOnline(value);
  //   } catch (e) {
  //     Alert.alert('Error', 'Could not update status. Try again.');
  //   } finally {
  //     setTogglingOnline(false);
  //   }
  // };

const handleToggleOnline = async (newValue) => {
    setTogglingOnline(true);
    
    try {
      // 1. Android Permission
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Error", "App ko location chahiye online aane ke liye.");
          setTogglingOnline(false);
          return;
        }
      }

      // 2. Fetch Location and API Call
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const payload = {
              isOnline: newValue,
              latitude: latitude,
              longitude: longitude
            };
            
            await providerAPI.toggleOnline(payload);
            setIsOnline(newValue);
            setTogglingOnline(false);
            
          } catch (apiError) {
            console.error("API Error:", apiError);
            Alert.alert("Error", "Server par status update nahi hua.");
            setTogglingOnline(false);
          }
        },
        (error) => {
          console.log("Geolocation Error:", error);
          Alert.alert("GPS Timeout", "Location milne mein time lag raha hai. Kripya phone ki Location (GPS) On karein.");
          setTogglingOnline(false);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 30000,            
          maximumAge: 10000 
        }
      );

    } catch (error) {
      console.error("Toggle Error:", error);
      Alert.alert("System Error", "Kuch galat ho gaya.");
      setTogglingOnline(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
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

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
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

      {/* Online Status Toggle */}
      <View style={styles.onlineCard}>
        <View style={styles.onlineLeft}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary }]} />
          <View>
            <Text style={styles.onlineTitle}>
              {isOnline ? '🟢 You are Online' : '🔴 You are Offline'}
            </Text>
            <Text style={styles.onlineSubtitle}>
              {isOnline ? 'You can receive new job requests' : 'Toggle ON to receive job requests'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          disabled={togglingOnline}
          trackColor={{ false: COLORS.border, true: COLORS.success }}
          thumbColor={COLORS.white}
        />
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsRow}>
        <StatCard icon="📋" label="Total Jobs"    value={stats.total}     color={COLORS.primary} />
        <StatCard icon="✅" label="Completed"     value={stats.completed} color={COLORS.success} />
        <StatCard icon="⏳" label="Active"        value={stats.pending}   color={COLORS.warning} />
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
            activeOpacity={0.9}
          >
            <View style={styles.bookingTop}>
              <Text style={styles.bookingService}>{item.categoryId?.name || 'Service'}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.bookingInfo}>
              👤 {item.customerId?.name || 'Customer'}
            </Text>
            <Text style={styles.bookingInfo}>
              📅 {new Date(item.scheduledDate).toLocaleDateString('en-IN')}  ⏰ {item.scheduledTime}
            </Text>
            <Text style={styles.bookingInfo}>
              📍 {item.address?.city}, {item.address?.pincode}
            </Text>
            <View style={styles.bookingBottom}>
              <Text style={styles.bookingAmount}>₹{item.pricing?.totalAmount || 0}</Text>
              {item.status === 'pending' && (
                <View style={styles.actionRow}>
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
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xl + SPACING.lg,
    paddingBottom:     SPACING.lg,
    backgroundColor:   COLORS.white,
    ...SHADOWS.sm,
  },
  greeting:     { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subGreeting:  { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn:    { backgroundColor: COLORS.errorLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
  logoutText:   { color: COLORS.error, fontSize: FONT_SIZES.sm, fontWeight: '600' },

  onlineCard: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    backgroundColor:   COLORS.white,
    marginHorizontal:  SPACING.xl,
    marginTop:         SPACING.xl,
    padding:           SPACING.lg,
    borderRadius:      BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  onlineLeft:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  onlineDot:     { width: 12, height: 12, borderRadius: 6 },
  onlineTitle:   { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  onlineSubtitle:{ fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  sectionTitle:  { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl, marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.xl },
  seeAll:        { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  statsRow:      { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.md, marginBottom: SPACING.sm },
  statCard:      { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  statIcon:      { fontSize: 24, marginBottom: SPACING.xs },
  statValue:     { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  statLabel:     { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  bookingCard: {
    backgroundColor:   COLORS.white,
    marginHorizontal:  SPACING.xl,
    marginBottom:      SPACING.md,
    borderRadius:      BORDER_RADIUS.lg,
    padding:           SPACING.lg,
    ...SHADOWS.sm,
  },
  bookingTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  bookingService:{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  bookingInfo:   { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 3 },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.sm },
  bookingAmount: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },

  actionRow:     { flexDirection: 'row', gap: SPACING.sm },
  acceptBtn:     { backgroundColor: COLORS.success, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  acceptText:    { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  rejectBtn:     { backgroundColor: COLORS.errorLight, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  rejectText:    { color: COLORS.error, fontWeight: '700', fontSize: FONT_SIZES.sm },

  emptyBox:      { alignItems: 'center', padding: SPACING.xxxl },
  emptyIcon:     { fontSize: 64, marginBottom: SPACING.lg },
  emptyText:     { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});

export default DashboardScreen;