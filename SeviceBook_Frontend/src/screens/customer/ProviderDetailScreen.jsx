// src/screens/customer/ProviderDetailScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const ProviderDetailScreen = ({ navigation, route }) => {
  const providerId = route?.params?.providerId;
  const categoryId = route?.params?.categoryId;

  const [provider,   setProvider]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProvider = async () => {
    if (!providerId) {
      Alert.alert('Error', 'Provider not found');
      setLoading(false);
      return;
    }
    try {
      const res  = await providerAPI.getById(providerId);
      setProvider(res?.data?.data || res?.data || null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not load provider');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProvider(); }, [providerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProvider();
    setRefreshing(false);
  };

  const providerName = provider?.userId?.name  || 'Provider';
  const initial      = providerName[0]?.toUpperCase() || '?';
  const skills       = Array.isArray(provider?.skills) ? provider.skills.map(s => s?.name).filter(Boolean) : [];
  const rating       = Number(provider?.rating?.average || 0).toFixed(1);
  const reviews      = provider?.rating?.count || 0;

  const serviceAreaText = useMemo(() => {
    const city     = provider?.serviceArea?.city;
    const pins     = provider?.serviceArea?.pincodes || [];
    if (city && pins.length) return `${city} • ${pins.join(', ')}`;
    if (city)  return city;
    if (pins.length) return pins.join(', ');
    return 'Not specified';
  }, [provider]);

  const handleBookNow = () => {
    if (!providerId) {
      Alert.alert('Error', 'Cannot book at this time');
      return;
    }
    navigation.navigate('CreateBooking', {
      providerId,
      categoryId: categoryId || provider?.skills?.[0]?._id || null,
      providerName,
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
          {/* Online badge */}
          <View style={[styles.onlineBadge, { backgroundColor: provider?.isOnline ? COLORS.successLight : COLORS.background }]}>
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
          <Text style={styles.provSkills}>{skills.length ? skills.join(' • ') : 'General Services'}</Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={[styles.star, { color: i <= Math.round(Number(rating)) ? '#F39C12' : COLORS.border }]}>★</Text>
            ))}
            <Text style={styles.ratingText}>{rating} ({reviews} reviews)</Text>
          </View>

          {/* Stats */}
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
              <Text style={styles.statValue}>{provider?.isVerified ? '✓' : '✗'}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionText}>
            {provider?.bio || 'No bio available. This provider is ready to serve you.'}
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
                  {info.isOpen ? `${info.start || '09:00'} - ${info.end || '18:00'}` : 'Closed'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Book Now button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookBtn, !provider?.isOnline && styles.bookBtnOffline]}
          onPress={handleBookNow}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>
            {provider?.isOnline ? '📅 Book Now' : '📅 Book Anyway'}
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
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    paddingTop:      SPACING.xxxl,
    paddingBottom:   SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: BORDER_RADIUS.round, marginBottom: SPACING.lg },
  onlineDot:   { width: 8, height: 8, borderRadius: 4 },
  onlineText:  { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  avatarBox:   { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText:  { fontSize: 38, fontWeight: '800', color: COLORS.white },
  provName:    { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.white },
  provSkills:  { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  starsRow:    { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: 2 },
  star:        { fontSize: 20 },
  ratingText:  { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.9)', marginLeft: SPACING.sm },
  statsRow:    { flexDirection: 'row', marginTop: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  statBox:     { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  statValue:   { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },
  statLabel:   { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  section:      { backgroundColor: COLORS.white, marginHorizontal: SPACING.xl, marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sectionText:  { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag:     { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
  tagText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  dayRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  dayName:   { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500', textTransform: 'capitalize' },
  dayStatus: { fontSize: FONT_SIZES.sm, fontWeight: '600' },

  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg },
  bookBtn:         { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  bookBtnOffline:  { backgroundColor: COLORS.secondary },
  bookBtnText:     { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});

export default ProviderDetailScreen;