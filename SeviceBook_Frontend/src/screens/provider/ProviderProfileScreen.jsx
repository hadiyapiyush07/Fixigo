import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const ProviderProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await providerAPI.getMyProfile();
      setProfile(res.data.data);
    } catch (e) {
      console.log('Error fetching profile', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <LoadingSkeleton height={150} style={{ margin: SPACING.lg }} />
        <LoadingSkeleton height={200} style={{ margin: SPACING.lg }} />
      </View>
    );
  }

  const uName = profile?.userId?.name || 'Provider Name';
  const uPhone = profile?.userId?.phone || '';
  const isVerified = profile?.isVerified;

  return (
    <View style={styles.safe}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} />}
        contentContainerStyle={styles.scroll}
      >
        <Card style={styles.headerCard}>
          <Avatar name={uName} size={80} />
          <Text style={styles.name}>{uName} {isVerified && '✅'}</Text>
          <Text style={styles.phone}>{uPhone}</Text>
          
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricVal}>⭐ {profile?.aggregateRating ? Number(profile.aggregateRating).toFixed(1) : 'New'}</Text>
              <Text style={styles.metricLabel}>Rating</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricVal}>💼 {profile?.completedJobs || 0}</Text>
              <Text style={styles.metricLabel}>Jobs Done</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricVal}>📅 {profile?.experience || 1} yr</Text>
              <Text style={styles.metricLabel}>Experience</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Professional Info" />
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoVal}>{profile?.bio || 'No bio added yet.'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Skills</Text>
            <Text style={styles.infoVal}>
              {profile?.skills?.length
                ? profile.skills.map(s => typeof s === 'object' && s !== null ? (s.name || '') : s).filter(Boolean).join(', ')
                : 'No skills listed.'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Working Radius</Text>
            <Text style={styles.infoVal}>{profile?.workingRadius || 10} km</Text>
          </View>
        </Card>

        <View style={styles.btnGroup}>
          <PrimaryButton title="Edit Profile" variant="primary" style={{ marginBottom: SPACING.md }} onPress={() => navigation.navigate('EditProviderProfile')} />
          <PrimaryButton title="Support" variant="secondary" style={{ marginBottom: SPACING.md }} />
          <PrimaryButton title="Logout" variant="danger" onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  headerCard: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  name: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.md },
  phone: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 4 },
  
  metricsRow: { flexDirection: 'row', marginTop: SPACING.xl, width: '100%', justifyContent: 'space-evenly' },
  metric: { alignItems: 'center' },
  metricVal: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary },
  metricLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4 },
  metricDivider: { width: 1, backgroundColor: COLORS.border, height: '80%' },

  infoRow: { marginBottom: SPACING.md },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 4 },
  infoVal: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.md },

  btnGroup: { marginTop: SPACING.xl }
});

export default ProviderProfileScreen;