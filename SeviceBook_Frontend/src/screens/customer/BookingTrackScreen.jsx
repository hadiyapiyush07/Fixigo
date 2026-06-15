// src/screens/customer/BookingTrackScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const BookingTrackScreen = ({ route }) => {
  const { bookingId } = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      // TODO: replace with bookingAPI.getById(bookingId)
      setBooking({
        _id: bookingId,
        status: 'pending',
        providerId: { userId: { name: 'Sample Provider' } },
      });
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Could not load booking tracking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Booking Tracking</Text>
        <Text style={styles.text}>Booking ID: {booking?._id}</Text>
        <Text style={styles.text}>Status: {booking?.status}</Text>
        <Text style={styles.text}>Provider: {booking?.providerId?.userId?.name}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', marginBottom: SPACING.md },
  text: { marginTop: 8, color: COLORS.textPrimary },
});

export default BookingTrackScreen;