// src/screens/customer/ProviderDetailScreen.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const ProviderDetailScreen = ({ navigation, route }) => {
  const providerId = route?.params?.providerId;

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProviderDetails = async () => {
    if (!providerId) {
      Alert.alert('Error', 'Provider ID missing');
      return;
    }

    try {
      setLoading(true);
      const res = await providerAPI.getById(providerId);
      const data = res?.data?.data || null;
      setProvider(data);
    } catch (e) {
      console.log('Provider detail error:', e);
      Alert.alert('Error', 'Could not load provider details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderDetails();
  }, [providerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProviderDetails();
    setRefreshing(false);
  };

  const providerName = provider?.userId?.name || 'Provider';
  const initial = providerName?.[0]?.toUpperCase() || '?';
  const skills = Array.isArray(provider?.skills)
    ? provider.skills.map(s => s?.name).filter(Boolean)
    : [];

  const serviceAreaText = useMemo(() => {
    const city = provider?.serviceArea?.city;
    const pincodes = Array.isArray(provider?.serviceArea?.pincodes) ? provider.serviceArea.pincodes : [];
    if (city && pincodes.length) return `${city} • ${pincodes.join(', ')}`;
    if (city) return city;
    if (pincodes.length) return pincodes.join(', ');
    return 'Service area not set';
  }, [provider]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading provider...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Text style={styles.name}>{providerName}</Text>
        <Text style={styles.subtitle}>
          {skills.length ? skills.join(' • ') : 'General Services'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{provider?.experience || 0}</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{provider?.rating?.average || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{provider?.rating?.count || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service area</Text>
        <Text style={styles.sectionText}>{serviceAreaText}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionText}>
          {provider?.bio || 'No bio available yet.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <Text style={styles.sectionText}>
          {provider?.availability?.isOnline ? 'Online now' : 'Currently offline'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <Text style={styles.sectionText}>
          {provider?.categoryId?.name || 'Not assigned'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => navigation.navigate('BookingDetail', { providerId })}
      >
        <Text style={styles.bookBtnText}>Book Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { marginTop: 4, color: COLORS.textSecondary, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  sectionText: { color: COLORS.textSecondary, lineHeight: 20 },
  bookBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  bookBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
});

export default ProviderDetailScreen;