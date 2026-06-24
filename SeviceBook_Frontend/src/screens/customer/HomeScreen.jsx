/* eslint-disable react-hooks/exhaustive-deps */
// src/screens/customer/HomeScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, ScrollView,
  Platform, PermissionsAndroid, TextInput, Image
} from 'react-native';
import { useSelector } from 'react-redux';
import { categoryAPI } from '../../api/category.api';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import Geolocation from '@react-native-community/geolocation';
import Skeleton from '../../components/Skeleton';

const CATEGORY_ICONS = {
  'Electrician':      '⚡',
  'Plumber':          '🔧',
  'AC Repair':        '❄️',
  'Home Cleaning':    '🧹',
  'Painter':          '🎨',
  'Carpenter':        '🪚',
  'Appliance Repair': '🧰',
  'Pest Control':     '🐛',
  'Salon':            '💇',
  'Washing Machine':  '🧼',
  'Refrigerator':     '🧊',
};

const PROMO_BANNERS = [
  { id: '1', title: 'Flat ₹100 Off', subtitle: 'On your first booking', code: 'WELCOME100', color: '#3B82F6' },
  { id: '2', title: '50% Off AC Repair', subtitle: 'Limited time offer', code: 'FIXIGO50', color: '#10B981' },
  { id: '3', title: 'Expert Cleaners', subtitle: 'Deep clean your home', code: 'CLEAN20', color: '#8B5CF6' },
];

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector(s => s.auth);

  const [categories,  setCategories]  = useState([]);
  const [providers,   setProviders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [coords,      setCoords]      = useState(null);

  useEffect(() => { initScreen(); }, []);

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
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    );
  });

  const [error, setError] = useState(null);

  const initScreen = async () => {
    try {
      setLoading(true);
      setError(null);
      const hasPerm = await requestLocationPermission();
      let loc = null;
      if (hasPerm) {
        loc = await getCurrentLocation().catch(() => null);
      }
      if (!loc) {
        // Fallback Surat coords
        loc = { latitude: 21.1702, longitude: 72.8311 };
      }
      setCoords(loc);

      const [catRes, provRes] = await Promise.all([
        categoryAPI.getAll().catch(() => null),
        providerAPI.getNearby({
          latitude: loc.latitude, longitude: loc.longitude, page: 1, limit: 5
        }).catch(() => null)
      ]);

      if (catRes?.data?.data) {
        // Filter out "Pest Control" category per user request
        const filteredCats = catRes.data.data.filter(c => c.name !== 'Pest Control');
        setCategories(filteredCats);
      } else {
        throw new Error('Failed to load categories');
      }
      if (provRes?.data?.data) {
        let pData = Array.isArray(provRes.data.data) ? provRes.data.data : provRes.data.data.data || [];
        // Sort explicitly by online status, then rating, then completed jobs
        pData.sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          if ((b.aggregateRating || 0) !== (a.aggregateRating || 0)) return (b.aggregateRating || 0) - (a.aggregateRating || 0);
          return (b.completedJobs || 0) - (a.completedJobs || 0);
        });
        setProviders(pData.slice(0, 5));
      }
    } catch (e) {
      console.warn(e);
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

  const renderCategory = useCallback(({ item }) => {
    const icon = CATEGORY_ICONS[item.name] || '🔧';
    return (
      <TouchableOpacity 
        style={styles.catCard} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ServiceOptions', { category: item })}
      >
        <View style={styles.catIconBox}>
          <Text style={styles.catIconText}>{icon}</Text>
        </View>
        <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderProvider = useCallback(({ item }) => {
    const pName = item.userId?.name || 'Unknown';
    const rating = item.aggregateRating ? Number(item.aggregateRating).toFixed(1) : 'New';
    const jobs = item.completedJobs || 0;

    return (
      <TouchableOpacity 
        style={styles.providerCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProviderDetail', { providerId: item._id })}
      >
        <View style={styles.provHeader}>
          <View style={styles.provAvatarPlaceholder}>
            <Text style={{ fontSize: 24 }}>🧑‍🔧</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.provName}>{pName}</Text>
              {item.isVerified && <Text style={{ fontSize: 12, marginLeft: 4 }}>✅</Text>}
            </View>
            <Text style={styles.provExperience}>{item.experience || 1} yrs exp</Text>
          </View>
        </View>
        
        <View style={styles.provMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>⭐ {rating}</Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricVal}>💼 {jobs}</Text>
            <Text style={styles.metricLabel}>Jobs</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{item.isOnline ? '🟢' : '⚪'}</Text>
            <Text style={styles.metricLabel}>{item.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewProfileBtn}
          onPress={() => navigation.navigate('ProviderDetail', { providerId: item._id })}
        >
          <Text style={styles.viewProfileTxt}>View Profile</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderPromo = useCallback(({ item }) => (
    <View style={[styles.promoCard, { backgroundColor: item.color }]}>
      <Text style={styles.promoTitle}>{item.title}</Text>
      <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
      <View style={styles.promoCodeBox}>
        <Text style={styles.promoCodeText}>Use code: {item.code}</Text>
      </View>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={[styles.container, { padding: SPACING.lg, paddingTop: 60 }]}>
        {/* Header Skeleton */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View>
            <Skeleton width={120} height={24} style={{ marginBottom: 8 }} />
            <Skeleton width={180} height={16} />
          </View>
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>

        {/* Search Bar Skeleton */}
        <Skeleton width="100%" height={50} borderRadius={12} style={{ marginBottom: 30 }} />

        {/* Promo Slider Skeleton */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
          <Skeleton width={280} height={140} borderRadius={16} style={{ marginRight: 16 }} />
          <Skeleton width={280} height={140} borderRadius={16} />
        </ScrollView>

        {/* Categories Skeleton */}
        <Skeleton width={180} height={20} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <Skeleton width={80} height={100} borderRadius={16} />
          <Skeleton width={80} height={100} borderRadius={16} />
          <Skeleton width={80} height={100} borderRadius={16} />
          <Skeleton width={80} height={100} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🌐</Text>
        <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' }}>Oops! Something went wrong</Text>
        <Text style={{ fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl }}>{error}</Text>
        <TouchableOpacity 
          style={{ backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 14, borderRadius: BORDER_RADIUS.md }}
          onPress={initScreen}
        >
          <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
            <Text style={styles.locationTxt}>📍 {coords ? 'Surat, Gujarat' : 'Fetching location...'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileAvatar}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for services (e.g. AC Repair)"
            placeholderTextColor="#9CA3AF"
            onFocus={() => navigation.navigate('AllProviders')} // or a dedicated search screen
          />
        </View>

        {/* PROMO SLIDER */}
        <View style={styles.section}>
          <FlatList
            horizontal
            data={PROMO_BANNERS}
            keyExtractor={item => item.id}
            renderItem={renderPromo}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
            initialNumToRender={3}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What do you need help with?</Text>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={item => item._id}
            renderItem={renderCategory}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
            initialNumToRender={5}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>

        {/* NEARBY PROVIDERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Providers Near You</Text>
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
              contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
              initialNumToRender={3}
              windowSize={5}
              removeClippedSubviews={true}
              snapToInterval={280 + SPACING.md}
              decelerationRate="fast"
            />
          ) : (
            <Text style={styles.noDataTxt}>No providers found nearby.</Text>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl,
    paddingBottom: SPACING.md,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827' },
  locationTxt: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12,
    marginHorizontal: SPACING.lg, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: SPACING.lg,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },

  section: { marginBottom: SPACING.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  seeAllTxt: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  promoCard: {
    width: 280, padding: SPACING.lg, borderRadius: 16, marginRight: SPACING.md,
    justifyContent: 'space-between', minHeight: 140,
  },
  promoTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  promoSubtitle: { fontSize: 14, color: '#E0E7FF', marginTop: 4 },
  promoCodeBox: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 16 },
  promoCodeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  catCard: { alignItems: 'center', width: 80, marginRight: SPACING.md },
  catIconBox: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catIconText: { fontSize: 32 },
  catName: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },

  providerCard: {
    width: 280, backgroundColor: '#FFFFFF', borderRadius: 16, padding: SPACING.lg,
    marginRight: SPACING.md, borderWidth: 1, borderColor: '#F3F4F6', ...SHADOWS.sm, elevation: 3,
    marginBottom: 4
  },
  provHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  provAvatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  provName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  provExperience: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  provMetrics: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 16 },
  metric: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  metricLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: '#E5E7EB' },

  viewProfileBtn: { backgroundColor: '#EEF2FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  viewProfileTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  noDataTxt: { paddingHorizontal: SPACING.lg, color: '#6B7280', fontSize: 14 }
});

export default HomeScreen;