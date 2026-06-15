// src/screens/customer/CreateBookingScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const CreateBookingScreen = ({ navigation, route }) => {
  const {providerId} = route?.params?.providerId;
  const [loading, setLoading] = useState(false);

  const createBooking = async () => {
    try {
      setLoading(true);

      // TODO: replace with real booking API call
      // const res = await bookingAPI.create({ providerId, ...payload });

      navigation.navigate('BookingTrack', { bookingId: 'temp-booking-id' });
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Booking</Text>
      <Text style={styles.text}>Provider ID: {providerId}</Text>

      <TouchableOpacity style={styles.btn} onPress={createBooking} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Confirm Booking</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: SPACING.xl, backgroundColor: COLORS.background },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', marginBottom: SPACING.md },
  text: { color: COLORS.textPrimary, marginBottom: SPACING.xl },
  btn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '700' },
});

export default CreateBookingScreen;