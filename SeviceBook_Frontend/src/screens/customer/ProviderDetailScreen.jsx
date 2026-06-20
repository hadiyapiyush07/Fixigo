// src/screens/customer/ProviderDetailScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const ProviderDetailScreen = ({ navigation, route }) => {
  const providerId   = route?.params?.providerId;
  // ✅ FIX: receive categoryId, categoryName and basePrice from HomeScreen
  const categoryId   = route?.params?.categoryId;
  const categoryName = route?.params?.categoryName || 'Service';
  const basePrice    = route?.params?.basePrice    || 499;

  const [provider,   setProvider]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProvider = useCallback(async () => {
    if (!providerId) {
      Alert.alert('Error', 'Provider not found');
      setLoading(false);
      return;
    }
    try {
      const res = await providerAPI.getById(providerId);
      setProvider(res?.data?.data || res?.data || null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not load provider');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => { fetchProvider(); }, [fetchProvider]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProvider();
    setRefreshing(false);
  };

  const providerName = provider?.userId?.name || 'Provider';
  const initial      = providerName[0]?.toUpperCase() || '?';
  const skills       = Array.isArray(provider?.skills)
    ? provider.skills.map(s => s?.name).filter(Boolean)
    : [];
  const rating  = Number(provider?.rating?.average || 0).toFixed(1);
  const reviews = provider?.rating?.count || 0;

  const serviceAreaText = useMemo(() => {
    const city = provider?.serviceArea?.city;
    const pins = provider?.serviceArea?.pincodes || [];
    if (city && pins.length) return `${city} • ${pins.join(', ')}`;
    if (city) return city;
    if (pins.length) return pins.join(', ');
    return 'Not specified';
  }, [provider]);

  // ✅ FIX: resolve categoryId with clear priority chain
  // 1. categoryId from HomeScreen (user selected a category)
  // 2. First skill of this specific provider
  // 3. Show error if neither exists
  const resolvedCategoryId =
    categoryId ||
    provider?.skills?.[0]?._id ||
    null;

  const resolvedBasePrice =
    basePrice ||
    provider?.skills?.[0]?.basePrice ||
    499;

  const convenienceFee = Math.round(resolvedBasePrice * 0.1); // 10%
  const totalAmount    = resolvedBasePrice + convenienceFee;

  const handleBookNow = () => {
    if (!providerId) {
      Alert.alert('Error', 'Cannot book at this time. Please go back and try again.');
      return;
    }
    if (!resolvedCategoryId) {
      Alert.alert(
        'Select a Service',
        'Please go back and select a service category first before booking.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // ✅ FIX: pass all pricing data so CreateBookingScreen uses real DB values
    navigation.navigate('CreateBooking', {
      providerId,
      providerName,
      categoryId:    resolvedCategoryId,
      categoryName:  categoryName || provider?.skills?.[0]?.name || 'Service',
      basePrice:     resolvedBasePrice,
      convenienceFee,
      totalAmount,
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading provider...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loaderBox}>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={styles.emptyText}>Provider not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          {/* Back button */}
          <TouchableOpacity style={styles.backIconBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIconText}>‹</Text>
          </TouchableOpacity>

          {/* Online badge */}
          <View style={[styles.onlineBadge, { backgroundColor: provider?.isOnline ? '#E8FBF3' : '#F5F6FA' }]}>
            <View style={[styles.onlineDot, { backgroundColor: provider?.isOnline ? COLORS.success : COLORS.textTertiary }]} />
            <Text style={[styles.onlineText, { color: provider?.isOnline ? COLORS.success : COLORS.textTertiary }]}>
              {provider?.isOnline ? 'Online Now' : 'Offline'}
            </Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <Text style={styles.provName}>{providerName}</Text>
          <Text style={styles.provSkills}>{skills.length ? skills.join(' • ') : categoryName}</Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Text key={i} style={[styles.star, { color: i <= Math.round(Number(rating)) ? '#F39C12' : 'rgba(255,255,255,0.3)' }]}>★</Text>
            ))}
            <Text style={styles.ratingText}>{rating} ({reviews} reviews)</Text>
          </View>

          {/* Stats — real data from DB */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{provider?.experience || 0}</Text>
              <Text style={styles.statLabel}>Yrs Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{provider?.completedBookings || 0}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{provider?.isVerified ? '✓' : '—'}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Pricing card — real data from DB */}
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>💰 Estimated Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{categoryName}</Text>
            <Text style={styles.priceVal}>₹{resolvedBasePrice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Convenience Fee (10%)</Text>
            <Text style={styles.priceVal}>₹{convenienceFee}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total Estimate</Text>
            <Text style={styles.priceTotalVal}>₹{totalAmount}</Text>
          </View>
          <Text style={styles.priceNote}>* Final price may vary based on scope of work</Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionText}>
            {provider?.bio || 'This provider is ready to serve you with professional-grade service.'}
          </Text>
        </View>

        {/* Service area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Service Area</Text>
          <Text style={styles.sectionText}>{serviceAreaText}</Text>
        </View>

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Skills</Text>
            <View style={styles.tagsRow}>
              {skills.map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Availability</Text>
          {DAYS.map(day => {
            const info = provider?.availability?.[day];
            if (!info) return null;
            return (
              <View key={day} style={styles.dayRow}>
                <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Text style={[styles.dayStatus, { color: info.isOpen ? COLORS.success : COLORS.textTertiary }]}>
                  {info.isOpen ? `${info.start || '09:00'} — ${info.end || '18:00'}` : 'Closed'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed Book Now button */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Starting from</Text>
          <Text style={styles.footerPriceValue}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, !provider?.isOnline && styles.bookBtnOffline]}
          onPress={handleBookNow}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>
            {provider?.isOnline ? '📅 Book Now' : '📅 Schedule Anyway'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  content:     { paddingBottom: SPACING.xxxl },
  loaderBox:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loaderText:  { marginTop: SPACING.md, color: COLORS.textSecondary },
  emptyIcon:   { fontSize: 52, marginBottom: SPACING.lg },
  emptyText:   { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, fontWeight: '600' },
  backBtn:     { marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  backBtnText: { color: COLORS.white, fontWeight: '700' },

  heroCard: {
    backgroundColor:   COLORS.primary,
    alignItems:        'center',
    paddingTop:        SPACING.xl,
    paddingBottom:     SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  backIconBtn:  { position: 'absolute', top: SPACING.xl, left: SPACING.xl, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  backIconText: { fontSize: 22, color: COLORS.white, fontWeight: '300', lineHeight: 22 },

  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: BORDER_RADIUS.round, marginBottom: SPACING.lg, marginTop: SPACING.xxxl },
  onlineDot:   { width: 8, height: 8, borderRadius: 4 },
  onlineText:  { fontSize: FONT_SIZES.xs, fontWeight: '700' },

  avatarBox:  { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 38, fontWeight: '800', color: COLORS.white },
  provName:   { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.white },
  provSkills: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },

  starsRow:   { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: 2 },
  star:       { fontSize: 18 },
  ratingText: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.9)', marginLeft: SPACING.sm },

  statsRow:    { flexDirection: 'row', marginTop: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, width: '100%' },
  statBox:     { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  statValue:   { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },
  statLabel:   { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  priceCard: {
    backgroundColor:  COLORS.white,
    marginHorizontal: SPACING.xl,
    marginTop:        SPACING.lg,
    borderRadius:     BORDER_RADIUS.lg,
    padding:          SPACING.lg,
    borderWidth:      1,
    borderColor:      COLORS.border,
    ...SHADOWS.sm,
  },
  priceTitle:      { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  priceRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  priceVal:        { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' },
  priceDivider:    { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  priceTotalLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  priceTotalVal:   { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.primary },
  priceNote:       { fontSize: 10, color: COLORS.textTertiary, marginTop: SPACING.sm },

  section:      { backgroundColor: COLORS.white, marginHorizontal: SPACING.xl, marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sectionText:  { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag:     { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
  tagText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  dayRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  dayName:   { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500', textTransform: 'capitalize' },
  dayStatus: { fontSize: FONT_SIZES.sm, fontWeight: '600' },

  footer: {
    position:          'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor:   COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingVertical:   SPACING.lg,
    borderTopWidth:    1,
    borderTopColor:    COLORS.border,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    ...SHADOWS.lg,
  },
  footerPrice:      { flex: 1 },
  footerPriceLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  footerPriceValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  bookBtn:          { flex: 2, backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  bookBtnOffline:   { backgroundColor: '#636E72' },
  bookBtnText:      { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
});

export default ProviderDetailScreen;