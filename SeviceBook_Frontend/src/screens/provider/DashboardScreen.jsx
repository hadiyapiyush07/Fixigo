import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated,
  PermissionsAndroid, Platform, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { bookingAPI } from '../../api/booking.api';
import { providerAPI } from '../../api/provider.api';
import { logoutUser } from '../../store/slices/authSlice';
import { socketService } from '../../services/socket.service';

import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';

import Geolocation from '@react-native-community/geolocation';

const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} mins ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs} hrs ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

const getDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return null;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [isOnline, setIsOnline] = useState(false);
  const [providerProfile, setProviderProfile] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const toggleAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard(false); // Silent load when focused
      
      const interval = setInterval(() => {
        if (!togglingOnline) loadDashboard(false);
      }, 20000); // 20 seconds polling as requested

      return () => clearInterval(interval);
    }, [togglingOnline])
  );

  useEffect(() => {
    // Keep socket listener for instant updates
    socketService.on('booking:status_update', handleSocketUpdate);
    socketService.on('booking:new', handleSocketUpdate);

    return () => {
      socketService.off('booking:status_update', handleSocketUpdate);
      socketService.off('booking:new', handleSocketUpdate);
    };
  }, []);

  const handleSocketUpdate = () => {
    loadDashboard(false);
  };

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isOnline ? 1 : 0,
      useNativeDriver: false,
      friction: 6,
      tension: 80,
    }).start();
  }, [isOnline]);

  const loadDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const profRes = await providerAPI.getMyProfile();
      const profile = profRes.data.data;
      setProviderProfile(profile);
      setIsOnline(profile?.isOnline || false);

      const [bookingsRes, statsRes] = await Promise.all([
        bookingAPI.getProviderBookings({ page: 1, limit: 10 }),
        providerAPI.getMyStats(),
      ]);

      const data = bookingsRes.data.data?.data || [];
      setBookings(data);
      setStats(statsRes.data.data || {});

      const active = data.find(b => 
        ['provider_on_the_way', 'arrived', 'otp_verification', 'in_progress'].includes(b.status)
      );
      setActiveBooking(active);
    } catch (e) {
      console.log('Dashboard load error:', e);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleOnline = async (newValue) => {
    if (providerProfile && !providerProfile.isVerified) {
      Alert.alert('Verification Required', 'Your profile is pending verification.');
      return;
    }
    if (providerProfile && providerProfile.status === 'busy') {
      Alert.alert('Status Locked', 'You cannot change availability while on a job.');
      return;
    }
    
    if (togglingOnline) return;
    setTogglingOnline(true);
    setIsOnline(newValue);

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location access is required.');
          setIsOnline(!newValue);
          setTogglingOnline(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            await providerAPI.toggleOnline({ isOnline: newValue, latitude, longitude });
            await loadDashboard(false);
          } catch (e) {
            setIsOnline(!newValue);
          } finally {
            setTogglingOnline(false);
          }
        },
        () => {
          setIsOnline(!newValue);
          setTogglingOnline(false);
          Alert.alert('Location Error', 'Could not fetch your location.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      setIsOnline(!newValue);
      setTogglingOnline(false);
    }
  };

  const pendingRequests = bookings.filter(b => b.status === 'pending');

  if (loading) {
    return (
      <View style={styles.safe}>
        <LoadingSkeleton height={150} style={{ margin: SPACING.md }} />
        <LoadingSkeleton height={100} style={{ margin: SPACING.md }} />
        <LoadingSkeleton height={200} style={{ margin: SPACING.md }} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello {user?.name?.split(' ')[0] || 'Provider'} 👋</Text>
              <View style={styles.onlineStatusRow}>
                <View style={[styles.dot, { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary }]} />
                <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderProfile')}>
              <Avatar name={user?.name} size={48} />
            </TouchableOpacity>
          </View>

          {/* Toggle Online Button */}
          <Card style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
              <Text style={styles.toggleSub}>{isOnline ? 'Waiting for job requests' : 'Go online to receive jobs'}</Text>
            </View>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => handleToggleOnline(!isOnline)}
              disabled={togglingOnline}
              style={styles.switchBox}
            >
              <View style={[styles.switchTrack, { backgroundColor: isOnline ? COLORS.success : COLORS.border }]}>
                <Animated.View style={[styles.switchThumb, {
                  transform: [{
                    translateX: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 28] })
                  }]
                }]} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <SectionHeader title="Today's Overview" />
          <View style={styles.statsGrid}>
            <Card style={styles.statBox}>
              <Text style={styles.statVal}>{stats.todayJobs || 0}</Text>
              <Text style={styles.statLabel}>Today's Jobs</Text>
            </Card>
            <Card style={styles.statBox}>
              <Text style={styles.statVal}>{pendingRequests.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card>
            <Card style={styles.statBox}>
              <Text style={styles.statVal}>{stats.completed || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card>
          </View>
        </View>

        {/* Active Job */}
        <View style={styles.section}>
          <SectionHeader title="Current Active Job" />
          {activeBooking ? (
            <Card onPress={() => navigation.navigate('BookingDetail', { bookingId: activeBooking._id })}>
              <View style={styles.activeRow}>
                <View>
                  <Text style={styles.activeService}>{activeBooking.serviceId?.name || 'Service'}</Text>
                  <Text style={styles.activeCustomer}>{activeBooking.customerId?.name || 'Customer'}</Text>
                </View>
                <StatusBadge status={activeBooking.status} />
              </View>
              <View style={styles.divider} />
              <View style={styles.activeMeta}>
                <Text style={styles.metaTxt}>📍 {activeBooking.distance || '?'} km away</Text>
                <Text style={styles.metaTxt}>₹ {activeBooking.totalAmount}</Text>
              </View>
              <TouchableOpacity 
                style={styles.manageBtn}
                onPress={() => navigation.navigate('BookingDetail', { bookingId: activeBooking._id })}
              >
                <Text style={styles.manageBtnTxt}>Manage Job</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <EmptyState 
              icon="☕" 
              title="No Active Job" 
              subtitle="You have no ongoing services right now." 
              style={{ backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl }}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.quickIcon}>📥</Text>
              <Text style={styles.quickLabel}>Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.quickIcon}>💰</Text>
              <Text style={styles.quickLabel}>Earnings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('ProviderProfile')}>
              <Text style={styles.quickIcon}>👤</Text>
              <Text style={styles.quickLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  onlineStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  
  toggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xl },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  toggleSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  
  switchBox: { width: 56, height: 32, justifyContent: 'center' },
  switchTrack: { width: 56, height: 32, borderRadius: 16, justifyContent: 'center' },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.white, ...COLORS.shadow },

  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg },
  statVal: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },

  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeService: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  activeCustomer: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, my: SPACING.md, marginVertical: SPACING.md },
  activeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  metaTxt: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  manageBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  manageBtnTxt: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },

  quickGrid: { flexDirection: 'row', gap: SPACING.md },
  quickBtn: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
});

export default DashboardScreen;