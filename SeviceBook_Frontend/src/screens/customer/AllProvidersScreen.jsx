import { useTheme } from '../../theme/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Platform, TextInput
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

import { Avatar } from '../../components/ui/Avatar';
import { CheckCircle2, Star, Briefcase, Search, ArrowLeft } from 'lucide-react-native';

const AllProvidersScreen = ({ navigation, route }) => {
  const { colors: COLORS, shadows: SHADOWS, statusColors: STATUS_COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS, SHADOWS, STATUS_COLORS), [COLORS, SHADOWS, STATUS_COLORS]);

  const defaultCategory = route.params?.categoryId || null;

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      // Pass a large radius and limit to simulate "All" nearby for now
      const res = await providerAPI.getNearby({
        latitude: 21.1702, // default Surat
        longitude: 72.8311,
        ...(defaultCategory ? { categoryId: defaultCategory } : {}),
        page: 1,
        limit: 50,
      });
      let data = res?.data?.data || [];
      if (data.data) data = data.data; // Handle pagination wrapper
      
      // Sort explicitly
      data.sort((a, b) => {
        const aIsOnline = a.status === 'available';
        const bIsOnline = b.status === 'available';
        if (aIsOnline !== bIsOnline) return aIsOnline ? -1 : 1;
        const bRating = b.rating?.average || 0;
        const aRating = a.rating?.average || 0;
        return bRating - aRating;
      });
      setProviders(data);
    } catch (e) {
      console.warn("Failed to fetch all providers", e);
    } finally {
      setLoading(false);
    }
  }, [defaultCategory]);
  
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const filteredProviders = providers.filter(p => 
    (p.userId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.skills || []).some(s => s.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderProvider = ({ item }) => {
    const pName = item.userId?.name || 'Unknown';
    const rating = item.rating?.average ? Number(item.rating.average).toFixed(1) : 'New';
    const isOnline = item.status === 'available';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProviderDetail', { providerId: item._id })}
      >
        <View style={styles.cardHeader}>
          <Avatar name={pName} size={48} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.name}>{pName}</Text>
              {item.isVerified && <CheckCircle2 size={16} color={COLORS.primary} style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.experience}>{item.experience || 1} years experience</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textDisabled }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <View style={styles.skillsBox}>
          {item.skills?.slice(0, 3).map((s, idx) => (
            <View key={idx} style={styles.skillBadge}>
              <Text style={styles.skillText}>{s.name}</Text>
            </View>
          ))}
          {item.skills?.length > 3 && (
            <Text style={styles.skillMore}>+{item.skills.length - 3}</Text>
          )}
        </View>

        <View style={styles.metricsBox}>
          <View style={styles.metricRow}>
            <Star size={16} color={COLORS.star} fill={COLORS.star} />
            <Text style={styles.metricTxt}>{rating} Rating</Text>
          </View>
          <View style={styles.metricRow}>
            <Briefcase size={16} color={COLORS.textSecondary} />
            <Text style={styles.metricTxt}>{item.completedBookings || 0} Jobs</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Providers</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or skill..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={item => item._id}
          renderItem={renderProvider}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyTxt}>No providers found.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (COLORS, SHADOWS, STATUS_COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    margin: SPACING.lg, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.sm
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, color: COLORS.textPrimary },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  experience: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },
  
  statusBadge: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 6, 
    borderRadius: 8, gap: 6 
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },

  skillsBox: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, alignItems: 'center' },
  skillBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  skillText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  skillMore: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },

  metricsBox: { flexDirection: 'row', marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 24 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary }
});

export default AllProvidersScreen;
