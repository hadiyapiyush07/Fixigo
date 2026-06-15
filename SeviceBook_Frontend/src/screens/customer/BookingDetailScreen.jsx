import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const BookingDetailScreen = ({ navigation, route }) => {
  const providerId = route?.params?.providerId;

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) {
      Alert.alert('Error', 'Provider ID missing');
      setLoading(false);
      return;
    }
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const res = await providerAPI.getById(providerId);
      setProvider(res?.data?.data || null);
    } catch (e) {
      console.log('BookingDetail error:', e);
      Alert.alert('Error', 'Could not load booking details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Provider not found</Text>
      </View>
    );
  }

  const providerName = provider?.userId?.name || 'Provider';
  const skillsText = Array.isArray(provider?.skills)
    ? provider.skills.map(s => s?.name).filter(Boolean).join(', ')
    : 'General Services';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{providerName}</Text>
        <Text style={styles.subTitle}>{skillsText}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Experience</Text>
          <Text style={styles.value}>{provider?.experience || 0} years</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rating</Text>
          <Text style={styles.value}>{provider?.rating?.average || 0}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Reviews</Text>
          <Text style={styles.value}>{provider?.rating?.count || 0}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CreateBooking', { providerId })}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loaderText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  errorText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subTitle: { marginTop: 4, color: COLORS.textSecondary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: { color: COLORS.textSecondary },
  value: { color: COLORS.textPrimary, fontWeight: '600' },
  button: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: '700' },
});

export default BookingDetailScreen;