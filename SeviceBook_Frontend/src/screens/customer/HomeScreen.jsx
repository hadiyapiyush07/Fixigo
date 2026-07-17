/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform, PermissionsAndroid, TextInput
} from 'react-native';
import Reanimated, { FadeInUp, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { categoryAPI } from '../../api/category.api';
import { providerAPI } from '../../api/provider.api';
import { couponAPI } from '../../api/coupon.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import Geolocation from '@react-native-community/geolocation';
import Skeleton from '../../components/Skeleton';
import { socketService } from '../../services/socket.service';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { 
  Zap, Wrench, Snowflake, Sparkles, PaintBucket, Hammer, 
  PenTool, Bug, Scissors, Monitor, Search, MapPin, TicketPercent, 
  ChevronDown, Star, CheckCircle2, Navigation
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const CATEGORY_ICONS = {
  'Electrician':      <Zap size={28} color={COLORS.primary} />,
  'Plumber':          <Wrench size={28} color={COLORS.primary} />,
  'AC Repair':        <Snowflake size={28} color={COLORS.primary} />,
  'Home Cleaning':    <Sparkles size={28} color={COLORS.primary} />,
  'Painter':          <PaintBucket size={28} color={COLORS.primary} />,
  'Carpenter':        <Hammer size={28} color={COLORS.primary} />,
  'Appliance Repair': <PenTool size={28} color={COLORS.primary} />,
  'Pest Control':     <Bug size={28} color={COLORS.primary} />,
  'Salon':            <Scissors size={28} color={COLORS.primary} />,
  'Washing Machine':  <Monitor size={28} color={COLORS.primary} />,
  'Refrigerator':     <Snowflake size={28} color={COLORS.primary} />,
};

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector(s => s.auth);

  const [categories,  setCategories]  = useState([]);
  const [providers,   setProviders]   = useState([]);
  const [coupons,     setCoupons]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [coords,      setCoords]      = useState(null);
  const [error, setError] = useState(null);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => { initScreen(); }, []);

  useEffect(() => {
    const handleProviderUpdate = () => {
      if (coords) {
        providerAPI.getNearby({
          latitude: coords.latitude, longitude: coords.longitude, page: 1, limit: 5
        }).then(provRes => {
          if (provRes?.data?.data) {
            let pData = Array.isArray(provRes.data.data) ? provRes.data.data : provRes.data.data.data || [];
            pData.sort((a, b) => {
              const aOnline = a.status === 'available';
              const bOnline = b.status === 'available';
              if (aOnline !== bOnline) return aOnline ? -1 : 1;
              if ((b.aggregateRating || 0) !== (a.aggregateRating || 0)) return (b.aggregateRating || 0) - (a.aggregateRating || 0);
              return (b.completedJobs || 0) - (a.completedJobs || 0);
            });
            setProviders(pData.slice(0, 5));
          }
        }).catch(e => console.log("Silent refresh failed", e));
      }
    };

    socketService.on('providers:status_changed', handleProviderUpdate);
    return () => socketService.off('providers:status_changed', handleProviderUpdate);
  }, [coords]);

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title:          'Location Permission',
          message:        'Fixigo needs your location to find nearby providers.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) { return false; }
  };

  const getCurrentLocation = () => new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  });

  const initScreen = async () => {
    try {
      setLoading(true);
      setError(null);
      const hasPerm = await requestLocationPermission();
      let loc = null;
      if (hasPerm) loc = await getCurrentLocation().catch(() => null);
      if (!loc) loc = { latitude: 21.1702, longitude: 72.8311 }; // Fallback
      setCoords(loc);

      const [catRes, provRes, couponRes] = await Promise.all([
        categoryAPI.getAll().catch(() => null),
        providerAPI.getNearby({ latitude: loc.latitude, longitude: loc.longitude, page: 1, limit: 5 }).catch(() => null),
        couponAPI.getActive().catch(() => null)
      ]);

      if (catRes?.data?.data) {
        setCategories(catRes.data.data.filter(c => c.name !== 'Pest Control'));
      }
      
      if (provRes?.data?.data) {
        let pData = Array.isArray(provRes.data.data) ? provRes.data.data : provRes.data.data.data || [];
        pData.sort((a, b) => {
          const aOnline = a.status === 'available';
          const bOnline = b.status === 'available';
          if (aOnline !== bOnline) return aOnline ? -1 : 1;
          if ((b.aggregateRating || 0) !== (a.aggregateRating || 0)) return (b.aggregateRating || 0) - (a.aggregateRating || 0);
          return (b.completedJobs || 0) - (a.completedJobs || 0);
        });
        setProviders(pData.slice(0, 5));
      }

      if (couponRes?.data?.data) {
        const bgColors = [
          ['#0F766E', '#14B8A6'], 
          ['#1E3A8A', '#3B82F6'], 
          ['#581C87', '#8B5CF6']
        ];
        const formattedCoupons = couponRes.data.data.map((c, i) => ({
          id: c._id || String(i),
          title: c.discountType === 'flat' ? `Flat ₹${c.discountValue} Off` : `${c.discountValue}% Off`,
          subtitle: c.description || (c.minBookingAmount ? `Min order ₹${c.minBookingAmount}` : 'Limited time offer'),
          code: c.code,
          colors: bgColors[i % bgColors.length]
        }));
        setCoupons(formattedCoupons);
      }
    } catch (e) {
      setError('Failed to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    initScreen();
  };

  const renderCategory = useCallback(({ item, index }) => {
    const icon = CATEGORY_ICONS[item.name] || <Wrench size={28} color={COLORS.primary} />;
    return (
      <Reanimated.View entering={FadeInUp.delay(100 + index * 50).springify()}>
        <TouchableOpacity 
          style={styles.catCard} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ServiceOptions', { category: item })}
        >
          <View style={styles.catIconBox}>
            {icon}
          </View>
          <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>
      </Reanimated.View>
    );
  }, [navigation]);

  const renderProvider = useCallback(({ item, index }) => {
    const pName = item.userId?.name || 'Unknown';
    const rating = item.aggregateRating ? Number(item.aggregateRating).toFixed(1) : 'New';
    
    return (
      <Reanimated.View entering={FadeInUp.delay(200 + index * 100).springify()}>
        <Card style={styles.providerCard} onPress={() => navigation.navigate('ProviderDetail', { providerId: item._id })}>
          <View style={styles.provHeader}>
            <Avatar name={pName} size={56} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.provName}>{pName}</Text>
                {item.isVerified && <CheckCircle2 size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />}
              </View>
              <Text style={styles.provExperience}>{item.experience || 1} yrs exp</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color={COLORS.star} fill={COLORS.star} />
              <Text style={styles.ratingTxt}>{rating}</Text>
            </View>
          </View>
          
          <View style={styles.provMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricVal}>{item.completedJobs || 0}</Text>
              <Text style={styles.metricLabel}>Jobs Done</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'available' ? COLORS.success : COLORS.textDisabled }]} />
              <Text style={styles.metricLabel}>{item.status === 'available' ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          
          <PrimaryButton 
            title="View Profile" 
            variant="outline" 
            onPress={() => navigation.navigate('ProviderDetail', { providerId: item._id })}
            style={{ height: 44, borderRadius: 12 }}
            textStyle={{ fontSize: 14 }}
          />
        </Card>
      </Reanimated.View>
    );
  }, [navigation]);

  const renderPromo = useCallback(({ item, index }) => (
    <Reanimated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity activeOpacity={0.9} style={styles.promoWrapper}>
        <LinearGradient
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>{item.title}</Text>
            <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.promoCodeBox}>
            <TicketPercent size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.promoCodeText}>{item.code}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Reanimated.View>
  ), []);

  if (loading) {
    return (
      <View style={[styles.container, { padding: SPACING.lg, paddingTop: 60 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View>
            <Skeleton width={120} height={24} style={{ marginBottom: 8 }} />
            <Skeleton width={180} height={16} />
          </View>
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>
        <Skeleton width="100%" height={56} borderRadius={BORDER_RADIUS.xl} style={{ marginBottom: 30 }} />
        <View style={{ flexDirection: 'row', marginBottom: 30 }}>
          <Skeleton width={300} height={160} borderRadius={BORDER_RADIUS.xxl} style={{ marginRight: 16 }} />
          <Skeleton width={300} height={160} borderRadius={BORDER_RADIUS.xxl} />
        </View>
        <Skeleton width={180} height={24} style={{ marginBottom: 20 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <Skeleton width={80} height={100} borderRadius={24} />
          <Skeleton width={80} height={100} borderRadius={24} />
          <Skeleton width={80} height={100} borderRadius={24} />
          <Skeleton width={80} height={100} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
        <AlertCircle size={64} color={COLORS.textSecondary} />
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.lg, textAlign: 'center' }}>Oops! Something went wrong</Text>
        <Text style={{ fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.md, lineHeight: 22 }}>{error}</Text>
        <PrimaryButton title="Retry Connection" onPress={initScreen} style={{ width: 200, marginTop: SPACING.lg }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Reanimated.ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <Reanimated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
            <TouchableOpacity style={styles.locationSelector}>
              <MapPin size={14} color={COLORS.primary} />
              <Text style={styles.locationTxt} numberOfLines={1}>
                {coords ? 'Surat, Gujarat' : 'Fetching location...'}
              </Text>
              <ChevronDown size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'User'} size={48} />
          </TouchableOpacity>
        </Reanimated.View>

        {/* SEARCH BAR */}
        <Reanimated.View entering={FadeInDown.delay(100).duration(400)} style={styles.searchWrapper}>
          <TouchableOpacity 
            style={styles.searchContainer} 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate('AllProviders')}
          >
            <Search size={20} color={COLORS.textTertiary} />
            <Text style={styles.searchInputPlaceholder}>Search for services (e.g. AC Repair)</Text>
          </TouchableOpacity>
        </Reanimated.View>

        {/* PROMO SLIDER */}
        {coupons.length > 0 && (
          <View style={styles.section}>
            <FlatList
              horizontal
              data={coupons}
              keyExtractor={item => item.id}
              renderItem={renderPromo}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
              snapToInterval={316}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Services</Text>
          </View>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={item => item._id}
            renderItem={renderCategory}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
          />
        </View>

        {/* NEARBY PROVIDERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Providers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllProviders')}>
              <Text style={styles.seeAllTxt}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {providers.length > 0 ? (
            <FlatList
              horizontal
              data={providers}
              keyExtractor={item => item._id}
              renderItem={renderProvider}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}
              snapToInterval={320 + SPACING.md}
              decelerationRate="fast"
            />
          ) : (
            <Card style={{ marginHorizontal: SPACING.lg, alignItems: 'center', padding: SPACING.xl }}>
              <Navigation size={32} color={COLORS.textTertiary} style={{ marginBottom: SPACING.md }} />
              <Text style={{ fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' }}>No providers found nearby.</Text>
            </Card>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </Reanimated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },
  greeting: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  locationSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  locationTxt: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600', maxWidth: 200 },

  searchWrapper: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xxl },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg, height: 56,
    ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  searchInputPlaceholder: { flex: 1, fontSize: FONT_SIZES.lg, color: COLORS.textTertiary, marginLeft: SPACING.sm, fontWeight: '500' },

  section: { marginBottom: SPACING.xxxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  seeAllTxt: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },

  promoWrapper: { marginRight: SPACING.md },
  promoCard: {
    width: 300, height: 160, borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl, justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  promoTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  promoSubtitle: { fontSize: FONT_SIZES.md, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: '500' },
  promoCodeBox: { 
    backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 16, paddingVertical: 8, 
    borderRadius: BORDER_RADIUS.lg, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center'
  },
  promoCodeText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZES.sm, letterSpacing: 1 },

  catCard: { alignItems: 'center', width: 90, marginRight: SPACING.md },
  catIconBox: { 
    width: 72, height: 72, borderRadius: 24, backgroundColor: COLORS.surface, 
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
    ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.divider
  },
  catName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', lineHeight: 18 },

  providerCard: {
    width: 320, marginRight: SPACING.md, padding: SPACING.lg,
  },
  provHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  provName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  provExperience: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
  ratingTxt: { fontSize: 12, fontWeight: '800', color: COLORS.warning, marginLeft: 4 },

  provMetrics: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  metric: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 6 },
  metricVal: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  metricLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  metricDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});

export default HomeScreen;