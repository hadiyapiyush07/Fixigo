import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Platform, TextInput
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const AllProvidersScreen = ({ navigation, route }) => {
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
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return (b.aggregateRating || 0) - (a.aggregateRating || 0);
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
    const rating = item.aggregateRating ? Number(item.aggregateRating).toFixed(1) : 'New';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProviderDetail', { providerId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}><Text style={{ fontSize: 24 }}>🧑‍🔧</Text></View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.name}>{pName}</Text>
              {item.isVerified && <Text style={{ fontSize: 12, marginLeft: 4 }}>✅</Text>}
            </View>
            <Text style={styles.experience}>{item.experience || 1} years experience</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.isOnline ? '🟢 Online' : '⚪ Offline'}</Text>
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
          <Text style={styles.metric}>⭐ {rating} Rating</Text>
          <Text style={styles.metric}>💼 {item.completedJobs || 0} Jobs</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 24, color: '#111827' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Providers</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    margin: SPACING.lg, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB'
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, color: '#111827' },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },

  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#F3F4F6', ...SHADOWS.sm, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  experience: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#374151' },

  skillsBox: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, alignItems: 'center' },
  skillBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  skillText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  skillMore: { fontSize: 12, color: '#6B7280', marginBottom: 6 },

  metricsBox: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metric: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginRight: 16 }
});

export default AllProvidersScreen;
