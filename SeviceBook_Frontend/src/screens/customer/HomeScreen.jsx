/* eslint-disable react-hooks/exhaustive-deps */
// src/screens/customer/HomeScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
  Platform, PermissionsAndroid, TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { categoryAPI } from '../../api/category.api';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import Geolocation from '@react-native-community/geolocation';

const CATEGORY_ICONS = {
  'Electrician':      '⚡',
  'Plumber':          '🔧',
  'AC Repair':        '❄️',
  'Home Cleaning':    '🧹',
  'Painter':          '🎨',
  'Carpenter':        '🪚',
  'Appliance Repair': '📺',
  'Pest Control':     '🐛',
  'Salon':            '💇',
};

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector(s => s.auth);

  const [categories,  setCategories]  = useState([]);
  const [providers,   setProviders]   = useState([]);
  const [catLoading,  setCatLoading]  = useState(true);
  const [provLoading, setProvLoading] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [searchText,  setSearchText]  = useState('');
  const [coords,      setCoords]      = useState(null);

  // ✅ Store full category object (not just _id) so basePrice travels with it
  const [selectedCat, setSelectedCat] = useState(null); // { _id, name, basePrice, ... }

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

  const loadCategories = async () => {
    try {
      setCatLoading(true);
      const res = await categoryAPI.getAll();
      setCategories(res?.data?.data || []);
    } catch (e) {
      console.log('Categories error:', e.message);
    } finally {
      setCatLoading(false);
    }
  };

  const fetchProviders = async (lat, lng, pageNum = 1, categoryId = null, reset = false) => {
    if (provLoading && !reset) return;
    if (!reset && !hasNextPage) return;
    setProvLoading(true);
    try {
      const res = await providerAPI.getNearby({
        latitude:  lat,
        longitude: lng,
        ...(categoryId ? { categoryId } : {}),
        page:  pageNum,
        limit: 10,
      });
      const raw        = res?.data?.data || res?.data;
      const data       = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      const pagination = raw?.pagination || {};

      if (reset) setProviders(data);
      else       setProviders(prev => [...prev, ...data]);

      setPage(pageNum);
      setHasNextPage(Boolean(pagination?.hasNextPage));
    } catch (e) {
      console.log('Providers error:', e.message);
    } finally {
      setProvLoading(false);
    }
  };

  const initScreen = async () => {
    await loadCategories();
    const ok = await requestLocationPermission();
    if (!ok) {
      Alert.alert('Permission Needed', 'Enable location to find providers near you.');
      return;
    }
    try {
      const loc = await getCurrentLocation();
      setCoords(loc);
      await fetchProviders(loc.latitude, loc.longitude, 1, null, true);
    } catch (e) {
      console.log('GPS error:', e);
      // Fallback to Surat coordinates if GPS fails
      const fallback = { latitude: 21.1702, longitude: 72.8311 };
      setCoords(fallback);
      await fetchProviders(fallback.latitude, fallback.longitude, 1, null, true);
    }
  };

  // ✅ Store full category object, not just _id
  const handleCategoryPress = (cat) => {
    navigation.navigate('ServiceOptions', { category: cat });
  };

  const handleClearFilter = async () => {
    setSelectedCat(null);
    setProviders([]);
    setPage(1);
    setHasNextPage(true);
    if (coords) await fetchProviders(coords.latitude, coords.longitude, 1, null, true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    const ok = await requestLocationPermission();
    if (ok) {
      try {
        const loc = await getCurrentLocation();
        setCoords(loc);
        setSelectedCat(null);
        await fetchProviders(loc.latitude, loc.longitude, 1, null, true);
      } catch (e) {}
    }
    setRefreshing(false);
  }, []);

  const filteredProviders = useMemo(() => {
    if (!searchText.trim()) return providers;
    const q = searchText.toLowerCase();
    return providers.filter(p =>
      p?.userId?.name?.toLowerCase().includes(q) ||
      p?.skills?.some(s => s?.name?.toLowerCase().includes(q))
    );
  }, [providers, searchText]);

  // ── Category Item ────────────────────────────────────────────────────
  const CategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.catItem, selectedCat?._id === item._id && styles.catItemActive]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.catIconBox, selectedCat?._id === item._id && styles.catIconBoxActive]}>
        <Text style={styles.catEmoji}>{CATEGORY_ICONS[item.name] || '🔨'}</Text>
      </View>
      <Text style={[styles.catName, selectedCat?._id === item._id && styles.catNameActive]}>
        {item.name}
      </Text>
      {/* ✅ Show real basePrice from DB */}
      <Text style={styles.catPrice}>₹{item.basePrice || 199}+</Text>
    </TouchableOpacity>
  );

  // ── Provider Card ────────────────────────────────────────────────────
  const ProviderCard = ({ item }) => {
    const name    = item?.userId?.name || 'Provider';
    const skills  = Array.isArray(item?.skills)
      ? item.skills.map(s => s?.name).filter(Boolean).join(' • ')
      : 'General Services';
    const rating  = Number(item?.rating?.average || 0).toFixed(1);
    const reviews = item?.rating?.count || 0;

    // ✅ Resolve categoryId and basePrice with clear priority
    const resolvedCategoryId   = selectedCat?._id   || item?.skills?.[0]?._id        || null;
    const resolvedCategoryName = selectedCat?.name   || item?.skills?.[0]?.name       || 'Service';
    const resolvedBasePrice    = selectedCat?.basePrice || item?.skills?.[0]?.basePrice || 499;
    const resolvedFee          = Math.round(resolvedBasePrice * 0.1);
    const resolvedTotal        = resolvedBasePrice + resolvedFee;

    return (
      <TouchableOpacity
        style={styles.provCard}
        onPress={() => navigation.navigate('ProviderDetail', {
          providerId:    item?._id,
          categoryId:    resolvedCategoryId,
          categoryName:  resolvedCategoryName,
          basePrice:     resolvedBasePrice,
          convenienceFee: resolvedFee,
          totalAmount:   resolvedTotal,
        })}
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={styles.provAvatarBox}>
          <Text style={styles.provAvatarText}>{name[0]?.toUpperCase()}</Text>
          <View style={[styles.onlineDot, { backgroundColor: item?.isOnline ? COLORS.success : COLORS.textTertiary }]} />
        </View>

        {/* Info */}
        <View style={styles.provInfo}>
          <Text style={styles.provName}>{name}</Text>
          <Text style={styles.provSkills} numberOfLines={1}>{skills}</Text>
          <View style={styles.provRatingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{rating}</Text>
            <Text style={styles.reviewText}>({reviews} reviews)</Text>
          </View>
        </View>

        {/* Right side */}
        <View style={styles.provRight}>
          {/* ✅ Real experience from DB */}
          <Text style={styles.provExp}>{item?.experience || 0}</Text>
          <Text style={styles.provExpLabel}>yrs exp</Text>
          <View style={styles.bookNowBtn}>
            <Text style={styles.bookNowText}>View</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.subGreeting}>What do you need help with?</Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search providers, services..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProviders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <ProviderCard item={item} />}
        onEndReached={() =>
          !provLoading && hasNextPage && coords &&
          fetchProviders(coords.latitude, coords.longitude, page + 1, selectedCat?._id)
        }
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListFooterComponent={
          provLoading && providers.length > 0
            ? <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.xl }} />
            : null
        }
        ListEmptyComponent={
          !provLoading
            ? <View style={styles.empty}>
                <Text style={styles.emptyIcon}>😕</Text>
                <Text style={styles.emptyText}>No providers found nearby</Text>
                <Text style={styles.emptySub}>
                  {selectedCat ? 'Try a different category or ' : ''}Pull down to refresh
                </Text>
                {selectedCat && (
                  <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilter}>
                    <Text style={styles.clearBtnText}>Clear Filter</Text>
                  </TouchableOpacity>
                )}
              </View>
            : <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Our Services</Text>
            {catLoading
              ? <ActivityIndicator color={COLORS.primary} style={{ margin: SPACING.xl }} />
              : <FlatList
                  horizontal
                  data={categories}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => <CategoryItem item={item} />}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catList}
                />
            }
            <View style={styles.provSectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCat ? `${selectedCat.name} Providers` : 'Nearby Providers'}
              </Text>
              {selectedCat && (
                <TouchableOpacity onPress={handleClearFilter} style={styles.clearFilterBtn}>
                  <Text style={styles.clearFilterText}>✕ Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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
  greeting:       { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subGreeting:    { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  profileAvatar:  { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  profileInitial: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.lg },

  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   COLORS.white,
    marginHorizontal:  SPACING.xl,
    marginTop:         SPACING.lg,
    marginBottom:      SPACING.sm,
    borderRadius:      BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth:       1,
    borderColor:       COLORS.border,
    ...SHADOWS.sm,
  },
  searchIcon:  { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, paddingVertical: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  clearSearch: { fontSize: 14, color: COLORS.textTertiary, padding: 4 },

  list:         { paddingBottom: SPACING.xxxl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: SPACING.xl, marginTop: SPACING.lg, marginBottom: SPACING.md },

  catList:          { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  catItem:          { width: 90, alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm },
  catItemActive:    { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  catIconBox:       { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  catIconBoxActive: { backgroundColor: COLORS.white },
  catEmoji:         { fontSize: 26 },
  catName:          { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  catNameActive:    { color: COLORS.primary },
  catPrice:         { fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },

  provSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.xl },
  clearFilterBtn:    { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
  clearFilterText:   { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600' },

  provCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.white,
    marginHorizontal: SPACING.xl,
    marginBottom:     SPACING.md,
    borderRadius:     BORDER_RADIUS.lg,
    padding:          SPACING.lg,
    ...SHADOWS.sm,
  },
  provAvatarBox:  { position: 'relative', marginRight: SPACING.md },
  provAvatarText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.primary },
  onlineDot:      { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: COLORS.white },
  provInfo:       { flex: 1 },
  provName:       { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  provSkills:     { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  provRatingRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star:           { color: '#F39C12', fontSize: FONT_SIZES.sm },
  ratingText:     { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 3 },
  reviewText:     { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginLeft: 3 },

  provRight:    { alignItems: 'center', gap: 2 },
  provExp:      { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  provExpLabel: { fontSize: 10, color: COLORS.textTertiary },
  bookNowBtn:   { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.sm, marginTop: 4 },
  bookNowText:  { fontSize: 10, color: COLORS.primary, fontWeight: '700' },

  empty:       { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
  emptyIcon:   { fontSize: 52, marginBottom: SPACING.lg },
  emptyText:   { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:    { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
  clearBtn:    { marginTop: SPACING.lg, backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round },
  clearBtnText:{ color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm },
});

export default HomeScreen;