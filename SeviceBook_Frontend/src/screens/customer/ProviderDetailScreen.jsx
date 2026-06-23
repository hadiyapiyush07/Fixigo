import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl,
  SafeAreaView
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const ProviderDetailScreen = ({ navigation, route }) => {
  const { providerId } = route.params;

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProvider = useCallback(async () => {
    try {
      const res = await providerAPI.getById(providerId);
      setProvider(res?.data?.data || res?.data || null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not load provider profile');
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

  const handleBookNow = () => {
    // Navigate to category selection or directly to booking
    // For now, redirect to Home to select a service
    Alert.alert(
      'Instant Booking',
      'Please select a service category from the Home Screen to book an instant service. Providers are assigned automatically based on proximity!',
      [{ text: 'Go Home', onPress: () => navigation.navigate('Home') }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: COLORS.textSecondary }}>Provider not found.</Text>
      </View>
    );
  }

  const pName = provider.userId?.name || 'Professional';
  const rating = provider.aggregateRating ? Number(provider.aggregateRating).toFixed(1) : 'New';
  const reviewsCount = provider.totalReviews || 0;
  const jobs = provider.completedJobs || 0;
  const skills = Array.isArray(provider.skills) ? provider.skills : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* COVER PHOTO */}
        <View style={styles.coverPhoto}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 24, color: '#FFF' }}>←</Text>
          </TouchableOpacity>
        </View>

        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 40 }}>🧑‍🔧</Text>
            </View>
            {provider.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={{ fontSize: 10 }}>✅</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{pName}</Text>
          <Text style={styles.experience}>{provider.experience || 1} Years Experience</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>⭐ {rating}</Text>
              <Text style={styles.metricLabel}>{reviewsCount} Reviews</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>💼 {jobs}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{provider.isOnline ? '🟢' : '⚪'}</Text>
              <Text style={styles.metricLabel}>{provider.isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        {/* BIO SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {pName.split(' ')[0]}</Text>
          <Text style={styles.bioText}>
            {provider.bio || `Hi, I am ${pName}. I am a highly skilled professional with ${provider.experience || 1} years of experience in delivering top-notch home services. I ensure 100% customer satisfaction.`}
          </Text>
        </View>

        {/* SERVICES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.skillsWrapper}>
            {skills.map((s, idx) => {
              // s.icon may be an object {url, publicId} from Cloudinary — use emoji fallback
              const iconEmoji = typeof s.icon === 'string' ? s.icon : '🔧';
              const skillName = typeof s.name === 'string' ? s.name : String(s.name || '');
              return (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillIcon}>{iconEmoji}</Text>
                  <Text style={styles.skillText}>{skillName}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Working Radius</Text>
            <Text style={styles.detailValue}>{provider.workingRadius || 10} km</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Languages</Text>
            <Text style={styles.detailValue}>English, Hindi</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FIXED BOTTOM BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow} activeOpacity={0.8}>
          <Text style={styles.bookBtnText}>Book a Service Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  coverPhoto: {
    height: 180, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    paddingTop: 50, paddingHorizontal: 20
  },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  profileSection: {
    alignItems: 'center', marginTop: -60, paddingHorizontal: SPACING.lg
  },
  avatarWrapper: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF',
    padding: 4, elevation: 5, ...SHADOWS.md, marginBottom: 12
  },
  avatar: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 56, alignItems: 'center', justifyContent: 'center'
  },
  verifiedBadge: {
    position: 'absolute', bottom: 4, right: 12, backgroundColor: '#FFF', borderRadius: 12,
    padding: 2, elevation: 2
  },
  name: { fontSize: 24, fontWeight: '800', color: '#111827' },
  experience: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  metricsRow: {
    flexDirection: 'row', width: '100%', backgroundColor: '#F9FAFB', borderRadius: 16,
    paddingVertical: 16, marginTop: 24, borderWidth: 1, borderColor: '#F3F4F6'
  },
  metricCard: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#111827' },
  metricLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  metricDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

  section: { paddingHorizontal: SPACING.lg, marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  bioText: { fontSize: 15, color: '#4B5563', lineHeight: 24 },

  skillsWrapper: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10
  },
  skillIcon: { fontSize: 16, marginRight: 6 },
  skillText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLabel: { fontSize: 15, color: '#6B7280' },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#111827' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', padding: SPACING.lg, paddingBottom: 30,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', ...SHADOWS.md
  },
  bookBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});

export default ProviderDetailScreen;