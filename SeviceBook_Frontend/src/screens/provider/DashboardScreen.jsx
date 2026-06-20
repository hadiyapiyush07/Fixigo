import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated,
  PermissionsAndroid, Platform, Alert, ActivityIndicator,
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
  const [providerProfile, setProviderProfile] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookings, setBookings]         = useState([]);
  const [stats, setStats]               = useState({ total: 0, completed: 0, todayJobs: 0 });
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Animated values for the toggle
  const toggleAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const glowAnim     = useRef(new Animated.Value(0)).current;

  const isProfileComplete = () => {
    if (!providerProfile) return false;
    const hasAadhaar = !!providerProfile.aadhaar;
    const hasIdProof = !!providerProfile.idProof;
    const hasSelfie = !!providerProfile.selfie;
    const hasSkills = Array.isArray(providerProfile.skills) && providerProfile.skills.length > 0;
    const hasWorkingRadius = typeof providerProfile.workingRadius === 'number' && providerProfile.workingRadius > 0;
    const hasAddress = !!providerProfile.address || !!providerProfile.serviceArea?.city;
    const hasEmergencyContact = !!providerProfile.emergencyContact;
    const hasBankDetails = providerProfile.bankDetails && 
                           !!providerProfile.bankDetails.accountHolderName && 
                           !!providerProfile.bankDetails.accountNo && 
                           !!providerProfile.bankDetails.ifscCode;
    return hasAadhaar && hasIdProof && hasSelfie && hasSkills && hasWorkingRadius && hasAddress && hasEmergencyContact && hasBankDetails;
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const profRes = await providerAPI.getMyProfile();
      const profile = profRes.data.data;
      setProviderProfile(profile);
      setIsOnline(profile?.isOnline || false);

      const res   = await bookingAPI.getProviderBookings({ page: 1, limit: 20 });
      const data  = res.data.data?.data || [];
      setBookings(data);

      const total     = profile?.totalBookings || 0;
      const completed = profile?.completedBookings || 0;
      
      const todayStr = new Date().toDateString();
      const todayJobs = data.filter(b => {
        if (!b.scheduledDate) return false;
        return new Date(b.scheduledDate).toDateString() === todayStr;
      }).length;

      setStats({ total, completed, todayJobs });

      const active = data.find(b => 
        b.status !== 'pending' && 
        b.status !== 'completed' && 
        b.status !== 'cancelled' && 
        b.status !== 'rejected' && 
        b.status !== 'expired'
      );
      setActiveBooking(active);
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
    if (providerProfile && !providerProfile.isVerified) {
      if (providerProfile.verificationStatus === 'rejected') {
        Alert.alert('Verification Rejected', 'Your profile verification was rejected. Please update your profile or contact support.');
      } else {
        Alert.alert('Verification Pending', 'Your profile is under verification. Please wait until the admin approves your account.');
      }
      return;
    }
    if (providerProfile && providerProfile.status === 'busy') {
      Alert.alert('Status Locked', 'You cannot change your availability status while on an active job.');
      return;
    }
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
            const toggleRes = await providerAPI.toggleOnline({ isOnline: newValue, latitude, longitude });
            setProviderProfile(prev => prev ? { ...prev, isOnline: newValue, status: toggleRes.data.data?.status || (newValue ? 'online' : 'offline') } : null);
          } catch (apiError) {
            // Revert on failure
            setIsOnline(!newValue);
            Alert.alert('Update Failed', apiError.response?.data?.message || 'Could not update your status. Please try again.');
          } finally {
            setTogglingOnline(false);
          }
        },
        (err) => {
          console.log('GPS Error:', err);
          providerAPI
            .toggleOnline({ isOnline: newValue })
            .then((res) => {
              setProviderProfile(prev => prev ? { ...prev, isOnline: newValue, status: res.data.data?.status || (newValue ? 'online' : 'offline') } : null);
            })
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

  const formatLastActive = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Interpolations
  const thumbTranslate = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 26] });
  const trackColor     = toggleAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: ['#D1D5DB', providerProfile?.status === 'busy' ? '#F59E0B' : '#22C55E'] 
  });
  const glowOpacity    = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] });

  const CustomToggle = () => (
    <TouchableOpacity
      onPress={() => handleToggleOnline(!isOnline)}
      disabled={togglingOnline || (providerProfile && !providerProfile.isVerified) || (providerProfile && providerProfile.status === 'busy')}
      activeOpacity={0.85}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        {/* Glow ring */}
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity, backgroundColor: providerProfile?.status === 'busy' ? '#F59E0B' : '#22C55E' }]} />
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

  const renderIncompleteProfileView = () => (
    <View style={styles.bannerContainerCenter}>
      <Text style={styles.bannerIconLarge}>📋</Text>
      <Text style={styles.bannerTitleLarge}>Complete Your Profile</Text>
      <Text style={styles.bannerTextLarge}>
        You must complete your professional profile before you can go online and start receiving booking requests.
      </Text>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('EditProviderProfile')}
      >
        <Text style={styles.actionButtonText}>Complete Profile Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPendingVerificationView = () => (
    <View style={styles.bannerContainerCenter}>
      <Text style={styles.bannerIconLarge}>⏳</Text>
      <Text style={styles.bannerTitleLarge}>Verification Pending</Text>
      <Text style={styles.bannerTextLarge}>
        Profile submitted successfully. Waiting for admin verification.
      </Text>
      <Text style={styles.bannerSubtext}>
        Your profile is under verification. Please wait until the admin approves your account.
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: COLORS.textSecondary, marginTop: 20 }]}
        onPress={() => navigation.navigate('EditProviderProfile')}
      >
        <Text style={styles.actionButtonText}>Edit Profile Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRejectedView = () => (
    <View style={styles.bannerContainerCenter}>
      <Text style={styles.bannerIconLarge}>⚠️</Text>
      <Text style={styles.bannerTitleLarge}>Verification Rejected</Text>
      <Text style={styles.bannerTextLarge}>
        Your profile verification was rejected. Please review and re-submit your profile.
      </Text>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('EditProviderProfile')}
      >
        <Text style={styles.actionButtonText}>Edit & Re-submit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboardContent = () => {
    const complete = isProfileComplete();

    if (!complete) {
      return renderIncompleteProfileView();
    }

    if (providerProfile?.verificationStatus === 'rejected') {
      return renderRejectedView();
    }

    if (!providerProfile?.isVerified || providerProfile?.verificationStatus === 'pending') {
      return renderPendingVerificationView();
    }

    // Full dashboard unlocked
    return (
      <>
        {/* ── Online/Busy Toggle Card ── */}
        <View style={[
          styles.onlineCard, 
          isOnline && styles.onlineCardActive,
          providerProfile?.status === 'busy' && styles.onlineCardBusy
        ]}>
          <View style={styles.onlineLeft}>
            <Animated.View
              style={[
                styles.statusDotWrapper,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={[
                styles.onlineDot, 
                { 
                  backgroundColor: providerProfile?.status === 'busy' 
                    ? '#F59E0B' 
                    : isOnline 
                      ? '#22C55E' 
                      : '#9CA3AF' 
                }
              ]} />
              {isOnline && providerProfile?.status !== 'busy' && <View style={styles.onlineDotRing} />}
            </Animated.View>

            <View style={{ flex: 1 }}>
              <View style={styles.statusHeaderRow}>
                <Text style={styles.onlineTitle}>
                  {providerProfile?.status === 'busy' 
                    ? 'You are Busy' 
                    : isOnline 
                      ? 'You are Online' 
                      : 'You are Offline'}
                </Text>
                
                {/* Verification Badge */}
                <View style={[styles.verifyBadge, styles.verifyBadgeSuccess]}>
                  <Text style={[styles.verifyBadgeText, styles.verifyBadgeTextSuccess]}>Verified</Text>
                </View>
              </View>
              
              <Text style={styles.onlineSubtitle}>
                {providerProfile?.status === 'busy'
                  ? 'On an active job. Cannot change status.'
                  : togglingOnline
                  ? 'Updating status…'
                  : isOnline
                  ? 'Receiving new job requests'
                  : 'Toggle ON to receive requests'}
              </Text>
              
              {providerProfile?.updatedAt && (
                <Text style={styles.lastActiveText}>
                  Last Active: {formatLastActive(providerProfile.updatedAt)}
                </Text>
              )}
            </View>
          </View>

          <CustomToggle />
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsRow}>
          <StatCard icon="📅" label="Today's Jobs" value={stats.todayJobs} color="#3B82F6" />
          <StatCard icon="✅" label="Completed"    value={stats.completed} color="#22C55E" />
          <StatCard icon="📋" label="Total Jobs"    value={stats.total}     color={COLORS.primary} />
        </View>

        {/* ── Active Booking Section ── */}
        {activeBooking && (
          <View style={styles.activeBookingContainer}>
            <Text style={styles.sectionTitle}>🎯 Active Job</Text>
            <TouchableOpacity
              style={styles.activeBookingCard}
              onPress={() => navigation.navigate('BookingDetail', { booking: activeBooking })}
              activeOpacity={0.92}
            >
              <View style={styles.activeBookingHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeBookingService}>
                    {activeBooking.categoryId?.name || 'Service'}
                  </Text>
                  <Text style={styles.activeBookingCustomer}>
                    👤 {activeBooking.customerId?.name || 'Customer'}
                  </Text>
                </View>
                <StatusBadge status={activeBooking.status} />
              </View>
              
              <View style={styles.activeBookingDetails}>
                <Text style={styles.activeBookingInfo}>
                  📅 {new Date(activeBooking.scheduledDate).toLocaleDateString('en-IN')}  ⏰ {activeBooking.scheduledTime}
                </Text>
                <Text style={styles.activeBookingInfo} numberOfLines={1}>
                  📍 {activeBooking.address?.addressLine}, {activeBooking.address?.city}
                </Text>
              </View>
              
              <View style={styles.activeBookingFooter}>
                <Text style={styles.activeBookingAmount}>₹{activeBooking.pricing?.totalAmount || 0}</Text>
                <View style={styles.manageActiveBtn}>
                  <Text style={styles.manageActiveText}>Manage Job →</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

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
          bookings.slice(0, 5).map(item => (
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
      </>
    );
  };

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

      {loading && !refreshing && !providerProfile ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        renderDashboardContent()
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

  /* Banner Styles */
  bannerContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  bannerPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  bannerRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  bannerIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  bannerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#1F2937',
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 18,
  },

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
  onlineCardBusy: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

  statusDotWrapper: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  onlineDot:        { width: 12, height: 12, borderRadius: 6, position: 'absolute' },
  onlineDotRing:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#22C55E', opacity: 0.4, position: 'absolute' },

  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  onlineTitle:    { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827' },
  onlineSubtitle: { fontSize: FONT_SIZES.xs, color: '#6B7280', marginTop: 2 },
  lastActiveText: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },

  /* Verification Badges */
  verifyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifyBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  verifyBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  verifyBadgeError: {
    backgroundColor: '#FEE2E2',
  },
  verifyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  verifyBadgeTextSuccess: {
    color: '#065F46',
  },
  verifyBadgeTextWarning: {
    color: '#92400E',
  },
  verifyBadgeTextError: {
    color: '#991B1B',
  },

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

  /* Active Booking Card */
  activeBookingContainer: {
    marginTop: 4,
  },
  activeBookingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.xl,
    borderRadius: 16,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  activeBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  activeBookingService: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#111827',
  },
  activeBookingCustomer: {
    fontSize: FONT_SIZES.sm,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 4,
  },
  activeBookingDetails: {
    backgroundColor: '#F3F4F6',
    padding: SPACING.md,
    borderRadius: 12,
    gap: 4,
    marginBottom: SPACING.md,
  },
  activeBookingInfo: {
    fontSize: FONT_SIZES.sm,
    color: '#4B5563',
  },
  activeBookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: SPACING.md,
  },
  activeBookingAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#111827',
  },
  manageActiveBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  manageActiveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },

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

  bannerContainerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginHorizontal: SPACING.xl,
    marginTop: 40,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerIconLarge: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  bannerTitleLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  bannerTextLarge: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  bannerSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});

export default DashboardScreen;