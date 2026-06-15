// src/screens/customer/HomeScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useSelector } from 'react-redux';
import { categoryAPI } from '../../api/category.api';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Rating } from '../../components/common/StatusBadge';
import Geolocation from '@react-native-community/geolocation';

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector(s => s.auth);

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [provLoading, setProvLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    initScreen();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs your location to show nearby providers.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.log('Permission error:', e);
      return false;
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000,
        }
      );
    });
  };

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

  const fetchProviders = async (latitude, longitude, pageNum = 1, categoryId = null, reset = false) => {
    if (provLoading) return;
    if (!reset && !hasNextPage) return;

    setProvLoading(true);
    try {
      const res = await providerAPI.getNearby({
        latitude,
        longitude,
        ...(categoryId ? { categoryId } : {}),
        page: pageNum,
        limit: 10,
      });

      console.log('Nearby providers response:', JSON.stringify(res?.data, null, 2));

      const raw = res?.data;
      const payload = raw?.data || raw;
      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      const pagination = payload?.pagination || raw?.pagination || {};

      if (reset) setProviders(data);
      else setProviders(prev => [...prev, ...data]);

      setPage(pageNum);
      setHasNextPage(Boolean(pagination?.hasNextPage));
    } catch (e) {
      console.log('Providers error:', e.message);
      Alert.alert('Error', 'Could not load providers.');
    } finally {
      setProvLoading(false);
    }
  };

  const initScreen = async () => {
    await loadCategories();

    const permissionGranted = await requestLocationPermission();
    if (!permissionGranted) {
      Alert.alert('Permission', 'Location access is needed to find nearby providers.');
      return;
    }

    try {
      const location = await getCurrentLocation();
      setCoords(location);
      await fetchProviders(location.latitude, location.longitude, 1, null, true);
    } catch (error) {
      console.log('GPS Error:', error);
      Alert.alert('Location Error', 'Could not get your location.');
    }
  };

  const handleCategoryPress = async cat => {
    if (!coords) {
      Alert.alert('Location', 'Location is still loading.');
      return;
    }

    setSelectedCat(cat._id);
    setProviders([]);
    setPage(1);
    setHasNextPage(true);
    await fetchProviders(coords.latitude, coords.longitude, 1, cat._id, true);
  };

  const handleLoadMore = () => {
    if (!provLoading && hasNextPage && coords) {
      fetchProviders(coords.latitude, coords.longitude, page + 1, selectedCat);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCategories();

      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        Alert.alert('Permission', 'Location access is needed to find nearby providers.');
        return;
      }

      const location = await getCurrentLocation();
      setCoords(location);
      setSelectedCat(null);
      setPage(1);
      setHasNextPage(true);
      await fetchProviders(location.latitude, location.longitude, 1, null, true);
    } catch (error) {
      console.log('Refresh error:', error);
      Alert.alert('Error', 'Could not refresh data.');
    } finally {
      setRefreshing(false);
    }
  }, [hasNextPage, provLoading]);

  const CATEGORY_ICONS = useMemo(() => ({
    Electrician: '⚡',
    Plumber: '🔧',
    'AC Repair': '❄️',
    'Home Cleaning': '🧹',
    Painter: '🎨',
    Carpenter: '🪚',
    'Appliance Repair': '📺',
  }), []);

  const handleClearFilter = async () => {
    setSelectedCat(null);
    setProviders([]);
    setPage(1);
    setHasNextPage(true);
    if (coords) {
      await fetchProviders(coords.latitude, coords.longitude, 1, null, true);
    }
  };

  const CategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.catItem, selectedCat === item._id && styles.catItemActive]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.catIcon, selectedCat === item._id && styles.catIconActive]}>
        <Text style={styles.catEmoji}>{CATEGORY_ICONS[item.name] || '🔨'}</Text>
      </View>
      <Text style={[styles.catName, selectedCat === item._id && styles.catNameActive]}>
        {item.name}
      </Text>
      <Text style={styles.catPrice}>From ₹{item.basePrice}</Text>
    </TouchableOpacity>
  );

  const ProviderCard = ({ item }) => {
  const providerName = item?.userId?.name || 'Provider';

  return (
    <TouchableOpacity
      style={styles.provCard}
      onPress={() => navigation.navigate('ProviderDetail', { providerId: item?._id })}
      activeOpacity={0.9}
    >
      <View style={styles.provLeft}>
        <View style={styles.provAvatar}>
          <Text style={styles.provAvatarText}>
            {providerName?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      </View>

      <View style={styles.provInfo}>
        <Text style={styles.provName}>{providerName}</Text>
        <Text style={styles.provSkills} numberOfLines={1}>
          {typeof item?.skills === 'string'
            ? item.skills
            : Array.isArray(item?.skills)
              ? item.skills.map(s => s?.name).filter(Boolean).join(' • ')
              : 'General Services'}
        </Text>
        <Text style={styles.provSkills}>
          Rating: {String(item?.rating?.average || 0)} | Reviews: {String(item?.rating?.count || 0)}
        </Text>
      </View>

      <View style={styles.provRight}>
        <Text style={styles.provExp}>{item?.experience || 0} yrs</Text>
        <Text style={styles.provExpLabel}>exp</Text>
      </View>
    </TouchableOpacity>
  );
};

  const ListFooter = () => {
    if (!provLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const ListEmptyComponent = () => (
  <View style={styles.empty}>
    {provLoading ? (
      <>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.emptyText}>Loading providers...</Text>
      </>
    ) : (
      <>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={styles.emptyText}>No providers available nearby</Text>
        <Text style={styles.emptySubText}>Try moving the emulator location.</Text>
      </>
    )}
  </View>
);

  const renderProviderItem = useCallback(({ item }) => {
    return <ProviderCard item={item} />;
  }, [navigation]);

  const keyExtractor = useCallback(item => item._id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.subGreeting}>What service do you need today?</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={providers}
        keyExtractor={keyExtractor}
        renderItem={renderProviderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmptyComponent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Our Services</Text>

            {catLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ margin: SPACING.xl }} />
            ) : (
              <FlatList
                horizontal
                data={categories}
                keyExtractor={item => item._id}
                renderItem={({ item }) => <CategoryItem item={item} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catList}
              />
            )}

            <View style={styles.provHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCat
                  ? `${categories.find(c => c._id === selectedCat)?.name || ''} Providers`
                  : 'All Nearby Providers'}
              </Text>

              {selectedCat && (
                <TouchableOpacity onPress={handleClearFilter}>
                  <Text style={styles.clearFilter}>Clear filter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl + SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  greeting: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subGreeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  profileBtn: {},
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.lg },
  list: { paddingBottom: SPACING.xxxl, flexGrow: 1 },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  catList: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  catItem: {
    width: 88,
    marginHorizontal: SPACING.sm,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  catItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  catIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  catIconActive: { backgroundColor: COLORS.white },
  catEmoji: { fontSize: 26 },
  catName: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  catNameActive: { color: COLORS.primary },
  catPrice: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  provHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.xl },
  clearFilter: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '500' },
  provCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  provLeft: { marginRight: SPACING.md, position: 'relative' },
  provAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  provAvatarText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.primary },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  provInfo: { flex: 1 },
  provName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  provSkills: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4 },
  provRight: { alignItems: 'center' },
  provExp: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary },
  provExpLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg, gap: SPACING.sm },
  footerText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  empty: { alignItems: 'center', padding: SPACING.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.sm },
  emptySubText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});

export default HomeScreen;